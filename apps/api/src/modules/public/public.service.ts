import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ProofsService } from '../proofs/proofs.service';

@Injectable()
export class PublicService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly proofsService: ProofsService,
    ) { }

    async verifyVideo(youtubeVideoId: string) {
        if (!youtubeVideoId) {
            return {
                status: 'unverified',
                youtube_video_id: youtubeVideoId,
                message: 'Missing video ID',
            };
        }

        const result = await this.proofsService.getActiveProofByVideoId(youtubeVideoId);

        if (!result) {
            return {
                status: 'unverified',
                youtube_video_id: youtubeVideoId,
                youtube_channel_id: null,
                channel_name: null,
                channel_handle: null,
                proof: null,
                public_creator_url: null,
                message: 'No verification proof found for this video',
            };
        }

        const { video, proof } = result;
        const now = new Date();

        // Check if proof is expired
        if (proof.expiresAt < now) {
            return {
                status: 'expired',
                youtube_video_id: youtubeVideoId,
                youtube_channel_id: video.channel.youtubeChannelId,
                channel_name: video.channel.channelName,
                channel_handle: video.channel.channelHandle,
                proof: this.formatProof(proof),
                public_creator_url: this.getCreatorUrl(video.channel.channelHandle),
                message: 'Verification proof has expired',
            };
        }

        // Check if channel is still verified
        if (video.channel.verificationStatus !== 'verified') {
            return {
                status: 'revoked',
                youtube_video_id: youtubeVideoId,
                youtube_channel_id: video.channel.youtubeChannelId,
                channel_name: video.channel.channelName,
                channel_handle: video.channel.channelHandle,
                proof: this.formatProof(proof),
                public_creator_url: null,
                message: 'Channel verification has been revoked',
            };
        }

        return {
            status: 'verified',
            youtube_video_id: youtubeVideoId,
            youtube_channel_id: video.channel.youtubeChannelId,
            channel_name: video.channel.channelName,
            channel_handle: video.channel.channelHandle,
            proof: this.formatProof(proof),
            public_creator_url: this.getCreatorUrl(video.channel.channelHandle),
            message: null,
        };
    }

    async getProofToken(youtubeVideoId: string) {
        const result = await this.proofsService.getActiveProofByVideoId(youtubeVideoId);

        if (!result) {
            return null;
        }

        const { proof } = result;

        return {
            alg: proof.alg,
            kid: proof.kid,
            payload_b64: proof.payloadB64,
            signature_b64: proof.signatureB64,
            expires_at: proof.expiresAt.toISOString(),
        };
    }

    async getProofById(proofId: string) {
        const proof = await this.prisma.proof.findUnique({
            where: { id: proofId },
        });

        if (!proof) {
            return null;
        }

        return this.formatProof(proof);
    }

    async getSigningKeys() {
        const keys = await this.prisma.signingKey.findMany({
            where: { isActive: true },
            select: {
                id: true,
                alg: true,
                publicKeyB64: true,
            },
        });

        // If no keys in DB, return from environment
        if (keys.length === 0) {
            const kid = this.configService.get<string>('SIGNING_KEY_ID');
            const publicKeyB64 = this.configService.get<string>('SIGNING_PUBLIC_KEY_B64');

            if (kid && publicKeyB64) {
                return {
                    keys: [
                        {
                            kid,
                            alg: 'Ed25519',
                            public_key_b64: publicKeyB64,
                        },
                    ],
                };
            }
        }

        return {
            keys: keys.map((k) => ({
                kid: k.id,
                alg: k.alg,
                public_key_b64: k.publicKeyB64,
            })),
        };
    }

    /**
     * Get public creator profile by handle (Linktree-style page)
     */
    async getCreatorProfile(handle: string): Promise<any> {
        const profile = await this.prisma.creatorProfile.findUnique({
            where: { handle: handle.toLowerCase() },
            include: {
                user: {
                    include: {
                        channels: {
                            where: { verificationStatus: 'verified' },
                            select: {
                                id: true,
                                youtubeChannelId: true,
                                channelName: true,
                                channelHandle: true,
                                avatarUrl: true,
                            },
                        },
                        links: {
                            where: { isActive: true },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                featuredVideo: {
                    include: {
                        proofs: {
                            where: { status: 'active' },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!profile || !profile.isPublic) {
            return null;
        }

        // Get recent verified videos from all channels
        const channelIds = profile.user.channels.map(c => c.id);
        let recentVideos: any[] = [];

        if (channelIds.length > 0) {
            recentVideos = await this.prisma.video.findMany({
                where: {
                    channelId: { in: channelIds },
                    proofs: { some: { status: 'active' } },
                },
                include: {
                    proofs: {
                        where: { status: 'active' },
                        take: 1,
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 6,
            });
        }

        return {
            handle: profile.handle,
            display_name: profile.displayName,
            bio: profile.bio,
            avatar_url: profile.avatarUrl,
            banner_url: profile.bannerUrl,
            appearance: profile.appearance,
            channels: profile.user.channels.map(c => ({
                youtube_channel_id: c.youtubeChannelId,
                channel_name: c.channelName,
                channel_handle: c.channelHandle,
                avatar_url: c.avatarUrl,
            })),
            links: profile.user.links.map(l => ({
                label: l.label,
                url: l.url,
                icon: l.icon,
            })),
            featured_video: profile.featuredVideo ? {
                youtube_video_id: profile.featuredVideo.youtubeVideoId,
                title: profile.featuredVideo.title,
                thumbnail_url: profile.featuredVideo.thumbnailUrl,
                verified: profile.featuredVideo.proofs.length > 0,
            } : null,
            verified_videos: recentVideos.map(v => ({
                id: v.id,
                youtube_video_id: v.youtubeVideoId,
                title: v.title,
                thumbnail_url: v.thumbnailUrl,
                proof_id: v.proofs?.[0]?.id,
                published_at: v.publishedAt,
            })),
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
        };
    }

    private getCreatorUrl(handle: string | null): string | null {
        if (!handle) return null;
        const webUrl = this.configService.get<string>('WEB_URL') || 'https://antiai.me';
        return `${webUrl}/${handle}`;
    }
}

