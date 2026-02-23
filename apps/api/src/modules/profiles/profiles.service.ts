import {
    Injectable,
    BadRequestException,
    ConflictException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateProfileDto,
    UpdateProfileDto,
    CreateLinkDto,
    UpdateLinkDto,
    ReorderLinksDto,
} from './dto';

// Reserved handles that cannot be used (all system routes)
// These prevent users from claiming handles that conflict with app pages
const RESERVED_HANDLES = [
    // Auth routes
    'login', 'logout', 'signup', 'register', 'forgot-password', 'reset-password',
    // App routes
    'dashboard', 'settings', 'billing', 'profile', 'channels', 'videos', 'proofs',
    // Admin routes
    'admin', 'moderation', 'reports',
    // Marketing pages
    'pricing', 'how-it-works', 'about', 'contact', 'blog', 'help', 'support', 'faq',
    // Legal pages
    'terms', 'privacy', 'cookies', 'legal', 'dmca',
    // API/System routes
    'api', 'auth', 'public', 'health', 'status', 'docs', 'swagger',
    // Brand protection
    'antiai', 'anti-ai', 'antiaime', 'official', 'verified', 'team', 'staff',
    // Common reserved words
    'www', 'app', 'web', 'mail', 'email', 'home', 'null', 'undefined', 'root',
    'creator', 'creators', 'user', 'users', 'account', 'accounts',
    // Extension/verification
    'verify', 'verification', 'proof', 'certificate', 'badge', 'extension',
];

@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) { }

    // ==================== PROFILE ====================

    async getProfile(userId: string) {
        const profile = await this.prisma.creatorProfile.findUnique({
            where: { userId },
            include: {
                featuredVideo: {
                    include: {
                        proofs: {
                            where: { status: 'active' },
                            take: 1,
                        },
                    },
                },
                user: {
                    include: { subscription: true }
                }
            },
        });

        // Fetch verified videos (latest 6)
        const verifiedVideos = await this.prisma.video.findMany({
            where: {
                channel: { userId },
                proofs: { some: { status: 'active' } }
            },
            take: 6,
            orderBy: { publishedAt: 'desc' },
            include: {
                proofs: {
                    where: { status: 'active' },
                    take: 1,
                },
            },
        });

        if (!profile) {
            return { profile: null };
        }

        return {
            profile: this.formatProfile(profile, verifiedVideos),
        };
    }

    async createProfile(userId: string, dto: CreateProfileDto) {
        // Check if profile already exists
        const existing = await this.prisma.creatorProfile.findUnique({
            where: { userId },
        });

        if (existing) {
            throw new ConflictException('Profile already exists');
        }

        // Validate handle
        await this.validateHandle(dto.handle);

        const profile = await this.prisma.creatorProfile.create({
            data: {
                userId,
                handle: dto.handle.toLowerCase(),
                displayName: dto.display_name,
                bio: dto.bio,
                avatarUrl: dto.avatar_url,
                bannerUrl: dto.banner_url,
                featuredVideoId: dto.featured_video_id,
                appearance: (dto.appearance ?? {}) as any,
            },
        });

        return { profile: this.formatProfile(profile) };
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const existing = await this.prisma.creatorProfile.findUnique({
            where: { userId },
            include: { user: { include: { subscription: true } } }
        });

        if (!existing) {
            throw new NotFoundException('Profile not found');
        }

        // Validate plan features for appearance
        if (dto.appearance) {
            const isPro = ['pro', 'elite'].includes(existing.user?.subscription?.plan || 'free');
            const appearance = dto.appearance as any;

            if (!isPro) {
                // Strip Pro features if Free
                if (appearance.public_background_type && appearance.public_background_type !== 'color') {
                    appearance.public_background_type = 'color';
                }
                if (appearance.card_background_type && appearance.card_background_type !== 'color') {
                    appearance.card_background_type = 'color';
                }
            }
        }

        // If handle is being changed, validate it
        if (dto.handle && dto.handle.toLowerCase() !== existing.handle) {
            await this.validateHandle(dto.handle);
        }

        // If featured_video_id is provided, validate ownership
        if (dto.featured_video_id) {
            const video = await this.prisma.video.findFirst({
                where: {
                    id: dto.featured_video_id,
                    channel: { userId },
                },
            });
            if (!video) {
                throw new ForbiddenException('Video not found or not owned by you');
            }
        }

        const oldProfile = { ...existing };

        const profile = await this.prisma.creatorProfile.update({
            where: { userId },
            data: {
                handle: dto.handle?.toLowerCase(),
                displayName: dto.display_name,
                bio: dto.bio,
                avatarUrl: dto.avatar_url,
                bannerUrl: dto.banner_url,
                featuredVideoId: dto.featured_video_id,
                isPublic: dto.is_public,
                appearance: dto.appearance as any,
            },
            include: {
                featuredVideo: true,
            },
        });

        // Create Moderation entry if bio or avatar changed
        if (oldProfile.bio !== profile.bio || oldProfile.avatarUrl !== profile.avatarUrl) {
            await this.prisma.moderationQueue.create({
                data: {
                    targetType: 'profile',
                    targetId: profile.id, // Using Profile ID
                    payload: {
                        old: {
                            bio: oldProfile.bio,
                            avatarUrl: oldProfile.avatarUrl,
                            displayName: oldProfile.displayName
                        },
                        new: {
                            bio: profile.bio,
                            avatarUrl: profile.avatarUrl,
                            displayName: profile.displayName
                        }
                    },
                    status: 'PENDING'
                }
            });
        }

        // Fetch verified videos (latest 6)
        const verifiedVideos = await this.prisma.video.findMany({
            where: {
                channel: { userId },
                proofs: { some: { status: 'active' } }
            },
            take: 6,
            orderBy: { publishedAt: 'desc' },
            include: {
                proofs: {
                    where: { status: 'active' },
                    take: 1,
                },
            },
        });

        return { profile: this.formatProfile(profile, verifiedVideos) };
    }

    // ==================== LINKS ====================

    async getLinks(userId: string) {
        const links = await this.prisma.creatorLink.findMany({
            where: { userId },
            orderBy: { sortOrder: 'asc' },
        });

        return {
            items: links.map((l) => this.formatLink(l)),
        };
    }

    async createLink(userId: string, dto: CreateLinkDto) {
        // Get current max sort order
        const maxOrder = await this.prisma.creatorLink.aggregate({
            where: { userId },
            _max: { sortOrder: true },
        });

        const link = await this.prisma.creatorLink.create({
            data: {
                userId,
                label: dto.label,
                url: dto.url,
                icon: dto.icon || this.inferIcon(dto.url),
                customImageUrl: dto.custom_image_url,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            } as any,
        });

        return { link: this.formatLink(link) };
    }

    async updateLink(userId: string, linkId: string, dto: UpdateLinkDto) {
        const link = await this.prisma.creatorLink.findFirst({
            where: { id: linkId, userId },
        });

        if (!link) {
            throw new NotFoundException('Link not found');
        }

        const updated = await this.prisma.creatorLink.update({
            where: { id: linkId },
            data: {
                label: dto.label,
                url: dto.url,
                icon: dto.icon,
                customImageUrl: dto.custom_image_url,
                isActive: dto.is_active,
            } as any,
        });

        return { link: this.formatLink(updated) };
    }

    async deleteLink(userId: string, linkId: string) {
        const link = await this.prisma.creatorLink.findFirst({
            where: { id: linkId, userId },
        });

        if (!link) {
            throw new NotFoundException('Link not found');
        }

        await this.prisma.creatorLink.delete({
            where: { id: linkId },
        });
    }

    async reorderLinks(userId: string, dto: ReorderLinksDto) {
        // Update sort orders in transaction
        await this.prisma.$transaction(
            dto.link_ids.map((id, index) =>
                this.prisma.creatorLink.updateMany({
                    where: { id, userId },
                    data: { sortOrder: index },
                }),
            ),
        );

        return this.getLinks(userId);
    }

    // ==================== SPONSORED PRODUCTS ====================

    /**
     * Scrape Open Graph metadata from a URL (server-side, avoids CORS).
     * Returns whatever we can find — callers must handle empty fields gracefully.
     */
    async fetchProductMeta(url: string): Promise<{
        title: string | null;
        description: string | null;
        image: string | null;
        site_name: string | null;
    }> {
        try {
            const https = require('https');
            const http = require('http');
            const { URL } = require('url');

            const parsedUrl = new URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;

            const html = await new Promise<string>((resolve, reject) => {
                const req = client.get(
                    url,
                    {
                        headers: {
                            'User-Agent':
                                'Mozilla/5.0 (compatible; AntiAIBot/1.0; +https://antiai.me)',
                            Accept: 'text/html,application/xhtml+xml',
                            'Accept-Language': 'en-US,en;q=0.9',
                        },
                        timeout: 8000,
                    },
                    (res: any) => {
                        // Follow one redirect
                        if (
                            res.statusCode >= 301 &&
                            res.statusCode <= 302 &&
                            res.headers.location
                        ) {
                            const redirectClient =
                                res.headers.location.startsWith('https') ? https : http;
                            redirectClient
                                .get(
                                    res.headers.location,
                                    { headers: req.getHeaders() },
                                    (r2: any) => {
                                        let body = '';
                                        r2.on('data', (c: any) => { body += c; });
                                        r2.on('end', () => resolve(body));
                                    },
                                )
                                .on('error', reject);
                            return;
                        }
                        if (res.statusCode !== 200) {
                            reject(new Error(`HTTP ${res.statusCode}`));
                            return;
                        }
                        let body = '';
                        res.on('data', (chunk: any) => {
                            body += chunk;
                            // Stop reading after first 100KB — we only need the <head>
                            if (body.length > 100_000) {
                                res.destroy();
                                resolve(body);
                            }
                        });
                        res.on('end', () => resolve(body));
                    },
                );
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timed out'));
                });
            });

            const extractMeta = (property: string): string | null => {
                const match =
                    html.match(
                        new RegExp(
                            `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
                            'i',
                        ),
                    ) ||
                    html.match(
                        new RegExp(
                            `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
                            'i',
                        ),
                    );
                return match ? match[1].trim() : null;
            };

            // Fallback: try <title> tag if og:title is missing
            const titleFallback =
                html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;

            return {
                title: extractMeta('og:title') || titleFallback,
                description: extractMeta('og:description'),
                image: extractMeta('og:image'),
                site_name: extractMeta('og:site_name'),
            };
        } catch {
            // Scraping failed (bot protection, timeout, etc.) — return empty, let user fill manually
            return { title: null, description: null, image: null, site_name: null };
        }
    }

    /**
     * Add a sponsored product to the creator's profile.
     * Enforces tier-based caps: Free=5, Pro=20, Elite=200.
     */
    async addSponsoredProduct(
        userId: string,
        product: {
            url: string;
            title: string;
            description?: string;
            image?: string;
            site_name?: string;
        },
    ) {
        const profile = await this.prisma.creatorProfile.findUnique({
            where: { userId },
            include: { user: { include: { subscription: { select: { plan: true } } } } },
        });


        if (!profile) throw new NotFoundException('Profile not found');

        const plan: string = profile.user?.subscription?.plan || 'free';
        const { PRODUCT_LIMITS } = require('@antiai/shared');
        const cap = PRODUCT_LIMITS[plan] ?? 1;
        const nextPlan: Record<string, string> = { free: 'Pro', pro: 'Elite' };

        const appearance = (profile.appearance as any) || {};
        const current: any[] = appearance.sponsored_products || [];

        if (current.length >= cap) {
            const next = nextPlan[plan];
            const message = next
                ? `You've reached the ${cap}-product limit on your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. Upgrade to ${next} to add more.`
                : `You've reached the maximum ${cap} products allowed.`;
            throw new BadRequestException({ message, upgrade_required: true, current_plan: plan });
        }

        const { randomUUID } = require('crypto');
        const newProduct = {
            id: randomUUID(),
            url: product.url,
            title: product.title,
            description: product.description || null,
            image: product.image || null,
            site_name: product.site_name || null,
            added_at: new Date().toISOString(),
            is_active: true,
        };

        const updated = await this.prisma.creatorProfile.update({
            where: { userId },
            data: {
                appearance: {
                    ...appearance,
                    sponsored_products: [...current, newProduct],
                } as any,
            },
        });

        return { product: newProduct, total: current.length + 1, cap };
    }

    /**
     * Edit a sponsored product by its ID.
     */
    async editSponsoredProduct(
        userId: string,
        productId: string,
        updates: {
            url?: string;
            title?: string;
            description?: string;
            image?: string;
            site_name?: string;
            is_active?: boolean;
        },
    ) {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Profile not found');

        const appearance = (profile.appearance as any) || {};
        const current: any[] = appearance.sponsored_products || [];
        const index = current.findIndex((p: any) => p.id === productId);

        if (index === -1) {
            throw new NotFoundException('Product not found');
        }

        // Merge updates
        current[index] = {
            ...current[index],
            ...updates,
        };

        await this.prisma.creatorProfile.update({
            where: { userId },
            data: {
                appearance: { ...appearance, sponsored_products: current } as any,
            },
        });

        return { product: current[index] };
    }

    /**
     * Delete a sponsored product by its ID.
     */
    async deleteSponsoredProduct(userId: string, productId: string) {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });

        if (!profile) throw new NotFoundException('Profile not found');

        const appearance = (profile.appearance as any) || {};
        const current: any[] = appearance.sponsored_products || [];
        const filtered = current.filter((p: any) => p.id !== productId);

        if (filtered.length === current.length) {
            throw new NotFoundException('Product not found');
        }

        await this.prisma.creatorProfile.update({
            where: { userId },
            data: {
                appearance: { ...appearance, sponsored_products: filtered } as any,
            },
        });

        return { deleted: true };
    }

    // ==================== HANDLE VALIDATION ====================

    async checkHandleAvailability(handle: string) {
        const normalized = handle.toLowerCase().trim();

        if (!this.isValidHandleFormat(normalized)) {
            return { available: false, reason: 'invalid_format' };
        }

        if (RESERVED_HANDLES.includes(normalized)) {
            return { available: false, reason: 'reserved' };
        }

        const existing = await this.prisma.creatorProfile.findUnique({
            where: { handle: normalized },
        });

        return {
            available: !existing,
            reason: existing ? 'taken' : null,
        };
    }

    private async validateHandle(handle: string) {
        const normalized = handle.toLowerCase().trim();

        if (!this.isValidHandleFormat(normalized)) {
            throw new BadRequestException(
                'Handle must be 3-30 characters, alphanumeric with underscores only',
            );
        }

        if (RESERVED_HANDLES.includes(normalized)) {
            throw new BadRequestException('This handle is reserved');
        }

        const existing = await this.prisma.creatorProfile.findUnique({
            where: { handle: normalized },
        });

        if (existing) {
            throw new ConflictException('Handle already taken');
        }
    }

    private isValidHandleFormat(handle: string): boolean {
        return /^[a-z0-9_]{3,30}$/.test(handle);
    }

    // ==================== HELPERS ====================

    private inferIcon(url: string): string {
        const domain = url.toLowerCase();
        if (domain.includes('twitter.com')) return 'twitter';
        if (domain.includes('x.com')) return 'x';
        if (domain.includes('instagram.com')) return 'instagram';
        if (domain.includes('tiktok.com')) return 'tiktok';
        if (domain.includes('linkedin.com')) return 'linkedin';
        if (domain.includes('youtube.com')) return 'youtube';
        if (domain.includes('facebook.com')) return 'facebook';
        if (domain.includes('github.com')) return 'github';
        if (domain.includes('discord.com') || domain.includes('discord.gg')) return 'discord';
        if (domain.includes('twitch.tv')) return 'twitch';
        if (domain.includes('patreon.com')) return 'patreon';
        if (domain.includes('substack.com')) return 'newsletter';
        return 'website';
    }

    private formatProfile(profile: any, verifiedVideos: any[] = []) {
        return {
            id: profile.id,
            plan: profile.user?.subscription?.plan || 'free',
            handle: profile.handle,
            display_name: profile.displayName,
            bio: profile.bio,
            avatar_url: profile.avatarUrl,
            banner_url: profile.bannerUrl,
            appearance: profile.appearance,
            featured_video_id: profile.featuredVideoId,
            featured_video: profile.featuredVideo
                ? {
                    id: profile.featuredVideo.id,
                    youtube_video_id: profile.featuredVideo.youtubeVideoId,
                    title: profile.featuredVideo.title,
                    thumbnail_url: profile.featuredVideo.thumbnailUrl,
                    has_active_proof: profile.featuredVideo.proofs?.length > 0,
                }
                : null,
            verified_videos: verifiedVideos.map(v => ({
                id: v.id,
                youtube_video_id: v.youtubeVideoId,
                title: v.title,
                thumbnail_url: v.thumbnailUrl,
                proof_id: v.proofs?.[0]?.id,
                published_at: v.publishedAt,
            })),
            is_public: profile.isPublic,
            public_url: `https://antiai.me/${profile.handle}`,
            created_at: profile.createdAt.toISOString(),
            verification_token: this.generateVerificationToken(profile),
        };
    }

    private generateVerificationToken(profile: any): string {
        // Create a deterministic hash based on stable profile identity and modification time
        // In a real scenario, this would use a secret key from environment variables
        const secret = process.env.JWT_SECRET || 'antiai-verification-secret';
        const data = `${profile.id}:${profile.handle}:${profile.updatedAt?.toISOString() || profile.createdAt.toISOString()}`;

        // Use Node's crypto module (available in NestJS/Node env)
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }

    private formatLink(link: any) {
        return {
            id: link.id,
            label: link.label,
            url: link.url,
            icon: link.icon,
            custom_image_url: link.customImageUrl,
            sort_order: link.sortOrder,
            is_active: link.isActive,
        };
    }
}
