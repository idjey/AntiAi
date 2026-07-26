import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const attestationCount = await prisma.attestation.count();
  console.log(`Attestation Count: ${attestationCount}`);

  const diffs = await prisma.shadowVerdictDiff.findMany({ take: 4 });
  console.log('\nShadowVerdictDiffs (first 4):');
  console.dir(diffs, { depth: null });

  const attestation = await prisma.attestation.findFirst();
  console.log('\nFirst Attestation:');
  console.dir(attestation, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
