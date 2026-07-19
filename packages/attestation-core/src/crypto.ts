import nacl from 'tweetnacl';
import crypto from 'crypto';
import { canonicalBytes } from './canonicalize';
import { AttestationPayload, SignedAttestation } from './types';

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export function sha256(bytes: Uint8Array): Uint8Array {
  return crypto.createHash('sha256').update(bytes).digest();
}

export function sha256Hex(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes));
}

export function verifyDetached(bytes: Uint8Array, signatureB64: string, publicKeyHex: string): boolean {
  try {
    return nacl.sign.detached.verify(bytes, fromBase64(signatureB64), hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

export function signAttestation(payload: AttestationPayload, secretKey: Uint8Array): SignedAttestation {
  const bytes = canonicalBytes(payload);
  const signature = nacl.sign.detached(bytes, secretKey);
  return {
    payload,
    payloadHash: bytesToHex(sha256(bytes)),
    signature: toBase64(signature),
  };
}

export function verifyAttestation(att: SignedAttestation, publicKey: Uint8Array): boolean {
  try {
    const bytes = canonicalBytes(att.payload);
    if (bytesToHex(sha256(bytes)) !== att.payloadHash) return false;
    return nacl.sign.detached.verify(bytes, fromBase64(att.signature), publicKey);
  } catch (e) {
    return false;
  }
}


export function deriveKeyId(publicKeyBase64: string): string {
  return Buffer.from(publicKeyBase64, 'base64').toString('hex').slice(0, 32);
}
