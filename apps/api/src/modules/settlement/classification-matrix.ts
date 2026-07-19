export type GroundTruthType = 
  | 'CREATOR_SIGNATURE_AUTHENTIC' 
  | 'CREATOR_SIGNATURE_DISCLAIMER' 
  | 'MACHINE_VERIFIED_PROVENANCE'
  | 'ADMIN_ADJUDICATION';

export type ClaimType = 
  | 'PROVENANCE_FOUND'
  | 'ARTIFACT_FLAG'
  | 'CONTEXT_NOTE'
  | 'CORROBORATION';

export type Verdict = 'CORRECT' | 'INCORRECT' | 'NOT_ADDRESSED';

export interface GroundTruth {
  type: GroundTruthType;
  // payload can contain specific details (e.g. for admin adjudication or provenance URL)
  payload?: any; 
}

export interface AttestationClaim {
  id: string;
  claimType: ClaimType;
  claimPayload: any;
}

/**
 * The Settlement Classification Matrix.
 * Over-eager classification slashes honest verifiers.
 * If a pairing is not explicitly handled, it defaults to NOT_ADDRESSED.
 */
export function classify(attestation: AttestationClaim, truth: GroundTruth): Verdict {
  const c = attestation.claimType;
  const t = truth.type;

  if (t === 'ADMIN_ADJUDICATION') {
    // Admin explicitly overrides specific claim types or attestations
    if (truth.payload?.targetAttestationId === attestation.id) {
      return truth.payload.verdict as Verdict; // Admin can specify CORRECT or INCORRECT
    }
    // If admin adjudicates a subject level truth
    if (truth.payload?.claimTypeVerdicts && truth.payload.claimTypeVerdicts[c]) {
      return truth.payload.claimTypeVerdicts[c] as Verdict;
    }
    return 'NOT_ADDRESSED';
  }

  if (t === 'CREATOR_SIGNATURE_AUTHENTIC') {
    switch (c) {
      case 'ARTIFACT_FLAG': 
        // Creator claims authentic, so anyone flagging it as deepfake/manipulated is incorrect
        return 'INCORRECT';
      case 'PROVENANCE_FOUND':
        // A creator signing doesn't necessarily mean it wasn't published earlier by them
        return 'NOT_ADDRESSED';
      case 'CONTEXT_NOTE':
        // Creator signing authentic doesn't invalidate a context note (e.g. "this is from 2018")
        return 'NOT_ADDRESSED';
      case 'CORROBORATION':
        // Depends on what they corroborated. Handled separately or NOT_ADDRESSED at base level
        return 'NOT_ADDRESSED';
    }
  }

  if (t === 'CREATOR_SIGNATURE_DISCLAIMER') {
    switch (c) {
      case 'ARTIFACT_FLAG':
        // Creator explicitly says "this is not me / manipulated", so flaggers are correct
        return 'CORRECT';
      case 'PROVENANCE_FOUND':
        return 'NOT_ADDRESSED';
      case 'CONTEXT_NOTE':
        return 'NOT_ADDRESSED';
      case 'CORROBORATION':
        return 'NOT_ADDRESSED';
    }
  }

  if (t === 'MACHINE_VERIFIED_PROVENANCE') {
    switch (c) {
      case 'PROVENANCE_FOUND':
        // If the human found the exact provenance the machine verified
        if (attestation.claimPayload?.sourceUrl === truth.payload?.sourceUrl) {
          return 'CORRECT';
        }
        // If they claimed a different provenance, it might just be another valid mirror.
        // We only slash if they claimed it was original (no provenance) but this is an attestation OF provenance.
        return 'NOT_ADDRESSED';
      case 'ARTIFACT_FLAG':
        // An earlier upload doesn't prove or disprove a lip-sync anomaly
        return 'NOT_ADDRESSED';
      case 'CONTEXT_NOTE':
        return 'NOT_ADDRESSED';
      case 'CORROBORATION':
        return 'NOT_ADDRESSED';
    }
  }

  return 'NOT_ADDRESSED';
}

export function confidenceAtSettlement(
  attestation: AttestationClaim, 
  corrConfirms: number, 
  corrDisputes: number,
  isSelfDispute: boolean = false
): number {
  if (isSelfDispute) {
    // Verifiers who dispute their own earlier claims settle at 0.2x confidence.
    return 0.2;
  }

  let conf = 0.4; // Base for a bare claim

  if (attestation.claimType === 'CORROBORATION') {
    conf += 0.2; // Corroborated others
  }

  const net = corrConfirms - corrDisputes;
  if (net > 0) {
    conf += 0.2; // Accumulated net-positive corroborations they never walked back
  }

  return Math.min(1.0, Math.max(0.0, conf));
}
