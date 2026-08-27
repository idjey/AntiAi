import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { AuditService } from './src/modules/audit/audit.service';

async function verifyProduction() {
  console.log("Connecting to production...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const auditService = app.get(AuditService);

  console.log("\n--- 1. Checking User Count ---");
  const userCount = await prisma.user.count();
  console.log(`Total users in production: ${userCount}`);
  if (userCount !== 13) {
    console.error(`❌ ERROR: Expected 13 users, found ${userCount}. We might have lost/gained data.`);
  } else {
    console.log("✅ User count matches the 13 known customers.");
  }

  console.log("\n--- 2. Verifying Real Orgs' Chains ---");
  const orgs = await prisma.organization.findMany();
  let allIntact = true;
  for (const org of orgs) {
    const result = await auditService.verifyChain(org.id);
    if (!result.intact) {
      console.error(`❌ ERROR: Chain broken for org ${org.name} (${org.id}) at log ${result.brokenAtEntryId}`);
      allIntact = false;
    }
  }
  if (allIntact) {
    console.log(`✅ All ${orgs.length} organizations have intact audit chains.`);
  }

  console.log("\n--- 3. Checking Migration Status ---");
  const migrations = await prisma.$queryRaw`SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5`;
  console.log("Recent applied migrations:");
  console.log(migrations);

  await app.close();
}

verifyProduction().catch(console.error);
