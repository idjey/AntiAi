import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from '../src/modules/attestations/services/rate-limit.service';
import { REDIS_TOKEN } from '../src/modules/redis/redis.module';
import { IdentityStatus } from '@prisma/client';
import { AttestationError } from '../src/modules/attestations/errors/attestation-errors';
import { Redis } from 'ioredis';

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;
  let redisClient: Redis;

  beforeAll(async () => {
    // Run against real Redis to exercise atomicity
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Test connection to fail fast if Redis isn't running
    try {
      await redisClient.ping();
    } catch (err) {
      console.warn('Redis is not running. Tests might fail or hang.');
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: REDIS_TOKEN,
          useValue: redisClient,
        }
      ],
    }).compile();

    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  beforeEach(async () => {
    await redisClient.flushdb();
  });

  it('allows 5 sequential requests, blocks 6th (ACTIVE)', async () => {
    const ident = { id: 'test-user', status: IdentityStatus.ACTIVE } as any;

    for (let i = 0; i < 5; i++) {
      await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    }

    await expect(rateLimitService.consume(ident.id, ident.status)).rejects.toThrow(AttestationError);
  });

  it('blocks 3rd request for PROBATION identity', async () => {
    const ident = { id: 'test-probation', status: IdentityStatus.PROBATION } as any;

    await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    await expect(rateLimitService.consume(ident.id, ident.status)).rejects.toThrow(AttestationError);
  });

  it('handles 10 concurrent requests correctly', async () => {
    const ident = { id: 'test-concurrent', status: IdentityStatus.ACTIVE } as any;
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(rateLimitService.consume(ident.id, ident.status).then(() => true).catch(() => false));
    }

    const outcomes = await Promise.all(promises);
    
    const allowed = outcomes.filter(o => o === true);
    const blocked = outcomes.filter(o => o === false);

    expect(allowed.length).toBe(5);
    expect(blocked.length).toBe(5);
  });
});
