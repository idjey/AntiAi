'use client';

import React, { useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import nacl from 'tweetnacl';
import * as base64js from 'base64-js';

interface CryptoProof {
  payloadB64: string;
  signatureB64: string;
  contentHash: string | null;
  kid: string;
  publicKeyB64: string;
  lifecycle: {
    status: string;
    issuedAt: string;
    expiresAt: string;
    revokedAt: string | null;
    supersededAt: string | null;
  };
}

interface VerdictDisplayProps {
  cryptoProof: CryptoProof | null;
  actualContentHash: string; // The hash of the subject we are viewing
}

// Helpers
function fromBase64(b64: string): Uint8Array {
  return base64js.toByteArray(b64);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function VerdictDisplay({ cryptoProof, actualContentHash }: VerdictDisplayProps) {
  const verdict = useMemo(() => {
    if (!cryptoProof) {
      return { state: 'UNVERIFIED', message: 'No cryptographic proof found for this content.', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' };
    }

    try {
      // 1. Verify Signature
      const payloadBytes = fromBase64(cryptoProof.payloadB64);
      const signatureBytes = fromBase64(cryptoProof.signatureB64);
      const publicKeyBytes = fromBase64(cryptoProof.publicKeyB64);
      
      const isValidSig = nacl.sign.detached.verify(payloadBytes, signatureBytes, publicKeyBytes);
      if (!isValidSig) {
        return { state: 'INVALID_SIGNATURE', message: 'Cryptographic signature is invalid or corrupted.', icon: ShieldX, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
      }

      // 2. Parse payload to get the signed content hash
      const payloadStr = new TextDecoder().decode(payloadBytes);
      const payloadObj = JSON.parse(payloadStr);
      const signedHashMatches = payloadObj.subject?.hash === actualContentHash;

      if (!signedHashMatches) {
        return { 
          state: 'UNVERIFIED', 
          message: 'This stream doesn\'t match the creator\'s signed original. It may be re-encoded, or it may be altered — verify with the original file or the mobile app to be sure.', 
          icon: Shield, 
          color: 'text-gray-400', 
          bg: 'bg-gray-500/10 border-gray-500/20' 
        };
      }

      // 3. Verify Lifecycle
      const { status, revokedAt, expiresAt } = cryptoProof.lifecycle;
      const now = new Date();
      if (status !== 'active' || revokedAt || (expiresAt && new Date(expiresAt) < now)) {
        return { state: 'REVOKED', message: `Signature is valid, but proof is ${status} (Creator withdrew it).`, icon: ShieldAlert, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' };
      }

      return { state: 'VERIFIED_AUTHENTIC', message: 'Verified Authentic: Cryptographically proven by the original creator.', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' };
    } catch (e) {
      return { state: 'INVALID_SIGNATURE', message: 'Failed to verify cryptographic proof.', icon: ShieldX, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
    }
  }, [cryptoProof, actualContentHash]);

  const Icon = verdict.icon;

  return (
    <div className={`p-6 rounded-xl border flex items-center space-x-4 mb-8 ${verdict.bg}`}>
      <Icon className={`w-12 h-12 ${verdict.color}`} />
      <div>
        <h2 className={`text-2xl font-bold ${verdict.color}`}>
          {verdict.state.replace('_', ' ')}
        </h2>
        <p className="text-text-secondary mt-1">{verdict.message}</p>
      </div>
    </div>
  );
}
