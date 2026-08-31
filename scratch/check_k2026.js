require('dotenv').config();
const { PrismaClient } = require('@antiai/database');
const prisma = new PrismaClient();

async function main() {
    const k = await prisma.signingKey.findUnique({ where: { id: 'k_2026_02' } });
    console.log(JSON.stringify(k, null, 2));
    await prisma.$disconnect();
}
main();
