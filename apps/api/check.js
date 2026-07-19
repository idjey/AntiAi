const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.reputationConfig.findFirst({
    where: { active: true },
    orderBy: { id: 'desc' }
  });
  console.log(JSON.stringify(config, null, 2));
}

main().finally(() => prisma.$disconnect());
