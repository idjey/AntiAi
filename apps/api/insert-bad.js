const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.subject.create({
    data: {
      hash: 'bad-subject',
      perceptualHash: 'not-hex',
      mediaType: 'IMAGE',
    }
  });
  console.log('Inserted bad subject');
}

main().catch(console.error).finally(() => prisma.$disconnect());
