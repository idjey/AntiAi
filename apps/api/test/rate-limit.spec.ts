import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from '../src/modules/attestations/services/rate-limit.service';
import { RedisService } from '../src/modules/redis/redis.service';
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
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient
          }
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
      const res = await rateLimitService.checkRateLimit(ident);
      expect(res.allowed).toBe(true);
    }

    const blocked = await rateLimitService.checkRateLimit(ident);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeDefined();
  });

  it('blocks 3rd request for PROBATION identity', async () => {
    // 2 passes
    mockRedisClient.eval.mockResolvedValueOnce(1);
    mockRedisClient.eval.mockResolvedValueOnce(2);
    // 3rd fails
    mockRedisClient.eval.mockResolvedValueOnce(3);

    const ident = { id: 'test-probation', status: IdentityStatus.PROBATION } as any;

    const res1 = await rateLimitService.checkRateLimit(ident);
    expect(res1.allowed).toBe(true);

    const res2 = await rateLimitService.checkRateLimit(ident);
    expect(res2.allowed).toBe(true);

    const blocked = await rateLimitService.checkRateLimit(ident);
    expect(blocked.allowed).toBe(false);
  });

  it('handles 10 concurrent requests correctly', async () => {
    // Simulate Lua script atomic increment returns 1..10
    const results = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    results.forEach(val => mockRedisClient.eval.mockResolvedValueOnce(val));

    const ident = { id: 'test-concurrent', status: IdentityStatus.ACTIVE } as any;
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(rateLimitService.checkRateLimit(ident));
    }

    const outcomes = await Promise.all(promises);
    
    const allowed = outcomes.filter(o => o.allowed);
    const blocked = outcomes.filter(o => !o.allowed);

    expect(allowed.length).toBe(5);
    expect(blocked.length).toBe(5);
  });
});
