import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async increment(key: string, ttl: number): Promise<{ totalHits: number; timeToExpire: number }> {
    const hits = await this.redis.incr(key);
    if (hits === 1) {
      await this.redis.pexpire(key, ttl);
    }
    const pttl = await this.redis.pttl(key);
    return {
      totalHits: hits,
      timeToExpire: pttl > 0 ? pttl : ttl,
    };
  }
}
