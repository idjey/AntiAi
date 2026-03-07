import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsGateway } from './analytics.gateway';

@Injectable()
export class AnalyticsCronService {
    private readonly logger = new Logger(AnalyticsCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: AnalyticsGateway
    ) { }

    // Run every 10 minutes to detect massive traffic anomalies
    @Cron(CronExpression.EVERY_10_MINUTES)
    async detectViralAnomalies() {
        this.logger.log('Running Viral Velocity Detection...');

        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // 1. Find all creators who had ANY traffic in the last 10 minutes
        const recentTraffic = await this.prisma.analyticsEvent.groupBy({
            by: ['creatorId'],
            where: {
                createdAt: {
                    gte: tenMinutesAgo,
                },
                type: 'view' // Only counting active views, not raw clicks
            },
            _count: {
                _all: true
            }
        });

        if (recentTraffic.length === 0) return;

        // 2. For each active creator, calculate their median 10-minute baseline over the last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        for (const traffic of recentTraffic) {
            const currentVelocity = traffic._count._all;

            // Simple Baseline Math: Total Views in 7 days / (10-minute chunks in 7 days)
            // 7 days * 24 hrs * 6 = 1008 ten-minute chunks
            const historicalTraffic = await this.prisma.analyticsEvent.count({
                where: {
                    creatorId: traffic.creatorId,
                    type: 'view',
                    createdAt: {
                        gte: sevenDaysAgo,
                        lt: tenMinutesAgo
                    }
                }
            });

            // If account is BRAND new (no historical traffic), default baseline to 10
            const chunkCount = 1008;
            const baselineVelocity = Math.max(Math.ceil(historicalTraffic / chunkCount), 10);

            // Anomaly Trigger: 300% Spike (Current velocity is 3x higher than average baseline)
            if (currentVelocity >= baselineVelocity * 3) {
                this.logger.warn(`🚀 VIRAL ALERT! Creator ${traffic.creatorId} is spiking! Normal: ${baselineVelocity}/10m | Current: ${currentVelocity}/10m`);

                // Fetch creator handle for beautiful alert messages
                const creator = await this.prisma.creatorProfile.findUnique({
                    where: { id: traffic.creatorId },
                    select: { handle: true }
                });

                if (!creator) continue;

                // Fire System Alert
                const alert = await this.prisma.systemAlert.create({
                    data: {
                        type: 'VIRAL_VELOCITY',
                        severity: 'critical',
                        message: `Viral breakout detected on @${creator.handle}'s profile.`,
                        data: {
                            creatorId: traffic.creatorId,
                            handle: creator.handle,
                            baseline: baselineVelocity,
                            current: currentVelocity
                        }
                    }
                });

                // Instantly broadcast via WebSockets to Admins who have God Mode open
                this.gateway.server.emit('admin_alert', alert);
            }
        }
    }
}
