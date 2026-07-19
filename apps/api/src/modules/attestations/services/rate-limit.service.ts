import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '../../redis/redis.module';
import { AttestationError } from '../errors/attestation-errors';
import { randomUUID } from 'crypto';

interface RateLimitConfig { perMinute: number; perHour: number; }

const LIMITS: Record<'ACTIVE' | 'PROBATION', RateLimitConfig> = {
  ACTIVE:    { perMinute: 5, perHour: 15 },
  PROBATION: { perMinute: 2, perHour: 7 },
};

@Injectable()
export class RateLimitService {
  constructor(@InjectRedis() private redis: Redis) {}

  async consume(identityId: string, status: 'ACTIVE' | 'PROBATION'): Promise<void> {
    const cfg = LIMITS[status];
    const now = Date.now();

    // Atomic check-and-add via Lua: prune expired, count, reject-or-add.
    const script = `
      local key, now, windowMs, limit, member = KEYS[1], tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), ARGV[4]
      redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
      local count = redis.call('ZCARD', key)
      if count >= limit then
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        return {1, tonumber(oldest[2]) + windowMs - now}   -- {limited, retryAfterMs}
      end
      redis.call('ZADD', key, now, member)
      redis.call('PEXPIRE', key, windowMs)
      return {0, 0}
    `;

    for (const [suffix, windowMs, limit] of [
      ['1m', 60_000, cfg.perMinute],
      ['1h', 3_600_000, cfg.perHour],
    ] as const) {
      const result = await this.redis.eval(
        script, 1, `rl:att:${identityId}:${suffix}`,
        now, windowMs, limit, `${now}:${randomUUID()}`,
      );
      
      const [limited, retryAfterMs] = result as [number, number];
      if (limited === 1) {
        throw new AttestationError('RATE_LIMITED', 429, { window: suffix, retryAfterMs });
      }
    }
  }
}
