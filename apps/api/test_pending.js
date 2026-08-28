const { PrismaClient } = require('@antiai/database');
const crypto = require('crypto');

async function run() {
  const prisma = new PrismaClient();
  try {
    const channelId = crypto.randomUUID();
    const videoId = crypto.randomUUID();
    const proof = await prisma.proof.create({
      data: {
        videoId,
        channelId,
        status: 'pending',
        alg: 'Ed25519',
        kid: 'dummy',
        payloadB64: 'dummy',
        signatureB64: 'dummy',
        payloadJson: {},
        expiresAt: new Date()
      }
    });
    console.log("SUCCESS!", proof.id);
  } catch(e) {
    console.error("FAIL:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
