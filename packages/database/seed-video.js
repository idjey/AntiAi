const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "***REMOVED***"
        }
    }
});

async function main() {
    try {
        console.log('Finding user channel...');
        // Find Dj_ka's channel or any channel to attach it to
        const channel = await prisma.channel.findFirst();

        if (!channel) {
            console.log('No channels found to attach video to. Please create a channel first.');
            return;
        }

        console.log(`Found channel: ${channel.channelName} (${channel.id})`);

        // Check if video exists
        const videoId = 'xbN1AIQbo7A';
        let video = await prisma.video.findUnique({
            where: { youtubeVideoId: videoId }
        });

        if (!video) {
            console.log(`Creating video record for ${videoId}...`);
            video = await prisma.video.create({
                data: {
                    youtubeVideoId: videoId,
                    channelId: channel.id,
                    title: "Test Verified Video",
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    publishedAt: new Date()
                }
            });
        }

        console.log(`Video ID: ${video.id}`);

        // Fetch the active signing key from DB
        const signingKey = await prisma.signingKey.findFirst({
            where: { isActive: true }
        });

        if (!signingKey) {
            console.log("No active signing key found in DB! Cannot generate proof.");
            return;
        }

        // We need the private key to sign. It's in the .env.
        // If we are running this against production DB, we MUST use the production private key.
        const privateKeyB64 = process.env.SIGNING_PRIVATE_KEY_B64;
        if (!privateKeyB64) {
            console.log("SIGNING_PRIVATE_KEY_B64 is not set in environment!");
            return;
        }

        // Convert the private key back to Ed25519 format
        const privateKeyBuffer = Buffer.from(privateKeyB64, 'base64');
        const privateKey = crypto.createPrivateKey({
            key: privateKeyBuffer,
            format: 'der',
            type: 'pkcs8'
        });

        // Generate Canonical Payload
        const payloadJson = {
            iss: "anti-ai",
            sub: videoId,
            channel: channel.youtubeChannelId,
            timestamp: new Date().toISOString()
        };
        const payloadStr = JSON.stringify(payloadJson);
        const payloadB64 = Buffer.from(payloadStr).toString('base64url');

        // Sign Payload
        const signatureBuffer = crypto.sign(null, Buffer.from(payloadStr), privateKey);
        const signatureB64 = signatureBuffer.toString('base64url');

        console.log(`Payload: ${payloadB64}`);
        console.log(`Signature: ${signatureB64}`);

        // Insert Proof
        console.log("Inserting Proof into database...");
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

        const proof = await prisma.proof.create({
            data: {
                videoId: video.id,
                channelId: channel.id,
                kid: signingKey.id,
                alg: 'Ed25519',
                payloadJson: payloadJson,
                payloadB64: payloadB64,
                signatureB64: signatureB64,
                expiresAt: expiresAt,
                status: 'active'
            }
        });

        console.log(`Proof successfully generated and inserted! Proof ID: ${proof.id}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
