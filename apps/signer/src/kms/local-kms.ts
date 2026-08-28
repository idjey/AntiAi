import { IKmsClient } from './kms-client';
import * as crypto from 'crypto';

export class LocalKmsClient implements IKmsClient {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: LocalKmsClient (Stub) MUST NOT be used in production. ' +
        'It requires local plaintext private keys. Replace with RealAwsKmsClient.'
      );
    }
  }

  async sign(payload: Buffer, keyId: string, alg: string): Promise<string> {
    // Structural guard at runtime as well, just in case
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: Attempted to call LocalKmsClient.sign() in production environment');
    }

    if (alg !== 'Ed25519') {
      throw new Error(`Unsupported alg for stub: ${alg}`);
    }

    const privateKeyB64 = process.env.SIGNING_PRIVATE_KEY_B64;
    if (!privateKeyB64) {
      throw new Error('SIGNING_PRIVATE_KEY_B64 is not set in environment (required for local stub)');
    }

    // Convert from raw bytes (32 bytes Ed25519 seed) to KeyObject
    const rawKey = Buffer.from(privateKeyB64, 'base64');
    // Ensure we only use the 32 byte seed part
    const priv32 = rawKey.length === 32 ? rawKey : rawKey.slice(0, 32);
    
    const privateKey = crypto.createPrivateKey({
      key: Buffer.concat([
        Buffer.from('302e020100300506032b657004220420', 'hex'), // DER prefix for Ed25519
        priv32
      ]),
      format: 'der',
      type: 'pkcs8'
    });
    
    const sigBytes = crypto.sign(null, payload, privateKey);
    const b64 = Buffer.from(sigBytes).toString('base64');
    const b64Url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    
    return b64Url;
  }
}
