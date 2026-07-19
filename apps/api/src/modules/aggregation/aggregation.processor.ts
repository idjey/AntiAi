import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { Redis } from 'ioredis';
import { InjectRedis } from '../redis/redis.module';
import { 
  indexCorroborations, 
  pickBestProvenance, 
  countByCategory, 
  topContextNotes,
  MinimalAttestation
} from './reducers/evidence-reducers';
import { 
  indexWeightedCorroborations, 
  pickBestWeightedProvenance, 
  weightedCountByCategory, 
  topWeightedContextNotes 
} from './reducers/weighted-reducers';
import { WeightsService } from './weights.service';
import { ConfigService } from '../reputation/config.service';

@Processor('aggregation')
export class AggregationProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
    private weights: WeightsService,
    private config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ subjectHash: string }>): Promise<void> {
    const { subjectHash } = job.data;
    
    const subject = await this.prisma.subject.findUnique({ 
      where: { hash: subjectHash } 
    });
    
    if (!subject) return;

    const rawAttestations = await this.prisma.attestation.findMany({
      where: { subjectId: subject.id, domain: 'PUBLIC' },
      include: { 
        attester: { 
          select: { keyId: true, status: true, reputation: true, deviceAttested: true, canaryDownweighted: true } 
        } 
      },
      orderBy: { receivedAt: 'asc' },
    });

    const attestations = rawAttestations as unknown as MinimalAttestation[];

    // 1. Corroborations index
    const corr = indexCorroborations(attestations);

    // 2. Compute Summary
    const summary = {
      signal: 'EARLY',
      computedAt: new Date().toISOString(),

      // INVARIANT SLOT — machine-verified provenance is structurally separate
      provenance: pickBestProvenance(attestations, corr),

      flags: countByCategory(attestations, 'ARTIFACT_FLAG', corr),

      contextNotes: topContextNotes(attestations, corr, 3),

      participation: {
        attestations: attestations.length,
        distinctAttesters: new Set(attestations.map(a => a.attester.keyId)).size,
        probationShare: attestations.length > 0 
          ? Number((attestations.filter(a => a.attester.status === 'PROBATION').length / attestations.length).toFixed(2))
          : 0,
      },
    };

    // 2.5 Shadow Engine evaluation
    const cfg = await this.config.active();
    if (cfg.params.flags.shadowMode || cfg.params.flags.liveWeighting) {
      const wMap = await this.weights.for(rawAttestations as any);
      const wCorr = indexWeightedCorroborations(attestations, wMap);
      
      const weightedSummary = {
        signal: 'EARLY',
        computedAt: new Date().toISOString(),
        provenance: pickBestWeightedProvenance(attestations, wCorr, wMap),
        flags: weightedCountByCategory(attestations, 'ARTIFACT_FLAG', wCorr, wMap),
        contextNotes: topWeightedContextNotes(attestations, wCorr, wMap, 3),
      };

      const flipped = JSON.stringify(summary.flags) !== JSON.stringify(weightedSummary.flags) ||
                      JSON.stringify(summary.provenance?.id) !== JSON.stringify(weightedSummary.provenance?.id) ||
                      JSON.stringify(summary.contextNotes) !== JSON.stringify(weightedSummary.contextNotes);

      await this.prisma.shadowVerdictDiff.create({
        data: {
          subjectId: subject.id,
          configVersion: cfg.id,
          baseline: summary as any,
          weighted: weightedSummary as any,
          divergence: { diff: 'computed offline' }, // Could be derived inline
          flipped,
        }
      });

      if (cfg.params.flags.liveWeighting) {
        Object.assign(summary, weightedSummary);
      }
    }

    // 3. Persist
    await this.prisma.subject.update({
      where: { id: subject.id },
      data: { 
        verdictSummary: summary as any, 
        attestationCount: attestations.length 
      },
    });

    // 4. Bust every read-side cache touching this subject
    const mediaTypeLower = subject.mediaType.toLowerCase();
    await this.redis.del(`resolve:${subject.hash}:${mediaTypeLower}`);
    await this.redis.del(`subject:${subject.hash}`);
    
    if (subject.perceptualHash) {
      await this.redis.del(`resolve:p:${subject.perceptualHash}:${mediaTypeLower}`);
    }
  }
}
