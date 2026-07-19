const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { DEFAULT_CONFIG } = require('../src/modules/reputation/types');

async function run() {
  console.log('Clearing old configs and shadow verdicts...');
  await prisma.shadowVerdictDiff.deleteMany({});
  await prisma.reputationConfig.deleteMany({});
  
  // ensure jaccard threshold and outlier factor are the exact ones we finalized
  DEFAULT_CONFIG.correlation.jaccardThreshold = 0.5;
  DEFAULT_CONFIG.correlation.clusterOutlierFactor = 3.0;

  console.log('Creating production default config with shadow mode ON...');
  await prisma.reputationConfig.create({
    data: {
      params: DEFAULT_CONFIG as any,
      comment: 'Initial production config with Shadow Mode ON',
      active: true,
      activationRequestedBy: 'system',
      activationRequestedAt: new Date(),
      approvedBy: 'system',
      approvedAt: new Date()
    }
  });

  console.log('Done!');
}
run().catch(console.error).finally(() => prisma.$disconnect());
