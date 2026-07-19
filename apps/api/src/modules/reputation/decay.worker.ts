import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { ConfigService } from './config.service';

@Injectable()
@Processor('decay-worker')
export class DecayWorker extends WorkerHost {
  private readonly logger = new Logger(DecayWorker.name);

  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
    private config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Running weekly decay worker...');

    const cfg = await this.config.active();
    if (!cfg.params.flags.liveSlashing) {
      this.logger.log('Skipping decay: liveSlashing is disabled.');
      return;
    }

    const decayMultiplier = (cfg.params.slash as any).decayRate || 0.995; 
    const baseReputation = (cfg.params as any).initialReputation || 0.10; // R0

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const inactiveIdentities = await this.prisma.verifierIdentity.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
        status: { in: ['ACTIVE', 'PROBATION'] }
      },
    });

    for (const identity of inactiveIdentities) {
      if (identity.reputation <= baseReputation) continue;

      // Calculate R = max(R0, R * 0.995)
      const decayedR = Math.max(baseReputation, identity.reputation * decayMultiplier);
      const delta = decayedR - identity.reputation; // Will be negative

      if (delta >= 0) continue; // safety check

      // Create DECAY event
      try {
        await this.ledger.apply({
          identityId: identity.id,
          type: 'DECAY',
          delta: delta,
        });
        this.logger.debug(`Decayed ${identity.id} from ${identity.reputation} to ${decayedR} (delta: ${delta})`);
      } catch (err) {
        this.logger.error(`Failed to decay identity ${identity.id}: ${err.message}`);
      }
    }

    this.logger.log(`Decay worker complete. Processed ${inactiveIdentities.length} identities.`);
  }
}
