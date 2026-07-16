import fs from 'fs';
import path from 'path';
import { verifyAttestation, signAttestation } from '../src/crypto';
import { fromBase64 } from '../src/crypto';

describe('Attestation Crypto', () => {
  const vectorsPath = path.resolve(__dirname, 'golden-vectors.json');
  const vectors = JSON.parse(fs.readFileSync(vectorsPath, 'utf8'));

  it('should verify golden vector signature', () => {
    const publicKey = fromBase64(vectors.keys.publicKeyBase64);
    
    const attestation = {
      payload: vectors.envelope,
      payloadHash: vectors.expected.payloadHash,
      signature: vectors.expected.signatureBase64
    };

    const isValid = verifyAttestation(attestation, publicKey);
    expect(isValid).toBe(true);
  });

  it('should reproduce golden vector when signing', () => {
    const privateKey = fromBase64(vectors.keys.privateKeyBase64);
    
    const result = signAttestation(vectors.envelope, privateKey);
    
    expect(result.payloadHash).toBe(vectors.expected.payloadHash);
    expect(result.signature).toBe(vectors.expected.signatureBase64);
  });
});
