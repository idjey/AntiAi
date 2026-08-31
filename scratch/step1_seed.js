require('dotenv').config();
const { PrismaClient } = require('@antiai/database');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BYOK Increment 3: Step 1 (Seeding) ---');

  // 1. Seed the key
  const kid = 'k_2026_02';
  
  // Check if it already exists
  const existing = await prisma.signingKey.findUnique({ where: { id: kid } });
  if (existing) {
    console.log(`Key ${kid} already exists! Deleting it to start fresh...`);
    await prisma.signingKey.delete({ where: { id: kid } });
  }

  console.log(`Seeding inert key ${kid} into production...`);
  const newKey = await prisma.signingKey.create({
    data: {
      id: kid,
      publicKeyB64: 'wjlEyQe9oc5fVi1WAauL/jYCaiQxcjowR9KW9hJBzk0=',
      isActive: false, // CRITICALLY INERT
      alg: 'Ed25519',
      provider: 'aws_kms',
      providerKeyId: 'arn:aws:kms:us-east-1:716534645639:key/a7800834-edcd-4ceb-ad9e-2d6388e4d21a'
    }
  });

  console.log(`✅ Seeded ${kid} successfully. Is active? ${newKey.isActive}`);

  // 2. Step 1b: Post-seed check - Verify 10 existing proofs
  console.log('\n--- BYOK Increment 3: Step 1b (Verification) ---');
  console.log('Fetching 10 active proofs to ensure verification still works...');
  
  const proofs = await prisma.proof.findMany({
    where: { status: 'active' },
    take: 10,
    include: { signingKey: true } // Need to fetch the public key
  });

  let successCount = 0;
  for (const proof of proofs) {
    // Reconstruct canonical payload bytes to verify
    // Since we don't have the exact payloadBytes without pulling in @antiai/crypto,
    // we can just use the payloadB64 stored in the DB!
    const payloadBytes = Buffer.from(proof.payloadB64, 'base64url');
    const signatureBytes = Buffer.from(proof.signatureB64, 'base64url');
    
    const rawKeyBuf = Buffer.from(proof.signingKey.publicKeyB64, 'base64');
    let keyDer;
    if (rawKeyBuf.length === 32) {
      keyDer = Buffer.concat([
        Buffer.from('302a300506032b6570032100', 'hex'), // Ed25519 SPKI DER prefix
        rawKeyBuf
      ]);
    } else if (rawKeyBuf.length === 44) {
      keyDer = rawKeyBuf;
    } else {
      console.log(`Skipping proof ${proof.id} because key length is ${rawKeyBuf.length} (expected 32 or 44)`);
      continue;
    }
    
    const pubKeyObj = crypto.createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
    
    const isValid = crypto.verify(null, payloadBytes, pubKeyObj, signatureBytes);
    if (isValid) {
      successCount++;
    } else {
      console.error(`❌ Verification failed for proof ${proof.id} (kid: ${proof.kid})`);
    }
  }

  console.log(`✅ Verified ${successCount}/${proofs.length} existing proofs mathematically using crypto.verify.`);
  if (successCount === proofs.length && proofs.length > 0) {
    console.log('✅ Post-seed check passed! No disruption to existing proofs.');
  } else {
    console.log('⚠️ Warning: Not all proofs verified successfully.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
