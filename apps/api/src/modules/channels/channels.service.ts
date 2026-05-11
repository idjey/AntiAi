import {
    Injectable,
    BadRequestException,
    ConflictException,
    NotFoundException,
    ServiceUnavailableException,
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
                youtube_channel_id: c.platformId,
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
                    { platformId: normalizedId },
                    { platformId: dto.youtube_channel_id }
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
                userId_platform_platformId: {
                    userId,
                    platform: 'youtube',
                platformId: normalizedId,
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
                platformId: normalizedId,
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

        // Check if API key is configured
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new ServiceUnavailableException(
                'YouTube API Key not configured. Please add YOUTUBE_API_KEY to .env or contact admin.'
            );
        }

        // Verify token placement via YouTube API
        try {
            let youtubeChannel;

            // Determine if input is likely a Channel ID (UC...) or Handle
            // Handles usually don't start with UC unless coincidentally, but IDs always do and are 24 chars
            const isLikelyChannelId = channel.platformId.startsWith('UC') && channel.platformId.length === 24;

            // Strategy 1: Try as ID
            if (isLikelyChannelId) {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channel.platformId}&key=${apiKey}`
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.items?.length > 0) {
                        youtubeChannel = data.items[0];
                    }
                }
            }

            // Strategy 2: If no result yet, try as Handle
            if (!youtubeChannel) {
                // Determine handle (add @ if missing)
                const handle = channel.platformId.startsWith('@')
                    ? channel.platformId
                    : `@${channel.platformId}`;

                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.items?.length > 0) {
                        youtubeChannel = data.items[0];
                    }
                } else {
                    // If both failed, capture the last error for debugging
                    const errorText = await response.text();
                    console.error('YouTube API Error:', response.status, errorText);

                    if (response.status === 403) {
                        throw new ServiceUnavailableException('YouTube API Quota Exceeded or Invalid Key');
                    }
                    if (response.status === 400) {
                        throw new BadRequestException('Invalid Request to YouTube API');
                    }
                }
            }

            if (!youtubeChannel) {
                throw new NotFoundException('YouTube channel not found. Please check your Channel ID or Handle.');
            }

            const description = youtubeChannel.snippet?.description || '';

            // Check if token exists in description
            if (!description.includes(channel.verificationToken)) {
                throw new BadRequestException(
                    'Verification token not found in channel description. Please add the token and try again.'
                );
            }

            // If we verified via handle, we should update the DB to use the stable Channel ID properly
            // This prevents future lookup issues if they change their handle
            if (youtubeChannel.id && youtubeChannel.id !== channel.platformId) {
                await this.prisma.channel.update({
                    where: { id: channel.id },
                    data: { platformId: youtubeChannel.id }
                });
                // Update local object for the final update call
                channel.platformId = youtubeChannel.id;
            }

        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ServiceUnavailableException) {
                throw error;
            }
            console.error('YouTube verification error:', error);
            // Include original error message if available
            throw new ServiceUnavailableException(`Failed to verify with YouTube API: ${error.message}`);
        }

        // Mark as verified
        const avatarUrl = youtubeChannel?.snippet?.thumbnails?.high?.url || youtubeChannel?.snippet?.thumbnails?.default?.url || null;
        const channelName = youtubeChannel?.snippet?.title || channel.channelName;
        
        const updatedChannel = await this.prisma.channel.update({
            where: { id: channel.id },
            data: {
                verificationStatus: 'verified',
                verifiedAt: new Date(),
                verificationToken: null, // Clear token after verification
                tokenExpiresAt: null,
                avatarUrl: avatarUrl,
                channelName: channelName
            },
        });

        // Log to transparency log
        await this.prisma.transparencyLog.create({
            data: {
                eventType: 'channel_verified',
                entityType: 'channel',
                entityId: channel.id,
                data: {
                    youtube_channel_id: channel.platformId,
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
            youtube_channel_id: channel.platformId,
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

