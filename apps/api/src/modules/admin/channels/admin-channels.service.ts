
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, VerificationStatus } from '@antiai/database';

@Injectable()
export class AdminChannelsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.ChannelWhereInput;
        orderBy?: Prisma.ChannelOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;
        const [channels, total] = await Promise.all([
            this.prisma.channel.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    handle: true,
                                    displayName: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            videos: true,
                            proofs: true,
                            reports: true
                        }
                    }
                }
            }),
            this.prisma.channel.count({ where })
        ]);

        return {
            data: channels,
            meta: {
                total,
                skip,
                take,
                page: Math.floor((skip || 0) / (take || 10)) + 1,
                last_page: Math.ceil(total / (take || 10))
            }
        };
    }

    async findOne(id: string) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: true
                    }
                },
                videos: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        videos: true,
                        proofs: true,
                        reports: true,
                        challenges: true
                    }
                }
            }
        });

        if (!channel) throw new NotFoundException('Channel not found');

        return channel;
    }

    async verifyChannel(id: string, notes?: string) {
        return this.prisma.$transaction(async (tx) => {
            const channel = await tx.channel.update({
                where: { id },
                data: {
                    verificationStatus: VerificationStatus.verified,
                    verifiedAt: new Date(),
                    verificationToken: null,
                    tokenExpiresAt: null
                }
            });

            await tx.transparencyLog.create({
                data: {
                    eventType: 'channel_verified',
                    entityType: 'channel',
                    entityId: id,
                    data: {
                        method: 'manual_admin',
                        notes,
                        admin_action: true
                    }
                }
            });

            return channel;
        });
    }

    async revokeChannel(id: string, reason: string) {
        return this.prisma.$transaction(async (tx) => {
            const channel = await tx.channel.update({
                where: { id },
                data: {
                    verificationStatus: VerificationStatus.revoked,
                    revokedAt: new Date(),
                    revokeReason: reason,
                    verifiedAt: null
                }
            });

            await tx.transparencyLog.create({
                data: {
                    eventType: 'channel_revoked',
                    entityType: 'channel',
                    entityId: id,
                    data: {
                        reason,
                        admin_action: true
                    }
                }
            });

            // Also revoke all active proofs for this channel?
            // Optional: strict policy might say yes. For now, let's keep it simple.

            return channel;
        });
    }
}
