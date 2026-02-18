
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@antiai/database';

@Injectable()
export class AdminLogsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        eventType?: string;
        entityType?: string;
    }) {
        const { skip, take, eventType, entityType } = params;

        const where: Prisma.TransparencyLogWhereInput = {};

        if (eventType) {
            // Prisma 'contains' works, but `computed` and `insensitive` availability depends on DB capability/version.
            // Removing `computed` as it triggered lint error.
            where.eventType = { contains: eventType, mode: 'insensitive' };
        }

        if (entityType) {
            where.entityType = { contains: entityType, mode: 'insensitive' };
        }

        const [logs, total] = await Promise.all([
            this.prisma.transparencyLog.findMany({
                skip,
                take,
                where,
                orderBy: { createdAt: 'desc' } // Ensure 'createdAt' field exists in schema
            }),
            this.prisma.transparencyLog.count({ where })
        ]);

        return {
            data: logs,
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
