const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xyomczEMEONCxhLLwymGULMXUEUAWdQH@tokaido.proxy.rlwy.net:13431/railway?schema=public",
    },
  },
});

async function main() {
  console.log('Testing pg_advisory_xact_lock concurrency over Railway proxy...');
  const orgId = '11111111-1111-1111-1111-111111111111';
  
  // Clean up any previous test data
  try {
    await prisma.$executeRaw`DELETE FROM "organizations" WHERE "id" = ${orgId}::uuid`;
  } catch(e) {}
  
  await prisma.$executeRaw`INSERT INTO "organizations" ("id", "name", "slug") VALUES (${orgId}::uuid, 'Test Org', 'test-org')`;

  // Start two concurrent transactions that try to grab the lock
  console.log('Starting concurrent transactions...');
  
  const tx1 = prisma.$transaction(async (tx) => {
    console.log('TX1: Acquiring lock...');
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${orgId}::text))`;
    console.log('TX1: Lock acquired. Simulating work...');
    await new Promise(res => setTimeout(res, 2000));
    console.log('TX1: Work done. Releasing lock by ending transaction.');
    return 'TX1 SUCCESS';
  });

  // Give TX1 a slight head start
  await new Promise(res => setTimeout(res, 500));

  const tx2 = prisma.$transaction(async (tx) => {
    console.log('TX2: Acquiring lock...');
    const start = Date.now();
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${orgId}::text))`;
    const elapsed = Date.now() - start;
    console.log(`TX2: Lock acquired after ${elapsed}ms. Simulating work...`);
    return `TX2 SUCCESS (waited ${elapsed}ms)`;
  });

  const results = await Promise.all([tx1, tx2]);
  console.log('Results:', results);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
