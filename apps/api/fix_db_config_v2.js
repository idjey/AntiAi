const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.reputationConfig.findMany({
    where: { active: true }
  });
  
  let failures = 0;

  for (const config of configs) {
    const params = config.params;
    let needsUpdate = false;

    if (!params.correlation) {
      params.correlation = {};
      needsUpdate = true;
    }

    if (params.correlation.clusterExponent !== 0.5) {
      params.correlation.clusterExponent = 0.5;
      needsUpdate = true;
    }
    
    if (params.correlation.clusterOutlierFactor !== 3.0) {
      params.correlation.clusterOutlierFactor = 3.0;
      needsUpdate = true;
    }

    if (params.correlation.clusterShareExponent !== 2.0) {
      params.correlation.clusterShareExponent = 2.0;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.reputationConfig.update({
        where: { id: config.id },
        data: { params: params }
      });
      console.log(`Updated config ${config.id} with new correlation params.`);
    }
  }

  // Verification step
  const verifyConfigs = await prisma.reputationConfig.findMany({
    where: { active: true }
  });

  for (const config of verifyConfigs) {
    const corr = config.params.correlation || {};
    if (corr.clusterExponent !== 0.5 || corr.clusterOutlierFactor !== 3.0 || corr.clusterShareExponent !== 2.0) {
      console.error(`VERIFICATION FAILED for config ${config.id}:`, corr);
      console.error('CRITICAL: Correlation parameters do not match required security baseline.');
      process.exit(1);
    } else {
      console.log(`Verified config ${config.id} correctly applied parameters.`);
    }
  }

  if (failures > 0) {
    console.error(`Migration complete with ${failures} failures.`);
    process.exit(1);
  } else {
    console.log("Migration complete and verified successfully.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
