
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@antiai/database';

@Injectable()
export class AdminHttpLogsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        method?: string;
        statusCode?: number;
        statusGroup?: string;
        path?: string;
        ipAddress?: string;
        userId?: string;
        minDuration?: number;
        startDate?: string;
        endDate?: string;
    }) {
        const { skip, take, method, statusCode, statusGroup, path, ipAddress, userId, minDuration, startDate, endDate } = params;

        const where: Prisma.HttpLogWhereInput = {};

        if (method) {
            where.method = { equals: method, mode: 'insensitive' };
        }

        if (statusCode !== undefined) {
            where.statusCode = statusCode;
        }

        if (statusGroup) {
            const base = parseInt(statusGroup.charAt(0), 10) * 100;
            where.statusCode = { gte: base, lt: base + 100 };
        }

        if (path) {
            where.path = { contains: path, mode: 'insensitive' };
        }

        if (ipAddress) {
            where.ipAddress = ipAddress;
        }

        if (userId) {
            where.userId = userId;
        }

        if (minDuration !== undefined) {
            where.durationMs = { gte: minDuration };
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                (where.timestamp as Prisma.DateTimeFilter).gte = new Date(startDate);
            }
            if (endDate) {
                (where.timestamp as Prisma.DateTimeFilter).lte = new Date(endDate);
            }
        }

        const [logs, total] = await Promise.all([
            this.prisma.httpLog.findMany({
                skip,
                take,
                where,
                orderBy: { timestamp: 'desc' },
            }),
            this.prisma.httpLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                skip,
                take,
                page: Math.floor((skip || 0) / (take || 10)) + 1,
                last_page: Math.ceil(total / (take || 10)),
            },
        };
    }

    async getStats() {
        const [stats] = await this.prisma.$queryRaw<
            {
                total_requests_24h: bigint;
                avg_duration_ms_24h: number | null;
                error_count_24h: bigint;
                unique_ips_24h: bigint;
            }[]
        >`
            SELECT
                COUNT(*)::bigint AS total_requests_24h,
                AVG(duration_ms)::float AS avg_duration_ms_24h,
                COUNT(*) FILTER (WHERE status_code >= 400)::bigint AS error_count_24h,
                COUNT(DISTINCT ip_address)::bigint AS unique_ips_24h
            FROM http_logs
            WHERE timestamp > NOW() - INTERVAL '24 hours'
        `;

        const totalRequests24h = Number(stats.total_requests_24h);
        const errorCount24h = Number(stats.error_count_24h);

        return {
            totalRequests24h,
            avgDurationMs24h: stats.avg_duration_ms_24h ? Math.round(stats.avg_duration_ms_24h * 100) / 100 : 0,
            errorRate24h: totalRequests24h > 0 ? Math.round((errorCount24h / totalRequests24h) * 10000) / 100 : 0,
            uniqueIps24h: Number(stats.unique_ips_24h),
        };
    }
}
