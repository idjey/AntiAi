import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../reputation/config.service';
import { LedgerService } from '../reputation/ledger.service';
import { MinimalAttestation } from '../aggregation/reducers/evidence-reducers';
import { AttestationClaim, GroundTruth, classify } from '../settlement/classification-matrix';

@Injectable()
export class CanariesService {
  private readonly logger = new Logger(CanariesService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ledger: LedgerService,
  ) {}

  /**
   * Called synchronously during attestation ingestion.
   */
  async processCanaryIfMatch(subjectHash: string, attestationId: string): Promise<void> {
    const canary = await this.prisma.canaryTask.findUnique({
      where: { subjectHash },
    });

    if (!canary || !canary.active) return; // Not a canary task

    const attestation = await this.prisma.attestation.findUnique({
      where: { id: attestationId },
      include: { subject: true, attester: true },
    });

    if (!attestation) return;

    // Evaluate response
    const claimObj: AttestationClaim = {
      id: attestation.id,
      claimType: attestation.claimType as any,
      claimPayload: attestation.claimPayload,
    };
    
    // Canary ground truth acts like a machine-verified provenance or admin override
    const truth: GroundTruth = canary.groundTruth as unknown as GroundTruth;

    const verdict = classify(claimObj, truth);
    if (verdict === 'NOT_ADDRESSED') return;

    const correct = verdict === 'CORRECT';

    // Record response
    await this.prisma.$transaction(async tx => {
      // Create response
      await tx.canaryResponse.upsert({
        where: {
          canaryId_identityId: {
            canaryId: canary.id,
            identityId: attestation.attesterId,
          }
        },
        create: {
          canaryId: canary.id,
          identityId: attestation.attesterId,
          correct,
          claimEcho: attestation.claimPayload as any,
        },
        update: {
          correct,
          claimEcho: attestation.claimPayload as any,
        }
      });

      await tx.canaryTask.update({
        where: { id: canary.id },
        data: { servedCount: { increment: 1 } },
      });
    });

    const cfg = await this.config.active();

    // Apply ledger effect
    if (cfg.params.flags.liveSlashing) {
      const slashAmount = (cfg.params.slash as any).canaryFail || 20;
      await this.ledger.apply({
        identityId: attestation.attesterId,
        type: correct ? 'CANARY_PASS' : 'CANARY_FAIL',
        delta: correct 
          ? (cfg.params.earn as any).canaryPass 
          : -slashAmount,
        attestationId: attestation.id,
      });
    }

    // Evaluate suspension / silent downweighting
    await this.evaluateRollingCanaryPerformance(attestation.attesterId, cfg.params);
  }

  private async evaluateRollingCanaryPerformance(identityId: string, params: any) {
    // Read the last N responses
    // According to Phase 2 spec:
    const windowSize = 20;
    const recent = await this.prisma.canaryResponse.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
      take: windowSize,
    });

    if (recent.length < windowSize) return; // Must have full 20 responses

    const correctCount = recent.filter(r => r.correct).length;
    const accuracy = correctCount / recent.length;

    const downweightThreshold = params.canary?.downweightAccuracy || 0.55;
    const suspendThreshold = params.canary?.suspendAccuracy || 0.35;

    // Silent downweighting logic
    const shouldBeDownweighted = accuracy < downweightThreshold;
    const shouldBeSuspended = accuracy < suspendThreshold;

    await this.prisma.verifierIdentity.update({
      where: { id: identityId },
      data: {
        canaryDownweighted: shouldBeDownweighted,
        ...(shouldBeSuspended ? { status: 'SUSPENDED' } : {})
      }
    });

    if (shouldBeSuspended) {
      this.logger.warn(`Identity ${identityId} suspended due to canary accuracy ${accuracy}`);
    }
  }

  // Admin endpoint handler
  async forceFailCanary(canaryId: string) {
    // For red-teaming: we might explicitly fail specific identities, 
    // but the spec just says "POST /canaries/:id/force-fail".
    // This could just mark the task inactive or manually trigger fails.
    return { status: 'Not implemented' };
  }
}
