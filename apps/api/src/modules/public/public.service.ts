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

    async verifyVideo(platform: string, platformId: string) {
        if (!platformId) {
            return {
                status: 'unverified',
                platform,
                platform_id: platformId,
                message: 'Missing video ID',
            };
        }

        const result = await this.proofsService.getActiveProofByPlatformId(platform, platformId);

        if (!result) {
            return {
                status: 'unverified',
                platform,
                platform_id: platformId,
                channel_name: null,
                channel_handle: null,
                proof: null,
                public_creator_url: null,
                message: 'No verification proof found for this video',
            };
        }

        const { video, proof } = result;
        const now = new Date();

        // Extract true AntiAI Handle if it exists
        const antiAiHandle = video.channel?.user?.profile?.handle || null;

        // Check if proof is expired
        if (proof.expiresAt < now) {
            return {
                status: 'expired',
                platform,
                platform_id: video.platformId,
                channel_name: video.channel.channelName,
                channel_handle: video.channel.channelHandle,
                proof: this.formatProof(proof),
                public_creator_url: this.getCreatorUrl(antiAiHandle),
                message: 'Verification proof has expired',
            };
        }

        // Check if channel is still verified
        if (video.channel.verificationStatus !== 'verified') {
            return {
                status: 'revoked',
                platform,
                platform_id: video.platformId,
                channel_name: video.channel.channelName,
                channel_handle: video.channel.channelHandle,
                proof: this.formatProof(proof),
                public_creator_url: null,
                message: 'Channel verification has been revoked',
            };
        }

        return {
            status: 'verified',
            platform,
            platform_id: video.platformId,
            channel_name: video.channel.channelName,
            channel_handle: video.channel.channelHandle,
            proof: this.formatProof(proof),
            public_creator_url: this.getCreatorUrl(antiAiHandle),
            message: null,
        };
    }

    async getProofToken(platform: string, platformId: string) {
        const result = await this.proofsService.getActiveProofByPlatformId(platform, platformId);

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
     * Reusable profile structure query to minimize duplication
     */
    private async fetchProfileQuery(where: any) {
        return this.prisma.creatorProfile.findUnique({
            where,
            include: {
                user: {
                    include: {
                        subscription: {
                            select: {
                                plan: true,
                            },
                        },
                        channels: {
                            where: { verificationStatus: 'verified' },
                            select: {
                                id: true,
                                platformId: true,
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
    }

    /**
     * Get public creator profile by handle (Linktree-style page)
     */
    async getCreatorProfile(handle: string): Promise<any> {
        const profile = await this.fetchProfileQuery({ handle: handle.toLowerCase() });

        if (!profile || !profile.isPublic) {
            return null;
        }

        return this.formatProfileResponse(profile);
    }

    /**
     * Get public creator profile by custom domain
     */
    async getCreatorProfileByDomain(domain: string): Promise<any> {
        const profile = await this.fetchProfileQuery({ customDomain: domain.toLowerCase() });

        if (!profile || !profile.isPublic) {
            return null;
        }

        // Check if user is still on ELITE plan, otherwise refuse to render the custom domain
        const plan = profile.user?.subscription?.plan || 'free';
        if (plan !== 'elite') {
            return null;
        }

        return this.formatProfileResponse(profile);
    }

    /**
     * Get Creator Directory (Trending and Recent)
     * GET /public/creators
     */
    async getCreatorDirectory(): Promise<any> {
        // 1. Recently Verified (The Grid)
        // Find creators who have at least one verified channel, ordered by the channel's verifiedAt descending.
        const recentProfiles = await this.prisma.creatorProfile.findMany({
            where: {
                isPublic: true,
                user: {
                    channels: {
                        some: { verificationStatus: 'verified' }
                    }
                }
            },
            include: {
                user: {
                    include: {
                        channels: {
                            where: { verificationStatus: 'verified' },
                            orderBy: { verifiedAt: 'desc' },
                            take: 1
                        }
                    }
                }
            },
            take: 20
        });

        // Map them into the expected format and sort them in memory by the actual verifiedAt 
        const recent = recentProfiles
            .map(p => ({
                id: p.id,
                name: p.displayName || p.handle,
                handle: p.handle,
                avatar: p.avatarUrl,
                categories: p.categories,
                bio: p.bio,
                followers: '0', // We don't have real follower counts yet
                verifiedDate: p.user.channels[0]?.verifiedAt?.toISOString() || p.createdAt.toISOString(),
                featured: false
            }))
            .sort((a, b) => new Date(b.verifiedDate).getTime() - new Date(a.verifiedDate).getTime())
            .slice(0, 12);

        // 2. Trending Authentic Profiles (The Featured List)
        // 14-day lookback for views
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Get view counts
        const viewCounts = await this.prisma.analyticsEvent.groupBy({
            by: ['creatorId'],
            where: {
                type: 'view',
                createdAt: { gte: fourteenDaysAgo }
            },
            _count: {
                _all: true
            }
        });

        const viewCountMap = new Map(viewCounts.map(v => [v.creatorId, v._count._all]));

        // Fetch candidates for trending (either featured OR have had views)
        const trendingCandidates = await this.prisma.creatorProfile.findMany({
            where: {
                isPublic: true,
                OR: [
                    { isFeatured: true },
                    { id: { in: Array.from(viewCountMap.keys()) } }
                ]
            }
        });

        // Sort candidates:
        // 1. isFeatured always on top
        // 2. Highest view count
        // 3. Fallback to createdAt 
        const trending = trendingCandidates
            .sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;

                const viewsA = viewCountMap.get(a.id) || 0;
                const viewsB = viewCountMap.get(b.id) || 0;
                if (viewsA !== viewsB) return viewsB - viewsA;

                return b.createdAt.getTime() - a.createdAt.getTime();
            })
            .slice(0, 6)
            .map(p => ({
                id: p.id,
                name: p.displayName || p.handle,
                handle: p.handle,
                avatar: p.avatarUrl,
                categories: p.categories,
                bio: p.bio,
                followers: '0',
                verifiedDate: p.createdAt.toISOString(),
                featured: true
            }));

        // If we don't have enough trending, pad with the newest profiles
        if (trending.length < 6) {
            const excludeIds = trending.map(t => t.id);
            const fallbackProfiles = await this.prisma.creatorProfile.findMany({
                where: {
                    isPublic: true,
                    id: { notIn: excludeIds }
                },
                orderBy: { createdAt: 'desc' },
                take: 6 - trending.length
            });

            trending.push(...fallbackProfiles.map(p => ({
                id: p.id,
                name: p.displayName || p.handle,
                handle: p.handle,
                avatar: p.avatarUrl,
                categories: p.categories,
                bio: p.bio,
                followers: '0',
                verifiedDate: p.createdAt.toISOString(),
                featured: true
            })));
        }

        return {
            trending,
            recent
        };
    }

    private async formatProfileResponse(profile: any) {
        // Get recent verified videos from all channels
        const channelIds = profile.user.channels.map((c: any) => c.id);
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
            sponsored_products: (profile.appearance as any)?.sponsored_products || [],
            channels: profile.user.channels.map((c: any) => ({
                platform_id: c.platformId,
                channel_name: c.channelName,
                channel_handle: c.channelHandle,
                avatar_url: c.avatarUrl,
            })),
            links: profile.user.links.map((l: any) => ({
                label: l.label,
                url: l.url,
                icon: l.icon,
            })),
            featured_video: profile.featuredVideo ? {
                platform_id: profile.featuredVideo.platformId,
                title: profile.featuredVideo.title,
                thumbnail_url: profile.featuredVideo.thumbnailUrl,
                verified: profile.featuredVideo.proofs.length > 0,
            } : null,
            verified_videos: recentVideos.map(v => ({
                id: v.id,
                platform_id: v.platformId,
                title: v.title,
                thumbnail_url: v.thumbnailUrl,
                proof_id: v.proofs?.[0]?.id,
                published_at: v.publishedAt,
            })),
            id: profile.id,
            plan: profile.user.subscription?.plan || 'free',
            custom_domain: profile.customDomain || null,
            verification_token: this.generateVerificationToken(profile),
        };
    }
    private generateVerificationToken(profile: any): string {
        // Create a deterministic hash based on stable profile identity and modification time
        // In a real scenario, this would use a secret key from environment variables
        const secret = process.env.JWT_SECRET || 'antiai-verification-secret';
        const data = `${profile.id}:${profile.handle}:${profile.updatedAt?.toISOString() || profile.createdAt.toISOString()}`;

        // Use Node's crypto module
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
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

