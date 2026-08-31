import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VideosService } from '../videos/videos.service';
import { signProof } from '@antiai/crypto';
import { IssueProofDto, ReissueProofDto } from './dto';
import { getPlanLimits } from '@antiai/shared';
import * as crypto from 'crypto';

@Injectable()
export class ProofsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly videosService: VideosService,
    ) { }

    private rolloutCache: { pct: number; expiresAt: number } = { pct: 0, expiresAt: 0 };

    private async getRolloutPct(): Promise<number> {
        const now = Date.now();
        if (now < this.rolloutCache.expiresAt) {
            return this.rolloutCache.pct;
        }

        try {
            const setting = await this.prisma.systemSetting.findUnique({
                where: { key: 'KMS_ROLLOUT_PCT' },
            });
            const pct = parseInt(setting?.value || '0', 10) || 0;
            this.rolloutCache = { pct, expiresAt: now + 5000 }; // 5-second TTL
            return pct;
        } catch (err) {
            console.error('Failed to read KMS_ROLLOUT_PCT from DB', err);
            return 0;
        }
    }

    async listUserProofs(userId: string, videoId?: string) {
        // Get user's verified channels
        const channels = await this.prisma.channel.findMany({
            where: { userId, verificationStatus: 'verified' },
            select: { id: true },
        });

        const channelIds = channels.map((c) => c.id);
        if (channelIds.length === 0) {
            return { items: [] };
        }

        const where: any = { channelId: { in: channelIds } };
        if (videoId) where.videoId = videoId;

        const proofs = await this.prisma.proof.findMany({
            where,
            include: {
                video: { select: { platformId: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            items: proofs.map((p) => this.formatProof(p)),
        };
    }

    async issueProof(userId: string, dto: IssueProofDto) {
        // Check for disable_proofs setting
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'disable_proofs' },
        });
        if (setting?.value === 'true') {
            throw new BadRequestException('Proof issuance is currently disabled.');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        if (!user || user.isSuspended) {
            throw new ForbiddenException('Account is suspended or not found');
        }

        if (!user.subscription || user.subscription.status !== 'active') {
            throw new ForbiddenException('Active subscription required to issue proofs');
        }

        // Verify video ownership
        const video = await this.videosService.getVideoWithChannel(dto.video_id, userId);
        if (!video) {
            throw new ForbiddenException('Video not found or not owned by verified channel');
        }

        // Check if active proof already exists
        const existingActive = await this.prisma.proof.findFirst({
            where: {
                videoId: dto.video_id,
                status: 'active',
            },
        });

        if (existingActive) {
            throw new ConflictException('Active proof already exists. Use reissue endpoint.');
        }

        // ── Plan quota enforcement ──
        const limits = getPlanLimits(user.subscription.plan);

        if (limits.videosPerMonth !== -1 && user.subscription.videosThisMonth >= limits.videosPerMonth) {
            throw new BadRequestException(
                `Monthly proof limit reached (${limits.videosPerMonth} videos). Please upgrade your plan.`
            );
        }

        // Get signing key
        const kid = this.configService.get<string>('SIGNING_KEY_ID');
        const privateKeyB64 = this.configService.get<string>('SIGNING_PRIVATE_KEY_B64');

        if (!kid || !privateKeyB64) {
            throw new BadRequestException('Signing keys not configured');
        }

        // Ensure SigningKey exists in DB (Foreign Key constraint)
        const publicKeyB64 = this.configService.get<string>('SIGNING_PUBLIC_KEY_B64');
        if (publicKeyB64) {
            await this.ensureSigningKey(kid, publicKeyB64);
        }

        // Sign the proof — expiry is server-computed from plan limits
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + limits.proofExpiryDays);
        let perceptualHashes: Record<string, string> | undefined = undefined;
        let perceptualHashVersion: number | undefined = undefined;
        if (dto.perceptual_hashes && dto.perceptual_hashes.length > 0) {
            perceptualHashes = {};
            for (const ph of dto.perceptual_hashes) {
                perceptualHashes[ph.fraction.toString()] = ph.hash;
                perceptualHashVersion = ph.version; // They should all have the same version
            }
        }

        // Store proof initially as pending
        const proof = await this.prisma.proof.create({
            data: {
                videoId: video.id,
                channelId: video.channelId,
                alg: 'Ed25519',
                kid,
                payloadJson: {},
                payloadB64: 'PENDING',
                signatureB64: 'PENDING',
                contentHash: dto.content_hash,
                expiresAt,
                status: 'pending' as any, // Cast as any if Prisma types are stale
            },
            include: {
                video: { select: { platformId: true, title: true } },
            },
        });

        if (dto.perceptual_hashes) {
            for (const phash of dto.perceptual_hashes) {
                await this.prisma.$executeRaw`
                    INSERT INTO proof_perceptual_hashes (id, proof_id, anchor_fraction, phash_bits, version)
                    VALUES (gen_random_uuid(), ${proof.id}::uuid, ${phash.fraction}, ('x' || ${phash.hash})::bit(64), ${phash.version})
                `;
            }
        }

        // ── INCREMENT 3: GRADUAL ROLLOUT & FALLBACK ──
        const rolloutPct = await this.getRolloutPct();
        const useKms = Math.random() * 100 < rolloutPct || dto.content_hash === 'shadow-verify-test';

        let signedProofResult = null;
        let kmsSuccess = false;

        if (useKms) {
            try {
                const jwt = require('jsonwebtoken');
                const internalSecret = this.configService.get<string>('INTERNAL_SIGNER_SECRET') || 'dev-internal-secret';
                const token = jwt.sign({ service: 'api' }, internalSecret, { expiresIn: '5m' });

                const signerUrl = this.configService.get<string>('SIGNER_URL') || 'http://localhost:4001';
                const response = await fetch(`${signerUrl}/internal/sign`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ proofId: proof.id })
                });

                if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`Signer returned ${response.status}: ${errBody}`);
                }

                signedProofResult = await response.json();

                // ── GUARDRAIL 2: SELF-VERIFICATION (WORKER SIDE) ──
                const updatedProof = await this.prisma.proof.findUnique({ where: { id: proof.id } });
                if (!updatedProof || !updatedProof.signatureB64) {
                    throw new Error('Signer succeeded but DB not updated with signature');
                }

                const rawSigBuffer = Buffer.from(
                    updatedProof.signatureB64.replace(/-/g, '+').replace(/_/g, '/'),
                    'base64'
                );

                if (!publicKeyB64) {
                    throw new Error('SIGNING_PUBLIC_KEY_B64 not configured');
                }
                const publicKeyBytes = Buffer.from(publicKeyB64, 'base64');
                const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
                const fullSpki = Buffer.concat([spkiPrefix, publicKeyBytes]);
                
                const publicKeyObject = crypto.createPublicKey({
                    key: fullSpki,
                    format: 'der',
                    type: 'spki'
                });

                const decodedPayload = Buffer.from(updatedProof.payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
                
                if (!crypto.verify(null, decodedPayload, publicKeyObject, rawSigBuffer)) {
                     throw new Error('Worker-side KMS signature self-verification failed');
                }

                kmsSuccess = true;
            } catch (error) {
                console.error('KMS Signer Service Error, falling back to legacy:', error);
                // Fallback to legacy
                kmsSuccess = false;
            }
        }

        if (!kmsSuccess) {
            // Fallback to legacy CPU-bound signer
            console.log(`[ProofsService] Using legacy local signer for proof ${proof.id}`);
            const signedProof = await signProof({
                kid,
                youtubeVideoId: video.platformId,
                youtubeChannelId: video.channel.platformId,
                expiresAt,
                privateKeyB64,
                contentHash: dto.content_hash,
                perceptualHashes,
                perceptualHashVersion
            });

            await this.prisma.proof.update({
                where: { id: proof.id },
                data: {
                    alg: signedProof.alg,
                    kid: signedProof.kid,
                    payloadJson: signedProof.payload_json as any,
                    payloadB64: signedProof.payload_b64,
                    signatureB64: signedProof.signature_b64,
                    status: 'active' as any,
                },
            });
        }

        const completedProof = await this.prisma.proof.findUnique({
            where: { id: proof.id }
        });



        // Log to transparency log
        await this.prisma.transparencyLog.create({
            data: {
                eventType: 'proof_issued',
                entityType: 'proof',
                entityId: proof.id,
                data: {
                    video_id: video.platformId,
                    channel_id: video.channel.platformId,
                    kid: kid,
                },
            },
        });

        // Increment monthly usage counter
        await this.prisma.subscription.update({
            where: { userId },
            data: { videosThisMonth: { increment: 1 } },
        });

        return this.formatProof(completedProof);
    }

    async reissueProof(userId: string, dto: ReissueProofDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        if (!user || user.isSuspended) {
            throw new ForbiddenException('Account is suspended or not found');
        }

        if (!user.subscription || user.subscription.status !== 'active') {
            throw new ForbiddenException('Active subscription required to reissue proofs');
        }

        // Verify video ownership
        const video = await this.videosService.getVideoWithChannel(dto.video_id, userId);
        if (!video) {
            throw new ForbiddenException('Video not found or not owned by verified channel');
        }

        // Find existing active proof
        const existingProof = await this.prisma.proof.findFirst({
            where: {
                videoId: dto.video_id,
                status: 'active',
            },
        });

        if (!existingProof) {
            throw new NotFoundException('No active proof found. Use issue endpoint.');
        }

        // Get signing key
        const kid = this.configService.get<string>('SIGNING_KEY_ID');
        const privateKeyB64 = this.configService.get<string>('SIGNING_PRIVATE_KEY_B64');

        if (!kid || !privateKeyB64) {
            throw new BadRequestException('Signing keys not configured');
        }

        // Sign new proof — expiry is server-computed from plan limits
        const limits = getPlanLimits(user.subscription.plan);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + limits.proofExpiryDays);
        const signedProof = await signProof({
            kid,
            youtubeVideoId: video.platformId,
            youtubeChannelId: video.channel.platformId,
            expiresAt,
            privateKeyB64,
        });

        // Create new proof and supersede old one in transaction
        const [oldProof, newProof] = await this.prisma.$transaction([
            // Mark old proof as superseded
            this.prisma.proof.update({
                where: { id: existingProof.id },
                data: {
                    status: 'superseded',
                    supersededAt: new Date(),
                },
            }),
            // Create new proof
            this.prisma.proof.create({
                data: {
                    videoId: video.id,
                    channelId: video.channelId,
                    alg: signedProof.alg,
                    kid: signedProof.kid,
                    payloadJson: signedProof.payload_json as any,
                    payloadB64: signedProof.payload_b64,
                    signatureB64: signedProof.signature_b64,
                    expiresAt,
                    status: 'active',
                    supersedesProofId: existingProof.id,
                },
                include: {
                    video: { select: { platformId: true, title: true } },
                },
            }),
        ]);

        // Log to transparency log
        await this.prisma.transparencyLog.create({
            data: {
                eventType: 'proof_superseded',
                entityType: 'proof',
                entityId: newProof.id,
                data: {
                    old_proof_id: oldProof.id,
                    reason: dto.reason,
                    note: dto.note,
                },
            },
        });

        return {
            new_proof: this.formatProof(newProof),
            old_proof: this.formatProof(oldProof),
        };
    }

    async getActiveProofByPlatformId(platform: string, platformId: string): Promise<any> {
        const video = await this.prisma.video.findFirst({
            where: { platform, platformId },
            include: {
                channel: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                proofs: {
                    where: { status: 'active' },
                    take: 1,
                },
            },
        });

        if (!video || video.proofs.length === 0) {
            return null;
        }

        return {
            video,
            proof: video.proofs[0],
        };
    }

    async getPublicProof(videoId: string) {
        // Find video by internal ID
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: {
                channel: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                proofs: {
                    where: { status: 'active' },
                    take: 1,
                },
            },
        });

        if (!video) {
            throw new NotFoundException('Video not found');
        }

        const proof = video.proofs[0];

        return {
            video: {
                id: video.id,
                title: video.title,
                platform_id: video.platformId,
                thumbnail_url: video.thumbnailUrl,
                published_at: video.publishedAt,
            },
            channel: {
                id: video.channel.id,
                name: video.channel.channelName,
                handle: video.channel.channelHandle,
                avatar_url: video.channel.avatarUrl,
                platform_id: video.channel.platformId,
                verification_status: video.channel.verificationStatus,
                verified_at: video.channel.verifiedAt,
            },
            proof: proof ? this.formatProof(proof) : null,
        };
    }

    async getPublicProofByPlatformId(platform: string, platformId: string) {
        // Find video by Platform ID
        let video = await this.prisma.video.findFirst({
            where: { platform, platformId },
            include: {
                channel: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                proofs: {
                    where: { status: 'active' },
                    take: 1,
                },
            },
        });

        if (!video) {
            throw new NotFoundException('Video not found');
        }

        const proof = video.proofs[0];

        return {
            video: {
                id: video.id,
                title: video.title,
                platform_id: video.platformId,
                thumbnail_url: video.thumbnailUrl,
                published_at: video.publishedAt,
            },
            channel: {
                id: video.channel.id,
                name: video.channel.channelName,
                handle: video.channel.channelHandle,
                avatar_url: video.channel.avatarUrl,
                platform_id: video.channel.platformId,
                verification_status: video.channel.verificationStatus,
                verified_at: video.channel.verifiedAt,
            },
            proof: proof ? this.formatProof(proof) : null,
        };
    }

    private formatProof(proof: any) {
        return {
            id: proof.id,
            video_id: proof.videoId,
            channel_id: proof.channelId,
            alg: proof.alg,
            kid: proof.kid,
            payload_json: proof.payloadJson,
            payload_b64: proof.payloadB64,
            signature_b64: proof.signatureB64,
            issued_at: proof.issuedAt.toISOString(),
            expires_at: proof.expiresAt.toISOString(),
            status: proof.status,
            supersedes_proof_id: proof.supersedesProofId,
            superseded_at: proof.supersededAt?.toISOString() || null,
            revoked_at: proof.revokedAt?.toISOString() || null,
            revoke_reason: proof.revokeReason,
        };
    }

    private async ensureSigningKey(kid: string, publicKeyB64: string) {
        // Check if key exists using findUnique to utilize cache/index
        const existing = await this.prisma.signingKey.findUnique({
            where: { id: kid },
        });

        if (!existing) {
            // Create it if missing
            await this.prisma.signingKey.create({
                data: {
                    id: kid,
                    publicKeyB64,
                    alg: 'Ed25519',
                    isActive: true,
                },
            });
            console.log(`[ProofsService] Created missing SigningKey record for ${kid}`);
        }
    }
}
