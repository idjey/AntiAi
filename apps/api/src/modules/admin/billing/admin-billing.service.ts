
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, SubscriptionStatus, PlanTier } from '@antiai/database';

@Injectable()
export class AdminBillingService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        status?: SubscriptionStatus;
        plan?: PlanTier;
        search?: string;
    }) {
        const { skip, take, status, plan, search } = params;

        const where: Prisma.SubscriptionWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (plan) {
            where.plan = plan;
        }

        if (search) {
            where.user = {
                email: { contains: search, mode: 'insensitive' }
            };
        }

        const [subscriptions, total] = await Promise.all([
            this.prisma.subscription.findMany({
                skip,
                take,
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true, role: true }
                    }
                }
            }),
            this.prisma.subscription.count({ where })
        ]);

        return {
            data: subscriptions,
            meta: {
                total,
                skip,
                take,
                page: Math.floor((skip || 0) / (take || 10)) + 1,
                last_page: Math.ceil(total / (take || 10))
            }
        };
    }
}
