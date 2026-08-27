import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hash(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

async function verifyChain(orgId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'asc' },
  });

  if (logs.length === 0) return { intact: true, verifiedEntries: 0 };

  let expectedPreviousHash = 'GENESIS';
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (log.previousHash !== expectedPreviousHash) {
      return { intact: false, error: 'Hash mismatch', brokenAtEntryId: log.id.toString() };
    }
    const contentToHash = JSON.stringify({
      organizationId: log.organizationId,
      action: log.action,
      previousHash: log.previousHash,
      timestamp: log.createdAt.toISOString(),
    });
    const expectedHash = hash(contentToHash);
    if (log.hash !== expectedHash) {
      return { intact: false, error: 'Content tampered', brokenAtEntryId: log.id.toString() };
    }
    expectedPreviousHash = log.hash;
  }
  return { intact: true, verifiedEntries: logs.length };
}

async function run() {
  await prisma.$connect();
  console.log("--- 1. Checking User Count ---");
  const count = await prisma.user.count();
  console.log(`Total users in production: ${count}`);

  console.log("\n--- 2. Checking Migration Status ---");
  try {
    const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5`;
    console.log(migrations);
  } catch(e) {
    console.error("Could not fetch migrations (table might not exist)", e);
  }

  console.log("\n--- 3. Verifying Real Orgs' Chains ---");
  const orgs = await prisma.organization.findMany();
  let allIntact = true;
  for (const org of orgs) {
    const res = await verifyChain(org.id);
    if (!res.intact) {
      console.error(`❌ ERROR: Chain broken for org ${org.name} (${org.id}) at log ${res.brokenAtEntryId}: ${res.error}`);
      allIntact = false;
    } else {
      console.log(`Org ${org.name} (${org.id}): ✅ Intact (${res.verifiedEntries} entries)`);
    }
  }

  if (allIntact) console.log("✅ All org chains are completely intact.");
  await prisma.$disconnect();
}

run().catch(console.error);
