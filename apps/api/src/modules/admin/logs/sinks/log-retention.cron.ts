import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class LogRetentionCronService {
    private readonly logger = new Logger(LogRetentionCronService.name);

    constructor(private readonly prisma: PrismaService) {}

    // Run every day at midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleLogRetention() {
        this.logger.log('Running daily log retention cleanup job...');
        
        try {
            // Delete logs older than 15 days
            const retentionDays = 15;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            const result = await this.prisma.httpLog.deleteMany({
                where: {
                    timestamp: {
                        lt: cutoffDate,
                    },
                },
            });

            this.logger.log(`Log retention cleanup completed. Deleted ${result.count} old HTTP logs.`);
        } catch (error) {
            this.logger.error('Failed to execute log retention cleanup', error);
        }
    }
}
