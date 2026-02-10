import {
    Injectable,
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifyStartDto, VerifyConfirmDto } from './dto';

@Injectable()
export class ChannelsService {
    constructor(private readonly prisma: PrismaService) { }

    async listUserChannels(userId: string) {
        const channels = await this.prisma.channel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return {
            items: channels.map((c) => ({
                id: c.id,
                youtube_channel_id: c.youtubeChannelId,
                channel_handle: c.channelHandle,
                channel_name: c.channelName,
                channel_url: c.channelUrl,
                avatar_url: c.avatarUrl,
                verification_status: c.verificationStatus,
                verified_at: c.verifiedAt?.toISOString() || null,
                // Only expose token if pending
                verification_token: c.verificationStatus === 'pending' ? c.verificationToken : null,
            })),
        };
    }

    async startVerification(userId: string, dto: VerifyStartDto) {
        // Normalize input to prevent duplicates (e.g. @handle vs URL)
        const normalizedId = this.normalizeChannelId(dto.youtube_channel_id);

        // Check if channel already exists for this user
        const existing = await this.prisma.channel.findFirst({
            where: {
                userId,
                // Check against both raw ID and potential normalized matches if we stored them differently before
                // But mainly check if we have a record that matches this normalized ID logic
                // Since we store what user gave, we might have duplicates already. 
                // Going forward we should store normalized version or query smarter.
                // For MVP, checking if any channel's youtubeChannelId matches is basic.
                // Better: Check if normalized ID matches normalized stored ID? Too expensive.
                // Let's rely on storing the normalized ID from now on, or using it for search.
                OR: [
                    { youtubeChannelId: normalizedId },
                    { youtubeChannelId: dto.youtube_channel_id }
                ]
            },
        });

        if (existing && existing.verificationStatus === 'verified') {
            throw new ConflictException('Channel already verified');
        }

        // Generate verification token
        const verificationToken = `antiai-verify-${randomBytes(16).toString('hex')}`;
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create or update channel
        const channel = await this.prisma.channel.upsert({
            where: {
                userId_youtubeChannelId: {
                    userId,
                    youtubeChannelId: normalizedId,
                },
            },
            update: {
                verificationMethod: dto.method,
                verificationToken,
                tokenExpiresAt,
                verificationStatus: 'pending',
            },
            create: {
                userId,
                youtubeChannelId: normalizedId,
                channelName: dto.requested_handle || normalizedId,
                channelHandle: dto.requested_handle,
                verificationMethod: dto.method,
                verificationToken,
                tokenExpiresAt,
                verificationStatus: 'pending',
            },
        });

        // Generate instructions based on method
        const instructions = this.getVerificationInstructions(dto.method, verificationToken);

        return {
            channel_id: channel.id,
            method: dto.method,
            token: dto.method === 'oauth' ? null : verificationToken,
            instructions,
            token_expires_at: tokenExpiresAt.toISOString(),
        };
    }

    async confirmVerification(userId: string, dto: VerifyConfirmDto) {
        const channel = await this.prisma.channel.findFirst({
            where: {
                id: dto.channel_id,
                userId,
            },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        if (channel.verificationStatus === 'verified') {
            return this.formatChannel(channel);
        }

        if (!channel.verificationToken || !channel.tokenExpiresAt) {
            throw new BadRequestException('No pending verification');
        }

        if (new Date() > channel.tokenExpiresAt) {
            throw new BadRequestException('Verification token expired');
        }

        // TODO: Actually verify the token placement via YouTube API
        // For MVP, we'll trust the user clicked confirm
        // In production, this would call YouTube Data API to check:
        // - Channel description contains token
        // - Video description/title contains token
        // - Pinned comment contains token

        // For now, mark as verified (you'll need to implement actual verification)
        const updatedChannel = await this.prisma.channel.update({
            where: { id: channel.id },
            data: {
                verificationStatus: 'verified',
                verifiedAt: new Date(),
                verificationToken: null, // Clear token after verification
                tokenExpiresAt: null,
            },
        });

        // Log to transparency log
        await this.prisma.transparencyLog.create({
            data: {
                eventType: 'channel_verified',
                entityType: 'channel',
                entityId: channel.id,
                data: {
                    youtube_channel_id: channel.youtubeChannelId,
                    method: channel.verificationMethod,
                },
            },
        });

        return this.formatChannel(updatedChannel);
    }

    async getVerifiedChannel(userId: string, channelId?: string) {
        const where: any = { userId, verificationStatus: 'verified' };
        if (channelId) where.id = channelId;

        return this.prisma.channel.findFirst({ where });
    }

    async deleteChannel(userId: string, channelId: string) {
        const channel = await this.prisma.channel.findFirst({
            where: {
                id: channelId,
                userId,
            },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        await this.prisma.channel.delete({
            where: { id: channelId },
        });

        return { success: true };
    }

    private formatChannel(channel: any) {
        return {
            id: channel.id,
            youtube_channel_id: channel.youtubeChannelId,
            channel_handle: channel.channelHandle,
            channel_name: channel.channelName,
            channel_url: channel.channelUrl,
            avatar_url: channel.avatarUrl,
            verification_status: channel.verificationStatus,
            verified_at: channel.verifiedAt?.toISOString() || null,
        };
    }

    private getVerificationInstructions(method: string, token: string): string {
        switch (method) {
            case 'oauth':
                return 'Click the button above to connect with Google and verify your channel ownership.';
            case 'about_token':
                return `Add this verification token to your YouTube channel's About section: ${token}`;
            case 'video_token':
                return `Upload a short video with this token in the title or description: ${token}`;
            case 'pinned_comment':
                return `Pin a comment containing this token on any of your videos: ${token}`;
            default:
                return 'Follow the verification instructions.';
        }
    }

    private normalizeChannelId(input: string): string {
        // Remove trailing slashes
        let formatted = input.replace(/\/$/, '');

        // Handle full URLs
        if (formatted.includes('youtube.com/')) {
            const parts = formatted.split('/');
            const lastPart = parts[parts.length - 1];
            // Check if it's a handle URL (@handle) or channel URL (channel/UC...)
            if (lastPart.startsWith('@')) {
                return lastPart.substring(1); // Remove @
            }
            // If it's pure ID or custom URL part
            return lastPart;
        }

        // Handle raw handles with @
        if (formatted.startsWith('@')) {
            return formatted.substring(1);
        }

        return formatted;
    }
}
