
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma } from '@antiai/database';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async findAllUsers(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<any> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                subscription: true,
                profile: true,
                _count: {
                    select: {
                        channels: true,
                    }
                }
            },
        });
    }

    async countUsers(where?: Prisma.UserWhereInput): Promise<number> {
        return this.prisma.user.count({ where });
    }

    async getDashboardStats(): Promise<any> {
        const totalUsers = await this.prisma.user.count();
        const totalCreators = await this.prisma.channel.count();
        const totalVideos = await this.prisma.video.count();

        return {
            totalUsers,
            totalCreators,
            totalVideos
        };
    }

    async suspendUser(userId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        return this.prisma.user.update({
            where: { id: userId },
            data: { isSuspended: !user.isSuspended }
        });
    }

    async updateUserPlan(userId: string, plan: 'free' | 'pro' | 'elite'): Promise<any> {
        return this.prisma.subscription.upsert({
            where: { userId },
            create: {
                userId,
                plan,
                status: 'active'
            },
            update: {
                plan
            }
        });
    }

    async resetUserLimits(userId: string): Promise<any> {
        return this.prisma.subscription.update({
            where: { userId },
            data: { videosThisMonth: 0 }
        });
    }

    async impersonateUser(userId: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        return user;
    }

    async featureProfile(profileId: string, isFeatured: boolean): Promise<any> {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { id: profileId } });
        if (!profile) throw new Error('Profile not found');

        return this.prisma.creatorProfile.update({
            where: { id: profileId },
            data: { isFeatured }
        });
    }

    async getPlatformOverview(days = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [totalViews, totalClicks, activeCreators] = await Promise.all([
            this.prisma.analyticsEvent.count({
                where: { type: 'view', createdAt: { gte: startDate } }
            }),
            this.prisma.analyticsEvent.count({
                where: { type: 'click', createdAt: { gte: startDate } }
            }),
            this.prisma.user.count({
                where: { role: 'creator', isSuspended: false }
            })
        ]);

        const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

        return {
            totalViews,
            totalClicks,
            ctr: parseFloat(ctr.toFixed(2)),
            activeCreators
        };
    }

    async getDeviceMarketShare(days = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.prisma.analyticsEvent.findMany({
            where: {
                type: 'view',
                createdAt: { gte: startDate }
            },
            select: { device: true, os: true, browser: true }
        });

        const devicesMap = new Map<string, number>();
        const osMap = new Map<string, number>();
        const browserMap = new Map<string, number>();

        events.forEach(e => {
            if (e.device) devicesMap.set(e.device, (devicesMap.get(e.device) || 0) + 1);
            if (e.os) osMap.set(e.os, (osMap.get(e.os) || 0) + 1);
            if (e.browser) browserMap.set(e.browser, (browserMap.get(e.browser) || 0) + 1);
        });
        const formatMap = (map: Map<string, number>) => Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return {
            devices: formatMap(devicesMap),
            os: formatMap(osMap),
            browsers: formatMap(browserMap)
        };
    }

    async getTrafficSources(days = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.prisma.analyticsEvent.findMany({
            where: {
                type: 'view',
                createdAt: { gte: startDate },
                referer: { not: null }
            },
            select: { referer: true }
        });

        const refererMap = new Map<string, number>();

        events.forEach(e => {
            if (e.referer) {
                // Try to extract hostname to group by domains
                let hostname = e.referer;
                try {
                    if (e.referer.startsWith('http')) {
                        const url = new URL(e.referer);
                        hostname = url.hostname.replace('www.', '');
                    }
                } catch (err) {
                    // Invalid URL, just use string
                }
                refererMap.set(hostname, (refererMap.get(hostname) || 0) + 1);
            }
        });

        const topSources = Array.from(refererMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return topSources;
    }

    async getHeatmapData(days = 30): Promise<{ id: string, value: number }[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const events = await this.prisma.analyticsEvent.findMany({
            where: {
                createdAt: { gte: startDate },
                country: { not: null }
            },
            select: { country: true }
        });

        const countryMap = new Map<string, number>();
        events.forEach(e => {
            if (e.country) {
                // Ensure it's a 2-character ISO code for react-simple-maps compatibility
                const countryCode = e.country.trim().toUpperCase();
                countryMap.set(countryCode, (countryMap.get(countryCode) || 0) + 1);
            }
        });

        return Array.from(countryMap.entries())
            .map(([id, value]) => ({ id, value }))
            .sort((a, b) => b.value - a.value);
    }

    async getTopCreators(days = 30, skip = 0, take = 10): Promise<{ data: any[], hasMore: boolean }> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const topCreatorsData = await this.prisma.analyticsEvent.groupBy({
            by: ['creatorId'],
            where: {
                type: 'view',
                createdAt: { gte: startDate }
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            skip,
            take: take + 1
        });

        const hasMore = topCreatorsData.length > take;
        const actualData = hasMore ? topCreatorsData.slice(0, take) : topCreatorsData;

        const creatorIds = actualData.map(c => c.creatorId);
        const profiles = await this.prisma.creatorProfile.findMany({
            where: { id: { in: creatorIds } },
            include: { user: true }
        });

        const profileMap = new Map(profiles.map(p => [p.id, p]));

        const finalData = actualData.map(c => {
            const profile = profileMap.get(c.creatorId);
            return {
                creatorId: c.creatorId,
                views: c._count.id,
                handle: profile?.handle || profile?.user?.email || 'Unknown',
                avatar: profile?.avatarUrl || null
            };
        });

        return { data: finalData, hasMore };
    }

    async getRecentEvents(skip = 0, take = 50): Promise<{ data: any[], hasMore: boolean }> {
        const events = await this.prisma.analyticsEvent.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: take + 1,
            include: {
                creator: {
                    include: { user: true }
                }
            }
        });

        const hasMore = events.length > take;
        const rawData = hasMore ? events.slice(0, take) : events;

        const data = rawData.map(e => ({
            ...e,
            handle: e.creator?.handle || e.creator?.user?.email || 'Unknown'
        }));

        return { data, hasMore };
    }
}
