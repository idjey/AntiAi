
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Smoke Test Seed...');

    // 0. Ensure Signing Key Exists FIRST
    const keyId = 'k_2026_smoke_test';
    await prisma.signingKey.upsert({
        where: { id: keyId },
        update: {},
        create: {
            id: keyId,
            alg: 'Ed25519',
            publicKeyB64: 'fake_key',
            isActive: true
        }
    });
    console.log('✅ Signing Key verified.');

    // 1. Ensure Admin Exists
    const adminEmail = 'idjey@icloud.com';
    const adminPassword = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'admin', passwordHash: adminPassword, isEmailVerified: true },
        create: {
            email: adminEmail,
            passwordHash: adminPassword,
            role: 'admin',
            isEmailVerified: true
        },
    });
    console.log('✅ Admin user verified.');

    // 2. Create Regular Users
    const users = [];
    for (let i = 1; i <= 5; i++) {
        const email = `creator${i}@example.com`;
        const password = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                passwordHash: password,
                role: 'creator',
                isEmailVerified: true,
                profile: {
                    create: {
                        handle: `creator_${i}`,
                        displayName: `Creator ${i}`,
                        bio: `I am creator number ${i}.`,
                        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
                        isPublic: true
                    }
                }
            },
            include: { profile: true }
        });
        users.push(user);
    }
    console.log(`✅ Created ${users.length} creators.`);

    // 3. Create Channels
    const channels = [];
    for (const user of users) {
        if (!user.profile) continue;

        let channel = await prisma.channel.findFirst({ where: { userId: user.id } });

        if (!channel) {
            const uniqueId = crypto.randomBytes(8).toString('hex');
            channel = await prisma.channel.create({
                data: {
                    userId: user.id,
                    channelName: `${user.profile.displayName}'s Channel`,
                    youtubeChannelId: `UC_${uniqueId}`,
                    channelUrl: `https://youtube.com/channel/UC_${uniqueId}`,
                    channelHandle: `@creator_${uniqueId}`,
                    avatarUrl: user.profile.avatarUrl,
                    verificationStatus: Math.random() > 0.7 ? 'verified' : 'pending'
                }
            });
        }
        channels.push(channel);
    }
    console.log(`✅ Created ${channels.length} channels.`);

    // 4. Create Videos & Proofs
    for (const channel of channels) {
        const count = await prisma.video.count({ where: { channelId: channel.id } });
        if (count > 0) continue;

        for (let j = 1; j <= 2; j++) {
            const vidId = crypto.randomBytes(6).toString('hex');
            const video = await prisma.video.create({
                data: {
                    channelId: channel.id,
                    title: `Video ${j} by ${channel.channelName}`,
                    youtubeVideoId: vidId,
                    videoUrl: `https://youtube.com/watch?v=${vidId}`,
                    thumbnailUrl: `https://picsum.photos/seed/${channel.id}-${j}/320/180`,
                    publishedAt: new Date()
                }
            });

            // Proof
            await prisma.proof.create({
                data: {
                    videoId: video.id,
                    channelId: channel.id,
                    kid: keyId,
                    alg: 'Ed25519',
                    payloadB64: Buffer.from('fake-payload').toString('base64'),
                    signatureB64: Buffer.from('fake-signature').toString('base64'),
                    payloadJson: { meta: 'data' },
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                    status: Math.random() > 0.8 ? 'revoked' : 'active',
                }
            });
        }
    }
    console.log('✅ Created videos and proofs.');

    // 5. Create Reports
    const randomVideo = await prisma.video.findFirst();
    if (randomVideo) {
        await prisma.report.create({
            data: {
                targetType: 'video', // Polymorphic not supported by strict schema maybe?
                // Wait, schema has relations: videoId, channelId
                videoId: randomVideo.id,
                reason: 'Misleading',
                details: 'This video claims to be AI but looks real.',
                status: 'open'
            }
        });

        await prisma.report.create({
            data: {
                channelId: channels[0].id,
                reason: 'Spam',
                details: 'Channel is posting spam videos.',
                status: 'reviewed',
            }
        });
    }
    console.log('✅ Created sample reports.');

    // 6. Moderation Queue - SKIPPED DUE TO STALE CLIENT
    /*
    const modUser = users[0];
    if (modUser.profile) {
        const existing = await prisma.moderationQueue.findFirst({ 
            where: { targetId: modUser.profile.id, status: 'PENDING' } 
        });
        
        if (!existing) {
            await prisma.moderationQueue.create({
                data: {
                    targetType: 'profile',
                    targetId: modUser.profile.id,
                    payload: {
                        old: { bio: 'Old', displayName: 'Old' },
                        new: { bio: 'New', displayName: 'New' }
                    },
                    status: 'PENDING'
                }
            });
        }
    }
    console.log('✅ Created moderation item.');
    */

    // 7. System Logs
    await prisma.transparencyLog.create({
        data: {
            eventType: 'system_startup',
            entityType: 'system',
            entityId: 'sys_1',
            data: { version: '1.0.0' }
        }
    });

    console.log('🎉 Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
