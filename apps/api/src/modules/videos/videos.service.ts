import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelsService } from '../channels/channels.service';
import { ImportVideoDto } from './dto';
import { PLAN_LIMITS } from '@antiai/shared';

@Injectable()
export class VideosService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly channelsService: ChannelsService,
    ) { }

    async listUserVideos(userId: string, channelId?: string) {
        // Get user's channels
        const channels = await this.prisma.channel.findMany({
            where: { userId, verificationStatus: 'verified' },
            select: { id: true },
        });

        const channelIds = channels.map((c) => c.id);

        if (channelIds.length === 0) {
            return { items: [] };
        }

        const where: any = { channelId: { in: channelIds } };
        if (channelId && channelIds.includes(channelId)) {
            where.channelId = channelId;
        }

        const videos = await this.prisma.video.findMany({
            where,
            include: {
                proofs: {
                    where: { status: 'active' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            items: videos.map((v) => ({
                id: v.id,
                channel_id: v.channelId,
                youtube_video_id: v.youtubeVideoId,
                title: v.title,
                video_url: v.videoUrl,
                thumbnail_url: v.thumbnailUrl,
                published_at: v.publishedAt?.toISOString() || null,
                has_active_proof: v.proofs.length > 0,
                proof_expires_at: v.proofs[0]?.expiresAt?.toISOString() || null,
            })),
        };
    }

    async importVideo(userId: string, dto: ImportVideoDto) {
        // Extract video ID from URL
        const videoId = this.extractYouTubeVideoId(dto.video_url);
        if (!videoId) {
            throw new BadRequestException('Invalid YouTube URL');
        }

        // Get verified channel
        const channel = await this.channelsService.getVerifiedChannel(userId, dto.channel_id);
        if (!channel) {
            throw new ForbiddenException('No verified channel found');
        }

        // Check usage limits
        await this.checkUsageLimits(userId);

        // Check if video already exists
        const existing = await this.prisma.video.findUnique({
            where: { youtubeVideoId: videoId },
        });

        if (existing) {
            if (existing.channelId === channel.id) {
                // Return existing video so frontend can proceed to proof generation
                return {
                    id: existing.id,
                    channel_id: existing.channelId,
                    youtube_video_id: existing.youtubeVideoId,
                    title: existing.title,
                    video_url: existing.videoUrl,
                    published_at: existing.publishedAt?.toISOString() || null,
                };
            }
            throw new ForbiddenException('Video belongs to a different channel');
        }

        // TODO: Fetch video metadata from YouTube API
        // For MVP, use placeholder data
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        // Create video
        const video = await this.prisma.video.create({
            data: {
                channelId: channel.id,
                youtubeVideoId: videoId,
                title: dto.title || `Video ${videoId}`,
                videoUrl,
                thumbnailUrl,
            },
        });

        // Increment usage counter
        await this.incrementUsage(userId);

        return {
            id: video.id,
            channel_id: video.channelId,
            youtube_video_id: video.youtubeVideoId,
            title: video.title,
            video_url: video.videoUrl,
            published_at: video.publishedAt?.toISOString() || null,
        };
    }

    async getVideoWithChannel(videoId: string, userId: string) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: { channel: true },
        });

        if (!video) return null;
        if (video.channel.userId !== userId) return null;
        if (video.channel.verificationStatus !== 'verified') return null;

        return video;
    }

    async deleteVideo(userId: string, videoId: string) {
        const video = await this.prisma.video.findUnique({
            where: { id: videoId },
            include: { channel: true },
        });

        if (!video) {
            throw new BadRequestException('Video not found');
        }

        if (video.channel.userId !== userId) {
            throw new ForbiddenException('You do not own this video');
        }

        await this.prisma.video.delete({
            where: { id: videoId },
        });

        return { success: true };
    }

    private extractYouTubeVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        // Check if it's just the video ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        return null;
    }

    private async checkUsageLimits(userId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            throw new ForbiddenException('No subscription found');
        }

        const limit = PLAN_LIMITS[subscription.plan];
        if (subscription.videosThisMonth >= limit) {
            throw new ForbiddenException(
                `You've reached your monthly limit of ${limit} videos. Please upgrade your plan.`,
            );
        }
    }

    private async incrementUsage(userId: string) {
        await this.prisma.subscription.update({
            where: { userId },
            data: { videosThisMonth: { increment: 1 } },
        });
    }
}
