
import { PrismaClient } from '@antiai/database';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const channelCount = await prisma.channel.count();
    const videoCount = await prisma.video.count();
    const proofCount = await prisma.proof.count();
    const reportCount = await prisma.report.count();

    console.log('--- Database Record Counts ---');
    console.log(`Users: ${userCount}`);
    console.log(`Channels: ${channelCount}`);
    console.log(`Videos: ${videoCount}`);
    console.log(`Proofs: ${proofCount}`);
    console.log(`Reports: ${reportCount}`);
    console.log('------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
