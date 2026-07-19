import { AttestationStatus } from '@prisma/client';

export interface MinimalAttestation {
  id: string;
  payloadHash: string;
  claimType: string;
  status: AttestationStatus;
  claimPayload: any;
  receivedAt: Date;
  attester: {
    keyId: string;
    status: string;
    reputation: number;
    deviceAttested: boolean;
    canaryDownweighted: boolean;
  };
}

export interface CorroborationIndex {
  [targetPayloadHash: string]: {
    confirms: number;
    disputes: number;
  };
}

export function indexCorroborations(attestations: MinimalAttestation[]): CorroborationIndex {
  const index: CorroborationIndex = {};
  for (const a of attestations) {
    if (a.claimType === 'CORROBORATION' && a.claimPayload?.targetPayloadHash) {
      const target = a.claimPayload.targetPayloadHash;
      if (!index[target]) index[target] = { confirms: 0, disputes: 0 };
      if (a.claimPayload.dispute === true) {
        index[target].disputes += 1;
      } else {
        index[target].confirms += 1;
      }
    }
  }
  return index;
}

export function pickBestProvenance(
  attestations: MinimalAttestation[], 
  corr: CorroborationIndex
): MinimalAttestation | null {
  const provs = attestations.filter(a => a.claimType === 'PROVENANCE_FOUND');
  if (provs.length === 0) return null;

  // 1. MACHINE_VERIFIED is the absolute trump card (evidence beats volume invariant)
  // If there are multiple, lowest distance (highest matchScore) wins.
  const machineVerified = provs.filter(a => a.status === 'MACHINE_VERIFIED');
  if (machineVerified.length > 0) {
    return machineVerified.sort((a, b) => {
      const scoreA = a.claimPayload?.matchScore || 0;
      const scoreB = b.claimPayload?.matchScore || 0;
      return scoreB - scoreA;
    })[0];
  }

  // 2. Otherwise, human claims sort by net corroboration (confirms - disputes)
  return provs.sort((a, b) => {
    const netA = (corr[a.payloadHash]?.confirms || 0) - (corr[a.payloadHash]?.disputes || 0);
    const netB = (corr[b.payloadHash]?.confirms || 0) - (corr[b.payloadHash]?.disputes || 0);
    if (netA !== netB) return netB - netA;
    // Tie-breaker: oldest wins (first to claim)
    return a.receivedAt.getTime() - b.receivedAt.getTime();
  })[0];
}

export function countByCategory(
  attestations: MinimalAttestation[],
  claimType: string,
  corr: CorroborationIndex
): Record<string, { count: number; disputed: number }> {
  const result: Record<string, { count: number; disputed: number }> = {};

  const claims = attestations.filter(a => a.claimType === claimType);
  for (const a of claims) {
    const category = a.claimPayload?.category;
    if (!category) continue;

    if (!result[category]) {
      result[category] = { count: 0, disputed: 0 };
    }
    
    result[category].count += 1;
    if (corr[a.payloadHash] && corr[a.payloadHash].disputes > 0) {
      result[category].disputed += 1;
    }
  }

  return result;
}

export function topContextNotes(
  attestations: MinimalAttestation[],
  corr: CorroborationIndex,
  limit: number = 3
) {
  const notes = attestations
    .filter(a => a.claimType === 'CONTEXT_NOTE')
    .map(a => {
      const confirms = corr[a.payloadHash]?.confirms || 0;
      const disputes = corr[a.payloadHash]?.disputes || 0;
      return {
        note: a.claimPayload?.note || '',
        confirms,
        disputes,
        net: confirms - disputes,
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
