export const PROTOCOL_VERSION = '2.0';

export type ClaimType =
  // Public domain
  | 'provenance_found'
  | 'artifact_flag'
  | 'context_note'
  | 'corroboration'
  // Circle domain
  | 'custody_received'
  | 'custody_transferred'
  | 'custody_sealed'
  | 'integrity_verified'
  | 'redaction_applied';

export interface AttestationPayload {
  version: string;
  subject: {
    hash: string;
    perceptualHash?: string;
    mediaType: 'video' | 'image' | 'audio' | 'pdf' | 'other';
    sizeBytes?: number;
  };
  claim: { type: ClaimType; payload: Record<string, unknown> };
  attester: { keyId: string; identityClass: 'pseudonymous' | 'verified_person' | 'organizational_role' };
  context: {
    domain: 'public' | `circle:${string}`;
    priorAttestation?: string;
    timestamp: string;
    nonce: string;
  };
}

export interface SignedAttestation {
  payload: AttestationPayload;
  payloadHash: string;
  signature: string;
}
