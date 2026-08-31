require('dotenv').config();
const { PrismaClient } = require('@antiai/database');
const prisma = new PrismaClient();

async function main() {
    const keys = await prisma.signingKey.findMany();
    keys.forEach(k => {
        const buf = Buffer.from(k.publicKeyB64, 'base64');
        console.log(k.id, buf.length, 'bytes. Starts with 302?', buf.toString('hex').startsWith('302'));
    });
    await prisma.$disconnect();
}
main();
