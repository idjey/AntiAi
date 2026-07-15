import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPlanLimits } from '@antiai/shared';
import * as crypto from 'crypto';

@Injectable()
export class ChallengesService {
    constructor(private prisma: PrismaService) {}

    async createChallenge(userId: string, videoId: string, channelId: string) {
        // Ensure user owns channel and plan has access
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            include: { user: { include: { subscription: true } } }
        });

        if (!channel || channel.userId !== userId) {
            throw new ForbiddenException('Not authorized to create challenges for this channel.');
        }

        const limits = getPlanLimits(channel.user.subscription?.plan || 'free');
        if (!limits.challengeAccess) {
            throw new ForbiddenException('Your current plan does not support Live Proof challenges.');
        }

        const id = crypto.randomBytes(6).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Valid for 15 mins

        return this.prisma.challenge.create({
            data: {
                id,
                videoId,
                channelId,
                type: 'object',
                objectCode: 'apple', // Placeholder logic for now
                objectLabel: 'an Apple',
                expiresAt,
                status: 'active',
            }
        });
    }

    async verifyChallenge(id: string, attemptData: any) {
        const challenge = await this.prisma.challenge.findUnique({ where: { id } });
        if (!challenge) throw new NotFoundException('Challenge not found');

        // Close challenge
        await this.prisma.challenge.update({
            where: { id },
            data: { status: 'expired' }
        });

        return { success: true, verified: true };
    }
}
