import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectRedis } from '../../redis/redis.module';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CounterService {
  private readonly logger = new Logger(CounterService.name);

  constructor(
    @InjectRedis() private redis: Redis,
    private prisma: PrismaService,
  ) {}

  /**
   * Fire-and-forget counter bump on the hot path.
   * Does not block the HTTP response or contend for Postgres row locks.
   */
  async bumpCheck(subjectId: string): Promise<void> {
    try {
      await this.redis.hincrby('subj:checks:pending', subjectId, 1);
    } catch (e) {
      // Swallow silently — we don't break the hot path for analytics
    }
  }

  /**
   * Flushes accumulated checkCounts to Postgres every 60 seconds.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async flush(): Promise<void> {
    const pending = await this.redis.hgetall('subj:checks:pending');
    if (!Object.keys(pending).length) return;

    // Claim the batch first
    await this.redis.del('subj:checks:pending');

    try {
      await this.prisma.$transaction(
        Object.entries(pending).map(([id, n]) =>
          this.prisma.subject.update({
            where: { id },
            data: { checkCount: { increment: Number(n) } },
          }),
        ),
      );
    } catch (e) {
      this.logger.error('Failed to flush subject counters to DB', e);
      // In a real production system, you might want a dead-letter queue or retry mechanism
      // for failed flushes to ensure no analytics data is lost.
    }
  }
}
