import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../reputation/config.service';

import { ReputationParams } from '../reputation/types';

export interface LoadedAttestation {
  id: string;
  attesterId: string;
  attester: {
    reputation: number;
    deviceAttested: boolean;
    canaryDownweighted: boolean;
  };
}

@Injectable()
export class WeightsService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async for(attestations: LoadedAttestation[]): Promise<Map<string, number>> {
    const cfg = await this.config.active();
    
    // Fetch non-expired clusters overlapping with these identities
    const attesterIds = [...new Set(attestations.map(a => a.attesterId))];
    const rawClusters = await this.prisma.correlationCluster.findMany({
      where: {
        expiresAt: { gt: new Date() },
        memberIds: { hasSome: attesterIds },
      },
    });

    // Map cluster member arrays to Set<string> for O(1) lookups
    const clusters = rawClusters.map(c => new Set(c.memberIds));

    const raw = new Map<string, number>();
    const attesterMap = new Map<string, string>(); // attestationId -> attesterId

    for (const a of attestations) {
      const pf = a.attester.deviceAttested
        ? cfg.params.platformFactor.deviceAttested 
        : cfg.params.platformFactor.web;
      const canaryPenalty = a.attester.canaryDownweighted 
        ? cfg.params.canary.downweightFactor 
        : 1;
      
      const weight = Math.pow(a.attester.reputation, cfg.params.weightExponent) * pf * canaryPenalty;
      
      raw.set(a.id, weight);
      attesterMap.set(a.id, a.attesterId);
    }

    return this.applyClusterCompression(raw, attesterMap, clusters, cfg.params);
  }

  private applyClusterCompression(
    raw: Map<string, number>, 
    attesterMap: Map<string, string>,
    clusters: Set<string>[], 
    cfg: ReputationParams
  ): Map<string, number> {
    const compressed = new Map(raw);

    for (const cluster of clusters) {
      // Find attestations in this cluster
      const members = [...compressed.entries()].filter(([id]) => cluster.has(attesterMap.get(id)!));
      if (members.length < 2) continue; // single member present, no coordination discount needed

      const sum = members.reduce((s, [, w]) => s + w, 0);
      const OUTLIER_FACTOR = cfg.correlation.clusterOutlierFactor || 3.0;
      const shareExp = cfg.correlation.clusterShareExponent || 2.0;

      let remainingMembers = [...members];
      const finalWeights = new Map<string, number>();

      let extractedInPass = true;
      while (extractedInPass && remainingMembers.length > 0) {
        extractedInPass = false;
        const currentMean = remainingMembers.reduce((s, [, w]) => s + w, 0) / remainingMembers.length;
        
        const nextRemaining: typeof remainingMembers = [];
        for (const [id, w] of remainingMembers) {
          if (w > currentMean * OUTLIER_FACTOR) {
            // Outlier protected: keeps individual weight
            finalWeights.set(id, w);
            extractedInPass = true;
          } else {
            nextRemaining.push([id, w]);
          }
        }
        remainingMembers = nextRemaining;
      }

      // Remaining members constitute the coordinated bulk
      if (remainingMembers.length > 0) {
        if (remainingMembers.length === 1) {
          finalWeights.set(remainingMembers[0][0], remainingMembers[0][1]);
        } else {
          const bulkSum = remainingMembers.reduce((s, [, w]) => s + w, 0);
          
          // Factor recomputes cleanly on the sub-cluster size (bulk length),
          // severing it from the protected outliers completely.
          const factor = 1 / Math.pow(remainingMembers.length, cfg.correlation.clusterExponent);
          const targetTotal = bulkSum * factor;
          
          const shareBasis = remainingMembers.map(([id, w]) => [id, Math.pow(w, shareExp)] as [string, number]);
          const basisSum = shareBasis.reduce((s, [, b]) => s + b, 0);

          for (const [id, w] of remainingMembers) {
            const basis = shareBasis.find(([i]) => i === id)![1];
            const share = targetTotal * (basis / basisSum);
            finalWeights.set(id, Math.min(share, w));
          }
        }
      }

      // Map back to the compressed map
      for (const [id, w] of finalWeights) {
        compressed.set(id, w);
      }
    }

    return compressed;
  }
}
