import nacl from 'tweetnacl';
import { hash } from 'fast-sha256';
import * as base64js from 'base64-js';
import { canonicalBytes } from './canonicalize';
import { AttestationPayload, SignedAttestation } from './types';

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g);
  if (!match) return new Uint8Array(0);
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

export function toBase64(bytes: Uint8Array): string {
  return base64js.fromByteArray(bytes);
}

export function fromBase64(b64: string): Uint8Array {
  return base64js.toByteArray(b64);
}

export function sha256(bytes: Uint8Array): Uint8Array {
  return hash(bytes);
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
  const pkBytes = fromBase64(publicKeyBase64);
  const h = sha256(pkBytes);
  return bytesToHex(h).slice(0, 32);
}
