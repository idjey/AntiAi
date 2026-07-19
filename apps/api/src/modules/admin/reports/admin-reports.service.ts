
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, ReportStatus, ProofStatus } from '@antiai/database';

@Injectable()
export class AdminReportsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        status?: ReportStatus;
        search?: string;
    }) {
        const { skip, take, status, search } = params;

        const where: Prisma.ReportWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { reason: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [reports, total] = await Promise.all([
            this.prisma.report.findMany({
                skip,
                take,
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    video: {
                        select: { id: true, title: true, thumbnailUrl: true }
                    },
                    channel: {
                        select: { id: true, channelName: true, avatarUrl: true }
                    },
                    proof: {
                        select: { id: true, status: true, kid: true }
                    }
                }
            }),
            this.prisma.report.count({ where })
        ]);

        return {
            data: reports.map(r => ({
                ...r,
                entityType: r.videoId ? 'video' : r.channelId ? 'channel' : r.proofId ? 'proof' : 'unknown',
                entity: (r as any).video || (r as any).channel || (r as any).proof
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
        const report = await this.prisma.report.findUnique({
            where: { id },
            include: {
                video: true,
                channel: true,
                proof: true,
                
                reviewedBy: {
                    select: { id: true, email: true }
                }
            }
        });

        if (!report) throw new NotFoundException('Report not found');
        return report;
    }

    async resolve(id: string, action: 'dismiss' | 'revoke_proof' | 'suspend_user' | 'close', userId: string, reason?: string) {
        return this.prisma.$transaction(async (tx) => {
            const report = await tx.report.findUnique({
                where: { id },
                include: { proof: true, channel: true, video: { include: { channel: true } } }
            });

            if (!report) throw new NotFoundException('Report not found');

            // Perform Action
            if (action === 'revoke_proof') {
                if (!report.proofId) throw new BadRequestException('Report is not associated with a proof');

                // Revoke proof
                await tx.proof.update({
                    where: { id: report.proofId },
                    data: {
                        status: ProofStatus.revoked,
                        revokedAt: new Date(),
                        revokeReason: reason || 'Revoked via User Report'
                    }
                });

                // Log
                await tx.transparencyLog.create({
                    data: {
                        eventType: 'proof_revoked',
                        entityType: 'proof',
                        entityId: report.proofId,
                        data: { reason, reportId: id, adminId: userId }
                    }
                });
            } else if (action === 'suspend_user') {
                // Determine user ID from channel or video->channel
                const targetChannel = report.channel || report.video?.channel || (report.proofId ? await tx.channel.findFirst({ where: { proofs: { some: { id: report.proofId } } } }) : null);

                if (!targetChannel) throw new BadRequestException('Could not determine related channel/user for suspension');

                await tx.user.update({
                    where: { id: targetChannel.userId },
                    data: { isSuspended: true }
                });

                // Log
                await tx.transparencyLog.create({
                    data: {
                        eventType: 'user_suspended',
                        entityType: 'user',
                        entityId: targetChannel.userId,
                        data: { reason, reportId: id, adminId: userId }
                    }
                });
            }

            // Close Report
            return tx.report.update({
                where: { id },
                data: {
                    status: 'closed', // Using string literal if enum mapping issues, or ReportStatus.closed
                    reviewedAt: new Date(),
                    reviewedById: userId,
                    details: reason ? `${report.details || ''}\n\nResolution: ${reason}` : report.details
                }
            });
        });
    }
}
