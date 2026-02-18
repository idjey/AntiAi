
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, ProofStatus } from '@antiai/database';

@Injectable()
export class AdminVideosService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.VideoWhereInput;
        orderBy?: Prisma.VideoOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;
        const [videos, total] = await Promise.all([
            this.prisma.video.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    channel: {
                        select: {
                            id: true,
                            channelName: true,
                            avatarUrl: true,
                            youtubeChannelId: true
                        }
                    },
                    proofs: {
                        select: {
                            status: true,
                            id: true
                        },
                        where: {
                            status: ProofStatus.active
                        }
                    },
                    _count: {
                        select: {
                            reports: true,
                            proofs: true
                        }
                    }
                }
            }),
            this.prisma.video.count({ where })
        ]);

        return {
            data: videos.map(v => ({
                ...v,
                hasActiveProof: v.proofs.length > 0
            })),
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
        const video = await this.prisma.video.findUnique({
            where: { id },
            include: {
                channel: true,
                proofs: {
                    orderBy: { issuedAt: 'desc' },
                    include: {
                        signingKey: true
                    }
                },
                reports: {
                    orderBy: { createdAt: 'desc' }
                },
                featuredBy: {
                    select: {
                        id: true,
                        handle: true,
                        displayName: true
                    }
                }
            }
        });

        if (!video) throw new NotFoundException('Video not found');

        return video;
    }

    async revokeProofs(id: string, reason: string) {
        return this.prisma.$transaction(async (tx) => {
            // Find all active proofs for this video
            const activeProofs = await tx.proof.findMany({
                where: {
                    videoId: id,
                    status: ProofStatus.active
                }
            });

            if (activeProofs.length === 0) {
                return { count: 0, message: 'No active proofs to revoke' };
            }

            // Update them to revoked
            await tx.proof.updateMany({
                where: {
                    videoId: id,
                    status: ProofStatus.active
                },
                data: {
                    status: ProofStatus.revoked,
                    revokedAt: new Date(),
                    revokeReason: reason
                }
            });

            // Log for each revoked proof
            for (const proof of activeProofs) {
                await tx.transparencyLog.create({
                    data: {
                        eventType: 'proof_revoked',
                        entityType: 'proof',
                        entityId: proof.id,
                        data: {
                            reason,
                            admin_action: true,
                            video_id: id
                        }
                    }
                });
            }

            return { count: activeProofs.length, message: `Revoked ${activeProofs.length} proofs` };
        });
    }
}
