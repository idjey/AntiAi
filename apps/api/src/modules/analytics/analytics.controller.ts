import { Controller, Get, Post, Body, UseGuards, Query, Req, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@antiai/database';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Post('track')
    async track(@Body() body: { creatorId: string; type: 'view' | 'click'; entityId?: string }, @Req() req: any) {
        // Public endpoint, no auth required
        // Extract IP from request
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referer = req.headers['referer'];

        return this.analyticsService.trackEvent({
            creatorId: body.creatorId,
            type: body.type,
            entityId: body.entityId,
            ip,
            userAgent,
            referer,
        });
    }

    @Get('dashboard')
    @UseGuards(AuthGuard('jwt'))
    async getDashboard(@CurrentUser() user: any, @Query('days') days: string) {
        // Check Plan
        // Assuming user.subscription is populated by the strategy or we need to fetch it
        // For now, let's assume we can access it via user object or fetch it.
        // Actually, CurrentUser might just be the User record. 
        // We should probably check the subscription plan here.

        // TODO: distinct plan check if not in User object
        // flexible for now 
        if (user.role !== 'admin' && (!user.subscription || (user.subscription.plan !== 'pro' && user.subscription.plan !== 'elite'))) {
            throw new ForbiddenException(`Analytics is available for Pro and Elite plans only. Current plan: ${user.subscription?.plan}`);
        }

        return this.analyticsService.getStatsByUserId(user.id, parseInt(days) || 30);
    }
}
