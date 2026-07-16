import canonicalize from 'canonicalize';
import { AttestationPayload } from './types';

export function canonicalBytes(payload: AttestationPayload): Uint8Array {
  const json = canonicalize(payload);
  if (!json) throw new Error('Canonicalization failed');
  return new TextEncoder().encode(json);
}
