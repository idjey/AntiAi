import { MinimalAttestation, CorroborationIndex } from './evidence-reducers';

export interface WeightedCorroborationIndex {
  [targetPayloadHash: string]: {
    confirmsWeight: number;
    disputesWeight: number;
  };
}

export function indexWeightedCorroborations(
  attestations: MinimalAttestation[],
  weights: Map<string, number>
): WeightedCorroborationIndex {
  const index: WeightedCorroborationIndex = {};
  for (const a of attestations) {
    if (a.claimType === 'CORROBORATION' && a.claimPayload?.targetPayloadHash) {
      const target = a.claimPayload.targetPayloadHash;
      const w = weights.get(a.id) || 0;
      if (!index[target]) index[target] = { confirmsWeight: 0, disputesWeight: 0 };
      if (a.claimPayload.dispute === true) {
        index[target].disputesWeight += w;
      } else {
        index[target].confirmsWeight += w;
      }
    }
  }
  return index;
}

export function pickBestWeightedProvenance(
  attestations: MinimalAttestation[],
  corr: WeightedCorroborationIndex,
  weights: Map<string, number>
): MinimalAttestation | null {
  const provs = attestations.filter(a => a.claimType === 'PROVENANCE_FOUND');
  if (provs.length === 0) return null;

  // 1. MACHINE_VERIFIED is the absolute trump card (evidence beats volume invariant)
  const machineVerified = provs.filter(a => a.status === 'MACHINE_VERIFIED');
  if (machineVerified.length > 0) {
    return machineVerified.sort((a, b) => {
      const scoreA = a.claimPayload?.matchScore || 0;
      const scoreB = b.claimPayload?.matchScore || 0;
      return scoreB - scoreA;
    })[0];
  }

  // 2. Otherwise, human claims sort by net weighted corroboration
  return provs.sort((a, b) => {
    const netA = (weights.get(a.id) || 0) + (corr[a.payloadHash]?.confirmsWeight || 0) - (corr[a.payloadHash]?.disputesWeight || 0);
    const netB = (weights.get(b.id) || 0) + (corr[b.payloadHash]?.confirmsWeight || 0) - (corr[b.payloadHash]?.disputesWeight || 0);
    if (netA !== netB) return netB - netA;
    // Tie-breaker: oldest wins
    return a.receivedAt.getTime() - b.receivedAt.getTime();
  })[0];
}

export function weightedCountByCategory(
  attestations: MinimalAttestation[],
  claimType: string,
  corr: WeightedCorroborationIndex,
  weights: Map<string, number>
): Record<string, { weight: number; disputedWeight: number }> {
  const result: Record<string, { weight: number; disputedWeight: number }> = {};

  const claims = attestations.filter(a => a.claimType === claimType);
  for (const a of claims) {
    const category = a.claimPayload?.category;
    if (!category) continue;

    if (!result[category]) {
      result[category] = { weight: 0, disputedWeight: 0 };
    }
    
    const w = weights.get(a.id) || 0;
    result[category].weight += w;
    if (corr[a.payloadHash] && corr[a.payloadHash].disputesWeight > 0) {
      result[category].disputedWeight += corr[a.payloadHash].disputesWeight;
    }
  }

  return result;
}

export function topWeightedContextNotes(
  attestations: MinimalAttestation[],
  corr: WeightedCorroborationIndex,
  weights: Map<string, number>,
  limit: number = 3
) {
  const notes = attestations
    .filter(a => a.claimType === 'CONTEXT_NOTE')
    .map(a => {
      const baseW = weights.get(a.id) || 0;
      const confirms = corr[a.payloadHash]?.confirmsWeight || 0;
      const disputes = corr[a.payloadHash]?.disputesWeight || 0;
      return {
        note: a.claimPayload?.note || '',
        confirms,
        disputes,
        net: baseW + confirms - disputes,
        payloadHash: a.payloadHash,
        receivedAt: a.receivedAt,
      };
    })
    .filter(n => n.note.length > 0);

  // Sort by net desc, ties by recency desc (newest first)
  notes.sort((a, b) => {
    if (a.net !== b.net) return b.net - a.net;
    return b.receivedAt.getTime() - a.receivedAt.getTime();
  });

  return notes.slice(0, limit).map(n => ({
    note: n.note,
    confirms: n.confirms,
    disputes: n.disputes,
    payloadHash: n.payloadHash,
  }));
}
