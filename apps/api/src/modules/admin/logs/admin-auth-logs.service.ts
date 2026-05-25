import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminAuthLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }) {
        const { skip = 0, take = 50, where = {}, orderBy = { createdAt: 'desc' } } = params;

        const [logs, total] = await Promise.all([
            this.prisma.authActivityLog.findMany({
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
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.authActivityLog.count({ where })
        ]);

        return {
            data: logs,
            meta: {
                total,
                skip,
                take,
                page: Math.floor(skip / take) + 1,
                last_page: Math.ceil(total / take)
            }
        };
    }

    async getStats() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalLogs, recentLogs, uniqueUsers, failedAttempts] = await Promise.all([
            this.prisma.authActivityLog.count(),
            this.prisma.authActivityLog.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            this.prisma.authActivityLog.groupBy({
                by: ['userId'],
                _count: { userId: true },
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            this.prisma.authActivityLog.count({
                where: { 
                    status: 'failure',
                    createdAt: { gte: thirtyDaysAgo }
                }
            })
        ]);

        return {
            total_logs: totalLogs,
            recent_logs: recentLogs,
            unique_users_30d: uniqueUsers.length,
            failed_attempts_30d: failedAttempts
        };
    }
}
