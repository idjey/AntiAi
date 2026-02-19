
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminModerationService {
    constructor(private prisma: PrismaService) { }

    async getQueue(params: { status?: string; skip?: number; take?: number }) {
        const { status, skip, take } = params;
        const where: any = {};
        if (status) where.status = status;
        else where.status = 'PENDING';

        const [items, total] = await Promise.all([
            this.prisma.moderationQueue.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.moderationQueue.count({ where }),
        ]);

        return {
            data: items,
            meta: { total, skip, take },
        };
    }

    async approve(id: string, adminId: string) {
        return this.prisma.moderationQueue.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedAt: new Date(),
                reviewedById: adminId, // Ensure adminId is passed or extracted from context
            },
        });
    }

    async reject(id: string, adminId: string, reason: string) {
        const item = await this.prisma.moderationQueue.findUnique({ where: { id } });
        if (!item) throw new NotFoundException('Item not found');

        const payload = item.payload as any;

        // Revert logic based on targetType
        if (item.targetType === 'profile') {
            // Restore OLD values
            if (payload.old) {
                await this.prisma.creatorProfile.update({
                    where: { id: item.targetId },
                    data: {
                        bio: payload.old.bio,
                        avatarUrl: payload.old.avatarUrl,
                        displayName: payload.old.displayName
                    }
                });
            }
        }

        return this.prisma.moderationQueue.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reason,
                reviewedAt: new Date(),
                reviewedById: adminId,
            },
        });
    }
}
