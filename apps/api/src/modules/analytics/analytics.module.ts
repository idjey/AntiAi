import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsCronService } from './analytics.cron.service';

@Module({
    imports: [PrismaModule],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsCronService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
