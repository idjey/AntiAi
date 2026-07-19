const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // get midrep attester id
  const midrep = await prisma.identity.findFirst({ where: { role: 'midrep' } });
  if (!midrep) return console.log('no midrep');
  
  const att = await prisma.attestation.findFirst({ where: { attesterId: midrep.id } });
  console.log('MidRep Attestation raw weight:', att.weightAtAggregation);
  console.log('MidRep reputation:', midrep.reputation);
  console.log('MidRep platform:', midrep.platform);
  console.log('MidRep deviceAttested:', midrep.deviceAttested);
  
  // also check if they are in multiple clusters
  const clusters = await prisma.correlationCluster.findMany();
  for (const c of clusters) {
    if (c.memberIds.includes(midrep.id)) {
      console.log('MidRep is in cluster of size', c.memberIds.length);
    }
  }
}
run();
