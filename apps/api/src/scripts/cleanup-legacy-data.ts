import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- LEGACY DATA CLEANUP (DRY-RUN) ---');
  
  // 1. Subjects missing perceptual hashes
  const legacySubjectsCount = await prisma.subject.count({
    where: { perceptualHash: null }
  });
  console.log(`Legacy Subjects found: ${legacySubjectsCount}`);

  // 2. Proofs missing perceptual hashes
  // We find proofs that do not have any proof_perceptual_hashes rows attached.
  const legacyProofsCount = await prisma.proof.count({
    where: {
      perceptualHashes: {
        none: {} // True if the array is empty
      }
    }
  });
  console.log(`Legacy Proofs found: ${legacyProofsCount}`);

  console.log('\n--- CONCLUSION ---');
  console.log('Since `crypto-lookup.service.ts` uses INNER aggregation on `proof_perceptual_hashes`, and `subject-phash.repository.ts` uses `WHERE "perceptualHash" IS NOT NULL`, these legacy records are ALREADY safely excluded from perceptual lookups.');
  console.log('No database mutations are required to exclude them.');
  
  await prisma.$disconnect();
}

run().catch(console.error);
