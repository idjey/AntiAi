import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalyticsGateway } from './analytics.gateway';

@Module({
    imports: [PrismaModule],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsGateway],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
