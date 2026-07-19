import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from '../src/modules/attestations/services/rate-limit.service';
import { InjectRedis, REDIS_TOKEN } from '../src/modules/redis/redis.module';
import { IdentityStatus } from '@prisma/client';

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
    // 5 passes
    mockRedisClient.eval.mockResolvedValueOnce(1);
    mockRedisClient.eval.mockResolvedValueOnce(2);
    mockRedisClient.eval.mockResolvedValueOnce(3);
    mockRedisClient.eval.mockResolvedValueOnce(4);
    mockRedisClient.eval.mockResolvedValueOnce(5);
    // 6th fails (returns 6, > limit 5)
    mockRedisClient.eval.mockResolvedValueOnce(6);

    const ident = { id: 'test-user', status: IdentityStatus.ACTIVE } as any;

    for (let i = 0; i < 5; i++) {
      await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    }

    await expect(rateLimitService.consume(ident.id, ident.status)).rejects.toThrow('RATE_LIMITED');
  });

  it('blocks 3rd request for PROBATION identity', async () => {
    // 2 passes
    mockRedisClient.eval.mockResolvedValueOnce(1);
    mockRedisClient.eval.mockResolvedValueOnce(2);
    // 3rd fails
    mockRedisClient.eval.mockResolvedValueOnce(3);

    const ident = { id: 'test-probation', status: IdentityStatus.PROBATION } as any;

    await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    await expect(rateLimitService.consume(ident.id, ident.status)).resolves.toBeUndefined();
    await expect(rateLimitService.consume(ident.id, ident.status)).rejects.toThrow('RATE_LIMITED');
  });

  it('handles 10 concurrent requests correctly', async () => {
    // Simulate Lua script atomic increment returns 1..10
    const results = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    results.forEach(val => mockRedisClient.eval.mockResolvedValueOnce(val));

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
