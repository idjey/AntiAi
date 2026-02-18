
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, ProofStatus } from '@antiai/database';

@Injectable()
export class AdminProofsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        status?: ProofStatus;
        search?: string;
        orderBy?: Prisma.ProofOrderByWithRelationInput;
    }) {
        const { skip, take, status, search, orderBy } = params;

        const where: Prisma.ProofWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { kid: { contains: search, mode: 'insensitive' } },
                { video: { title: { contains: search, mode: 'insensitive' } } },
                { channel: { channelName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [proofs, total] = await Promise.all([
            this.prisma.proof.findMany({
                skip,
                take,
                where,
                orderBy: orderBy || { issuedAt: 'desc' },
                include: {
                    video: {
                        select: {
                            id: true,
                            title: true,
                            thumbnailUrl: true
                        }
                    },
                    channel: {
                        select: {
                            id: true,
                            channelName: true,
                            avatarUrl: true
                        }
                    },
                    signingKey: {
                        select: {
                            id: true
                        }
                    }
                }
            }),
            this.prisma.proof.count({ where })
        ]);

        return {
            data: proofs,
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
        const proof = await this.prisma.proof.findUnique({
            where: { id },
            include: {
                video: true,
                channel: true,
                signingKey: true,
                reports: true,
                supersededBy: true,
                supersedesProof: true
            }
        });

        if (!proof) throw new NotFoundException('Proof not found');

        return proof;
    }

    async revoke(id: string, reason: string) {
        return this.prisma.$transaction(async (tx) => {
            const proof = await tx.proof.findUnique({ where: { id } });
            if (!proof) throw new NotFoundException('Proof not found');

            // If already revoked, return it
            if (proof.status === 'revoked') {
                return proof;
            }

            const updated = await tx.proof.update({
                where: { id },
                data: {
                    status: ProofStatus.revoked,
                    revokedAt: new Date(),
                    revokeReason: reason
                }
            });

            await tx.transparencyLog.create({
                data: {
                    eventType: 'proof_revoked',
                    entityType: 'proof',
                    entityId: proof.id,
                    data: {
                        reason,
                        admin_action: true,
                        previous_status: proof.status
                    }
                }
            });

            return updated;
        });
    }
}
