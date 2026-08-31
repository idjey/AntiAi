require('dotenv').config();
const { KMSClient, SignCommand } = require('@aws-sdk/client-kms');
const crypto = require('crypto');
const { PrismaClient } = require('@antiai/database');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Connected to DB');

    // 1. Fetch the new KMS key record
    const signingKey = await prisma.signingKey.findUnique({ where: { id: 'k_2026_02' } });
    if (!signingKey) {
      console.error('KMS key k_2026_02 not seeded yet in DB');
      process.exit(1);
    }

    console.log('Found KMS signing key DB record:', signingKey.providerKeyId);

    // 2. Instantiate AWS KMS Client
    const kmsClient = new KMSClient({ region: 'us-east-1' });

    // 3. Dummy payload
    const payloadString = "shadow-test";
    const payload = Buffer.from(payloadString);

    // 4. Sign payload
    console.log('Requesting signature from KMS...');
    const command = new SignCommand({
      KeyId: signingKey.providerKeyId,
      Message: payload,
      MessageType: 'RAW',
      SigningAlgorithm: 'ED25519_SHA_512',
    });

    const response = await kmsClient.send(command);
    if (!response.Signature) {
      throw new Error('No signature returned');
    }
    
    console.log('Received signature of length:', response.Signature.length);

    // 5. Verify against public key from DB
    const publicKeyBytes = Buffer.from(signingKey.publicKeyB64, 'base64');
    
    const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const fullSpki = Buffer.concat([spkiPrefix, publicKeyBytes]);
    
    const publicKeyObject = crypto.createPublicKey({
      key: fullSpki,
      format: 'der',
      type: 'spki'
    });

    const isValid = crypto.verify(
      null,
      payload,
      publicKeyObject,
      Buffer.from(response.Signature)
    );

    if (isValid) {
      console.log('SUCCESS: KMS signature perfectly verified against DB public key!');
    } else {
      console.error('FAILED: Signature verification failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error during KMS verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
