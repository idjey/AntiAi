import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Redis } from 'ioredis';
import { InjectRedis } from '../../redis/redis.module';
import { AttestationError } from '../errors/attestation-errors';

type CachedIdentity = {
  id: string;
  publicKey: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'PROBATION';
};

@Injectable()
export class IdentityCacheService {
  constructor(
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {}

  private key(keyId: string) { return `ident:${keyId}`; }

  /** Cached lookup: keyId → { id, publicKey, status }. TTL 60s; explicit bust on status change. */
  async resolve(keyId: string): Promise<CachedIdentity> {
    const cached = await this.redis.get(this.key(keyId));
    if (cached) return JSON.parse(cached);

    const identity = await this.prisma.verifierIdentity.findUnique({
      where: { keyId },
      select: { id: true, publicKey: true, status: true },
    });
    if (!identity) throw new AttestationError('UNKNOWN_KEY', 403);

    await this.redis.set(this.key(keyId), JSON.stringify(identity), 'EX', 60);
    return identity as CachedIdentity;
  }

  assertUsable(identity: CachedIdentity): void {
    if (identity.status === 'SUSPENDED') throw new AttestationError('IDENTITY_SUSPENDED', 403);
    if (identity.status === 'REVOKED')  throw new AttestationError('IDENTITY_REVOKED', 403);
    // PROBATION and ACTIVE both pass — probation affects rate + weight, not access.
  }

  /** Must be called by admin/reputation flows whenever status changes. */
  async bust(keyId: string) { await this.redis.del(this.key(keyId)); }
}
