import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReputationEventType } from '@prisma/client';
import { ConfigService } from './config.service';
import { IdentityCacheService } from '../attestations/services/identity-cache.service';

export interface NewReputationEvent {
  identityId: string;
  type: ReputationEventType;
  delta: number;
  attestationId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LedgerService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private identityCache: IdentityCacheService,
  ) {}

  /**
   * Applies a reputation event to an identity's ledger.
   * Uses an advisory lock to serialize concurrent settlements for the same identity.
   */
  async apply(event: NewReputationEvent): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Serialize per identity — concurrent settlements on one verifier must not race.
      // Postgres advisory lock keyed on identity id (hashed to bigint):
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${event.identityId}))`;

      const identity = await tx.verifierIdentity.findUniqueOrThrow({
        where: { id: event.identityId },
        select: { id: true, keyId: true, reputation: true, status: true },
      });

      const cfg = await this.config.active();
      
      const rawAfter = identity.reputation + event.delta;
      const after = Math.min(1, Math.max(0, rawAfter)); // R ∈ [0,1], always

      await tx.reputationEvent.create({
        data: {
          identityId: event.identityId,
          type: event.type,
          delta: after - identity.reputation, // store the APPLIED delta post-clamp
          reputationAfter: after,
          attestationId: event.attestationId,
          metadata: { ...event.metadata, configVersion: cfg.id },
        },
      });

      const status = after < cfg.params.suspensionFloor ? 'SUSPENDED' : identity.status;
      
      await tx.verifierIdentity.update({
        where: { id: event.identityId },
        data: { reputation: after, status },
      });

      if (status !== identity.status) {
        await this.identityCache.bust(identity.keyId); // Phase 1 cache invalidation hook
      }
    });
  }

  /**
   * Writes a reputation event as purely shadow metadata (no mutation of R, no suspension).
   */
  async applyShadow(event: NewReputationEvent): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${event.identityId}))`;

      const identity = await tx.verifierIdentity.findUniqueOrThrow({
        where: { id: event.identityId },
        select: { reputation: true },
      });

      const cfg = await this.config.active();
      
      const rawAfter = identity.reputation + event.delta;
      const after = Math.min(1, Math.max(0, rawAfter));

      // We still record the event, but we mark it explicitly as a shadow event
      // We do NOT update VerifierIdentity.
      await tx.reputationEvent.create({
        data: {
          identityId: event.identityId,
          type: event.type,
          delta: 0, // 0 actual delta applied
          reputationAfter: identity.reputation, // reputation did not change
          attestationId: event.attestationId,
          metadata: { 
            ...event.metadata, 
            configVersion: cfg.id,
            shadowDelta: after - identity.reputation,
            shadowReputationAfter: after,
            shadowSlashing: true
          },
        },
      });
    });
  }
}
