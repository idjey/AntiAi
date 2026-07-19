import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../reputation/ledger.service';
import { ReputationParams } from '../reputation/types';

@Injectable()
export class VouchesService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  /**
   * Propagates a slash upwards through the vouch graph.
   */
  async propagateSlash(
    slasheeIdentityId: string, 
    initialPenaltyAmt: number, 
    cfg: ReputationParams
  ): Promise<void> {
    let currentVoucheeId = slasheeIdentityId;
    let currentPenalty = initialPenaltyAmt * 0.5;
    const visited = new Set<string>();

    while (currentPenalty >= 0.01) {
      // Find the active vouch where the current identity is the vouchee
      const vouch = await this.prisma.vouch.findUnique({
        where: { voucheeId: currentVoucheeId },
      });

      if (!vouch || !vouch.active) {
        break; // Graph root or inactive vouch
      }

      // Cycle detection: if a voucher is already in the chain, break to prevent infinite loops
      if (visited.has(vouch.voucherId)) {
        break;
      }
      visited.add(vouch.voucherId);

      const appliedPenalty = Math.max(currentPenalty, vouch.stakeAmount);

      await this.ledger.apply({
        identityId: vouch.voucherId,
        type: 'VOUCH_SLASH_PROPAGATION',
        delta: -appliedPenalty,
        metadata: {
          originalSlasheeId: slasheeIdentityId,
          vouchId: vouch.id,
        },
      });

      currentVoucheeId = vouch.voucherId;
      currentPenalty *= 0.5; // Halve the penalty for the next hop
    }
  }
}
