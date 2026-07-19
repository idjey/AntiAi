import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectRedis } from '../../redis/redis.module';

@Injectable()
export class IdempotencyService {
  constructor(@InjectRedis() private redis: Redis, private prisma: PrismaService) {}

  private key(payloadHash: string) { return `att:idem:${payloadHash}`; }

  /** Returns existing attestation id if this envelope was already accepted. */
  async check(payloadHash: string): Promise<string | null> {
    const hit = await this.redis.get(this.key(payloadHash));
    if (hit) return hit;
    // Redis is a cache, not the source of truth — fall through to DB.
    const existing = await this.prisma.attestation.findUnique({
      where: { payloadHash }, select: { id: true },
    });
    if (existing) await this.redis.set(this.key(payloadHash), existing.id, 'EX', 86_400);
    return existing?.id ?? null;
  }

  async record(payloadHash: string, attestationId: string): Promise<void> {
    await this.redis.set(this.key(payloadHash), attestationId, 'EX', 86_400);
  }
}
