import { Injectable } from '@nestjs/common';
import {
  canonicalBytes, sha256Hex, verifyDetached,
} from '@antiai/attestation-core';
import { AttestationError } from '../errors/attestation-errors';
import { SubmitAttestationDto } from '../dto/submit-attestation.dto';

@Injectable()
export class EnvelopeVerifierService {
  /** Step 2 — recompute canonical bytes and check the declared payloadHash. */
  assertCanonicalHash(dto: SubmitAttestationDto): Uint8Array {
    const bytes = canonicalBytes(dto.payload as any);
    const recomputed = sha256Hex(bytes);
    if (recomputed !== dto.payloadHash) {
      throw new AttestationError('HASH_MISMATCH', 400, {
        expected: recomputed,
        received: dto.payloadHash,
      });
    }
    return bytes;
  }

  /** Step 4 — Ed25519 verification against the registered public key. */
  assertSignature(bytes: Uint8Array, signatureB64: string, publicKeyB64: string): void {
    const publicKeyHex = Buffer.from(publicKeyB64, 'base64').toString('hex');
    const ok = verifyDetached(bytes, signatureB64, publicKeyHex);
    if (!ok) throw new AttestationError('BAD_SIGNATURE', 401);
  }
}
