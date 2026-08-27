require('dotenv').config({ path: 'apps/api/.env' });
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SLA test data...');

  // 1. Free User
  const rand = Date.now();
  const freeUser = await prisma.user.create({
    data: {
      email: `free-sla-test-${rand}@example.com`,
      passwordHash: 'hash',
    }
  });

  const freeKeyRaw = 'free-key-' + Date.now();
  const freeKeyHash = crypto.createHash('sha256').update(freeKeyRaw).digest('hex');
  await prisma.apiKey.create({
    data: {
      userId: freeUser.id,
      name: 'Free Key',
      keyHash: freeKeyHash
    }
  });
  console.log('Created Free API Key:', freeKeyRaw);

  // 2. Enterprise Organization
  const entOrg = await prisma.organization.create({
    data: {
      name: 'Enterprise SLA Test Org',
      slug: 'ent-sla-test-' + Date.now(),
      subscription: {
        create: {
          status: 'active',
          tier: 'enterprise',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    }
  });

  const entUser = await prisma.user.create({
    data: {
      email: `ent-sla-test-${rand}@example.com`,
      passwordHash: 'hash',
    }
  });

  await prisma.teamMember.create({
    data: {
      organizationId: entOrg.id,
      userId: entUser.id,
      role: 'OWNER',
    }
  });

  const entKeyRaw = 'ent-key-' + Date.now();
  const entKeyHash = crypto.createHash('sha256').update(entKeyRaw).digest('hex');
  await prisma.apiKey.create({
    data: {
      userId: entUser.id,
      name: 'Ent Key',
      keyHash: entKeyHash
    }
  });
  console.log('Created Enterprise API Key:', entKeyRaw);
  console.log('Org ID:', entOrg.id);

  console.log('Waiting for API server to be ready...');
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:4000/health');
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!ready) {
    console.log('API server not ready');
    process.exit(1);
  }

  console.log('\n--- Testing Free Tier Limit (Expect 429 after 10 requests) ---');
  let free429Count = 0;
  for (let i = 1; i <= 15; i++) {
    const res = await fetch('http://localhost:4000/health', {
      headers: { 'x-api-key': freeKeyRaw }
    });
    console.log(`Free Req ${i}: Status ${res.status}`);
    if (res.status === 429) free429Count++;
  }

  console.log('\n--- Testing Enterprise Tier Limit (Expect NO 429) ---');
  let ent429Count = 0;
  for (let i = 1; i <= 15; i++) {
    // We must pass organizationId to trigger the org precedence
    // Wait, health route doesn't have organizationId param! We can pass it in query.
    const res = await fetch(`http://localhost:4000/health?organizationId=${entOrg.id}`, {
      headers: { 'x-api-key': entKeyRaw }
    });
    console.log(`Ent Req ${i}: Status ${res.status}`);
    if (res.status === 429) ent429Count++;
  }

  // Cleanup
  await prisma.apiKey.deleteMany({ where: { keyHash: { in: [freeKeyHash, entKeyHash] } } });
  await prisma.teamMember.deleteMany({ where: { userId: entUser.id } });
  await prisma.organizationSubscription.delete({ where: { organizationId: entOrg.id } });
  await prisma.organization.delete({ where: { id: entOrg.id } });
  await prisma.subscription.delete({ where: { userId: freeUser.id } });
  await prisma.user.deleteMany({ where: { id: { in: [freeUser.id, entUser.id] } } });
  
  if (free429Count > 0 && ent429Count === 0) {
    console.log('\nSUCCESS! Free tier was limited, Enterprise tier succeeded.');
  } else {
    console.log('\nFAILURE! Limits were not respected.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
