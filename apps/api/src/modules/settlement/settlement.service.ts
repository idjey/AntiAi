import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../reputation/config.service';
import { LedgerService } from '../reputation/ledger.service';
import { VouchesService } from '../vouches/vouches.service';
import { classify, confidenceAtSettlement, GroundTruth, AttestationClaim } from './classification-matrix';

@Injectable()
export class SettlementService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ledger: LedgerService,
    private vouches: VouchesService,
  ) {}

  /**
   * Evaluates all open attestations for a subject against a new ground truth.
   */
  async settle(subjectHash: string, groundTruth: GroundTruth): Promise<void> {
    const subject = await this.prisma.subject.findUnique({
      where: { hash: subjectHash },
    });
    if (!subject) return;

    // Load open attestations and their net corroboration stats
    const openAttestations = await this.prisma.attestation.findMany({
      where: {
        subjectId: subject.id,
        status: { in: ['PENDING', 'CORROBORATED', 'DISPUTED'] },
      },
      include: {
        attester: { select: { reputation: true } },
        // To compute self-dispute, we need to check if they have a later corroboration that disputes this
        // but for now we'll do a simple query
      },
    });

    const cfg = await this.config.active();

    for (const att of openAttestations) {
      const claimObj: AttestationClaim = {
        id: att.id,
        claimType: att.claimType as any,
        claimPayload: att.claimPayload,
      };

      const verdict = classify(claimObj, groundTruth);
      if (verdict === 'NOT_ADDRESSED') continue;

      const newStatus = verdict === 'CORRECT' ? 'SETTLED_CORRECT' : 'SETTLED_INCORRECT';

      await this.prisma.attestation.update({
        where: { id: att.id },
        data: {
          status: newStatus,
          settledAt: new Date(),
        },
      });

      if (!cfg.params.flags.liveSlashing) {
        // Shadow slashing mode: Record what would have happened without applying it.
        const confidence = await this.calculateConfidence(att.id, att.payloadHash, att.attesterId, claimObj);
        const delta = verdict === 'CORRECT' 
          ? cfg.params.earn.settlementCorrect * (1 - att.attester.reputation)
          : -cfg.params.slash.base * att.attester.reputation * confidence;
        
        await this.ledger.applyShadow({
          identityId: att.attesterId,
          type: verdict === 'CORRECT' ? 'SETTLEMENT_CORRECT' : 'SETTLEMENT_INCORRECT',
          delta, // applyShadow will force actual applied delta to 0, but logs this shadowDelta
          attestationId: att.id,
          metadata: { confidence, groundTruthType: groundTruth.type },
        });
        continue; // Do NOT propagate vouch slashing in shadow mode
      }

      // Live mode
      if (verdict === 'CORRECT') {
        await this.ledger.apply({
          identityId: att.attesterId,
          type: 'SETTLEMENT_CORRECT',
          delta: cfg.params.earn.settlementCorrect * (1 - att.attester.reputation),
          attestationId: att.id,
        });
      } else {
        const confidence = await this.calculateConfidence(att.id, att.payloadHash, att.attesterId, claimObj);
        const delta = -cfg.params.slash.base * att.attester.reputation * confidence;
        
        await this.ledger.apply({
          identityId: att.attesterId,
          type: 'SETTLEMENT_INCORRECT',
          delta,
          attestationId: att.id,
          metadata: { confidence },
        });

        await this.vouches.propagateSlash(att.attesterId, Math.abs(delta), cfg.params);
      }
    }
  }

  private async calculateConfidence(
    attestationId: string,
    payloadHash: string, 
    attesterId: string, 
    claimObj: AttestationClaim
  ): Promise<number> {
    // Determine corroboration counts
    const corrs = await this.prisma.attestation.findMany({
      where: {
        claimType: 'CORROBORATION',
        claimPayload: { path: ['targetPayloadHash'], equals: payloadHash },
      },
    });

    let confirms = 0;
    let disputes = 0;
    let isSelfDispute = false;

    for (const c of corrs) {
      const payload: any = c.claimPayload;
      if (payload?.dispute === true) {
        disputes++;
        if (c.attesterId === attesterId) isSelfDispute = true;
      } else {
        confirms++;
      }
    }

    return confidenceAtSettlement(claimObj, confirms, disputes, isSelfDispute);
  }
}
