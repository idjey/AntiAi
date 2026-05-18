import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsageResetService {
    constructor(private readonly prisma: PrismaService) {}

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async resetMonthlyUsage() {
        const result = await this.prisma.subscription.updateMany({
            data: {
                videosThisMonth: 0,
                usagePeriodStart: new Date(),
            },
        });
        console.log(`[UsageResetService] Monthly video counts reset for ${result.count} subscriptions.`);
    }
}
