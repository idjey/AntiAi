import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProofsService } from './modules/proofs/proofs.service';
import { PrismaService } from './prisma/prisma.service';
import * as crypto from 'crypto';

process.env.GOOGLE_CLIENT_ID = 'dummy';
process.env.GOOGLE_CLIENT_SECRET = 'dummy';
process.env.JWT_SECRET = 'dummy';
process.env.OPENAI_API_KEY = 'dummy';
process.env.YOUTUBE_API_KEY = 'dummy';

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const proofsService = app.get(ProofsService);
    const prisma = app.get(PrismaService);

    console.log('--- Testing Proof Issuance Pipeline ---');

    // Find any user with a channel and a video
    const user = await prisma.user.findFirst({
        where: { role: 'creator', channels: { some: { videos: { some: {} } } } },
        include: { channels: { include: { videos: { take: 1 } }, take: 1 } }
    });

    if (!user || !user.channels[0] || !user.channels[0].videos[0]) {
        console.log('No user with a video found, please seed the db.');
        await app.close();
        return;
    }

    // Ensure the user has an active subscription to bypass the check
    await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { status: 'active', plan: 'pro', videosThisMonth: 0 },
        create: { userId: user.id, status: 'active', plan: 'pro', videosThisMonth: 0 }
    });

    const video = user.channels[0].videos[0];
    console.log(`Using existing test video: ${video.id}`);

    // Ensure there isn't an active proof already
    await prisma.proof.deleteMany({
        where: { videoId: video.id }
    });

    // 2. Issue Proof
    const contentHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    const perceptualHash = 'p:1100110011001100';

    const issueDto = {
        video_id: video.id,
        content_hash: contentHash,
        perceptual_hash: perceptualHash
    };

    console.log(`Issuing proof via ProofsService with DTO:`, issueDto);
    
    const result = await proofsService.issueProof(user.id, issueDto);
    console.log('--- Proof Issued Successfully ---');
    console.log('Returned from Service:', JSON.stringify(result, null, 2));

    // 3. Verify in Database
    const dbProof = await prisma.proof.findUnique({
        where: { id: result.id }
    });

    if (dbProof) {
        console.log('--- Database Record ---');
        console.log('contentHash in DB:', dbProof.contentHash);
        console.log('perceptualHash in DB:', dbProof.perceptualHash);
        
        const payloadStr = Buffer.from(dbProof.payloadB64, 'base64').toString('utf-8');
        console.log('Decoded payload:', payloadStr);
    }

    await app.close();
}
run();
