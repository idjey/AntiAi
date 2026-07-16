import nacl from 'tweetnacl';
import canonicalize from 'canonicalize';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Generate a deterministic keypair from a known seed
const seed = crypto.createHash('sha256').update('antiai-golden-vector-seed-2026').digest();
const keyPair = nacl.sign.keyPair.fromSeed(seed);

const payload = {
  version: '2.0',
  subject: {
    hash: crypto.createHash('sha256').update('original_video_bytes').digest('hex'),
    mediaType: 'video'
  },
  claim: {
    type: 'provenance_found',
    payload: {
      sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      matchScore: 0
    }
  },
  attester: {
    keyId: Buffer.from(keyPair.publicKey).toString('hex').slice(0, 32),
    identityClass: 'pseudonymous'
  },
  context: {
    domain: 'public',
    timestamp: '2026-07-16T00:00:00.000Z',
    nonce: '00112233445566778899aabbccddeeff'
  }
};

const json = canonicalize(payload);
if (!json) throw new Error('Canonicalization failed');

const payloadBytes = Buffer.from(json, 'utf8');
const signature = nacl.sign.detached(payloadBytes, keyPair.secretKey);
const payloadHash = crypto.createHash('sha256').update(payloadBytes).digest('hex');

const goldenVector = {
  description: "Golden vector for testing canonicalization and Ed25519 signature of AttestationEnvelope",
  keys: {
    seedHex: seed.toString('hex'),
    privateKeyBase64: Buffer.from(keyPair.secretKey).toString('base64'),
    publicKeyBase64: Buffer.from(keyPair.publicKey).toString('base64'),
    keyId: Buffer.from(keyPair.publicKey).toString('hex').slice(0, 32)
  },
  envelope: payload,
  expected: {
    canonicalJson: json,
    payloadHash: payloadHash,
    signatureBase64: Buffer.from(signature).toString('base64')
  }
};

const outPath = path.resolve(__dirname, '../test/golden-vectors.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(goldenVector, null, 2));

console.log('Golden vectors generated at:', outPath);
