import { KMSClient, SignCommand, MessageType, GetPublicKeyCommand } from '@aws-sdk/client-kms';
import { verifyProof, buildCanonicalPayload } from '@antiai/crypto';
import * as crypto from 'crypto';

async function runTest() {
  console.log('--- STARTING REAL AWS KMS INTEGRATION TEST ---');
  
  // The test key created earlier
  const keyId = '63903d8b-13cf-42cf-8e39-916decf8d793';
  const region = 'us-east-1'; // Ensure this matches the key's region
  
  const client = new KMSClient({ region });
  
  // 1. Fetch Public Key from KMS
  console.log('1. Fetching public key from AWS KMS...');
  const pubKeyCmd = new GetPublicKeyCommand({ KeyId: keyId });
  const pubKeyRes = await client.send(pubKeyCmd);
  
  if (!pubKeyRes.PublicKey) {
    throw new Error('No public key returned');
  }
  
  // The returned PublicKey is a Uint8Array in DER format (SPKI)
  // Ed25519 DER length is 44 bytes, the last 32 bytes are the raw key.
  if (pubKeyRes.PublicKey.length !== 44) {
    throw new Error(`Unexpected public key length: ${pubKeyRes.PublicKey.length} (expected 44 for Ed25519 DER)`);
  }
  
  const rawPubKeyBytes = pubKeyRes.PublicKey.slice(-32);
  const storedPublicKeyB64 = Buffer.from(rawPubKeyBytes).toString('base64');
  console.log(`   Extracted raw public key (base64): ${storedPublicKeyB64}`);
  
  // 2. Generate a canonical payload
  console.log('2. Building canonical payload...');
  const expiresAtUnix = Math.floor(Date.now() / 1000) + 3600;
  
  const { payloadBytes } = buildCanonicalPayload({
    kid: keyId, // For the test, we'll just use the KeyId as the kid
    youtubeVideoId: 'REAL_KMS_TEST_VID',
    youtubeChannelId: 'REAL_KMS_TEST_CH',
    expiresAtUnix,
    contentHash: 'some_hash',
    perceptualHashes: { '0': '0000000000000000' },
    perceptualHashVersion: 1
  });
  
  const payloadB64 = Buffer.from(payloadBytes).toString('base64');
  const payloadB64Url = payloadB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  
  // 3. Signing payload with AWS KMS...
  const signCmd = new SignCommand({
    KeyId: keyId,
    Message: payloadBytes,
    MessageType: MessageType.RAW,
    SigningAlgorithm: 'ED25519_SHA_512' as any 
  });
  
  const signRes = await client.send(signCmd);
  
  if (!signRes.Signature) {
    throw new Error('No signature returned');
  }
  
  // AWS KMS returns the raw 64-byte Ed25519 signature directly (no DER wrapping for Ed25519 signatures, unlike ECDSA).
  if (signRes.Signature.length !== 64) {
    throw new Error(`Unexpected signature length: ${signRes.Signature.length} (expected 64 for Ed25519)`);
  }
  
  const rawSigB64 = Buffer.from(signRes.Signature).toString('base64');
  const signatureB64Url = rawSigB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  console.log(`   Received signature (base64url): ${signatureB64Url}`);
  
  // 4. Verify the signature using our standard `@antiai/crypto` package
  console.log('4. Verifying signature against stored public key...');
  const verifyResult = await verifyProof({
    payload_b64: payloadB64Url,
    signature_b64: signatureB64Url,
    publicKeyB64: storedPublicKeyB64
  });
  
  if (verifyResult.ok) {
    console.log('✅ SUCCESS: Real AWS KMS signature perfectly verified against stored public key!');
  } else {
    console.error('❌ FAILURE: Verification failed.', verifyResult);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
