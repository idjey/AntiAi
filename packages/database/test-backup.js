const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.verifierIdentity.create({
  data: {
    publicKey: 'backup-test-throwaway-key',
    keyId: 'backup-test-key-id',
    status: 'PROBATION',
    platform: 'web'
  }
}).then(t => {
  console.log('Throwaway created:', t);
  prisma.$disconnect();
}).catch(e => {
  console.error(e);
  prisma.$disconnect();
});
