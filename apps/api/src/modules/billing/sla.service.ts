import { Injectable } from '@nestjs/common';
import { PlanTier } from '@prisma/client';

export interface RateLimitConfig {
  limit: number;
  ttl: number; // in milliseconds
}

@Injectable()
export class SlaService {
  /**
   * Maps a PlanTier to a BullMQ job priority.
   * Lower number means higher priority. Default is 0 (no priority).
   * 
   * enterprise: 1
   * elite: 2
   * business: 3
   * pro: 4
   * free: 5
   */
  getQueuePriority(tier: PlanTier): number {
    switch (tier) {
      case PlanTier.enterprise: return 1;
      case PlanTier.elite: return 2;
      case PlanTier.business: return 3;
      case PlanTier.pro: return 4;
      case PlanTier.free: return 5;
      default: return 5;
    }
  }

  /**
   * Returns rate limits for API endpoints based on tier.
   * Free: 10 req/min
   * Pro: 50 req/min
   * Business: 100 req/min
   * Elite: 500 req/min
   * Enterprise: 1000 req/min
   */
  getRateLimit(tier: PlanTier): RateLimitConfig {
    const minute = 60000;
    switch (tier) {
      case PlanTier.enterprise: return { limit: 1000, ttl: minute };
      case PlanTier.elite: return { limit: 500, ttl: minute };
      case PlanTier.business: return { limit: 100, ttl: minute };
      case PlanTier.pro: return { limit: 50, ttl: minute };
      case PlanTier.free: return { limit: 10, ttl: minute };
      default: return { limit: 10, ttl: minute };
    }
  }

  getDefaultRateLimit(): RateLimitConfig {
    return this.getRateLimit(PlanTier.free);
  }
}
