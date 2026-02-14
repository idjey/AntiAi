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
        });

        if (!existing) {
            throw new NotFoundException('Profile not found');
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
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            },
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
                isActive: dto.is_active,
            },
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
        if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
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
        };
    }

    private formatLink(link: any) {
        return {
            id: link.id,
            label: link.label,
            url: link.url,
            icon: link.icon,
            sort_order: link.sortOrder,
            is_active: link.isActive,
        };
    }
}
