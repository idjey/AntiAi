import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from '../src/modules/attestations/services/rate-limit.service';
import { InjectRedis, REDIS_TOKEN } from '../src/modules/redis/redis.module';
import { IdentityStatus } from '@prisma/client';
import { AttestationError } from '../src/modules/attestations/errors/attestation-errors';

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;
  
  // Mock Redis
  let mockRedisClient: any;

  beforeEach(async () => {
    mockRedisClient = {
      eval: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: REDIS_TOKEN,
          useValue: mockRedisClient
        }
      ],
    }).compile();

    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  it('allows 5 sequential requests, blocks 6th (ACTIVE)', async () => {
    // 5 passes (10 evals)
    for (let i = 0; i < 10; i++) mockRedisClient.eval.mockResolvedValueOnce([0, 0]);
    // 6th fails (returns limited=1 on the first eval)
    mockRedisClient.eval.mockResolvedValueOnce([1, 1000]);

    const ident = { id: 'test-user', status: IdentityStatus.ACTIVE } as any;

    for (let i = 0; i < 5; i++) {
      await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    }

    await expect(rateLimitService.consume(ident.id, ident.status)).rejects.toThrow(AttestationError);
  });

  it('blocks 3rd request for PROBATION identity', async () => {
    // 2 passes (4 evals)
    for (let i = 0; i < 4; i++) mockRedisClient.eval.mockResolvedValueOnce([0, 0]);
    // 3rd fails
    mockRedisClient.eval.mockResolvedValueOnce([1, 1000]);

    const ident = { id: 'test-probation', status: IdentityStatus.PROBATION } as any;

    await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    await expect(rateLimitService.consume(ident.id, ident.status)).rejects.toThrow(AttestationError);
  });

  it('handles 10 concurrent requests correctly', async () => {
    // 10 concurrent requests = 20 evals. 
    // Let's say first 5 succeed (10 evals of [0, 0]), next 5 fail (5 evals of [1, 1000]).
    for (let i = 0; i < 10; i++) mockRedisClient.eval.mockResolvedValueOnce([0, 0]);
    for (let i = 0; i < 5; i++) mockRedisClient.eval.mockResolvedValueOnce([1, 1000]);

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
