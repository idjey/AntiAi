const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.reputationConfig.findMany({
    where: { active: true }
  });
  
  for (const config of configs) {
    const params = config.params;
    if (params.correlation && params.correlation.clusterExponent !== 0.5) {
      params.correlation.clusterExponent = 0.5;
      await prisma.reputationConfig.update({
        where: { id: config.id },
        data: { params: params }
      });
      console.log(`Updated config ${config.id} clusterExponent to 0.5`);
    }
  }
}

main().finally(() => prisma.$disconnect());
