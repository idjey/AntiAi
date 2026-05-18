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

@Injectable()
export class ProofsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly videosService: VideosService,
    ) { }

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
        let signedProof;
        try {
            signedProof = await signProof({
                kid,
                youtubeVideoId: video.platformId,
                youtubeChannelId: video.channel.platformId,
                expiresAt,
                privateKeyB64,
            });
        } catch (error) {
            console.error('Crypto Signing Error:', error);
            throw new BadRequestException('Failed to sign proof: ' + error.message);
        }

        // Store proof
        const proof = await this.prisma.proof.create({
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
            },
            include: {
                video: { select: { platformId: true, title: true } },
            },
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
                    kid: signedProof.kid,
                },
            },
        });

        // Increment monthly usage counter
        await this.prisma.subscription.update({
            where: { userId },
            data: { videosThisMonth: { increment: 1 } },
        });

        return this.formatProof(proof);
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
        const video = await this.prisma.video.findUnique({
            where: { platform_platformId: { platform, platformId } },
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
        const video = await this.prisma.video.findUnique({
            where: { platform_platformId: { platform, platformId } },
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
