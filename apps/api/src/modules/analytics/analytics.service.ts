import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

export interface TrackEventDto {
    creatorId: string;
    type: 'view' | 'click' | 'dwell';
    entityId?: string; // Link ID or Profile ID
    ip?: string;
    userAgent?: string;
    referer?: string;
    scrollDepth?: number;
    sessionDuration?: number;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async trackEvent(dto: TrackEventDto) {
        try {
            // Parse User Agent
            const parser = new UAParser(dto.userAgent);
            const device = parser.getDevice().type || 'desktop'; // desktop, mobile, tablet
            const os = parser.getOS().name;
            const browser = parser.getBrowser().name;

            // GeoIP Lookup
            let country = null;
            let region = null;
            let city = null;

            if (dto.ip) {
                const geo = geoip.lookup(dto.ip);
                if (geo) {
                    country = geo.country || null;
                    region = geo.region || null;
                    city = geo.city || null;
                }
            }

            // Anonymize IP
            const ipHash = dto.ip ? crypto.createHash('sha256').update(dto.ip).digest('hex').substring(0, 16) : null;

            await this.prisma.analyticsEvent.create({
                data: {
                    creatorId: dto.creatorId,
                    type: dto.type,
                    entityId: dto.entityId,
                    ipHash,
                    country,
                    region,
                    city,
                    device,
                    os,
                    browser,
                    referer: dto.referer,
                    scrollDepth: dto.scrollDepth,
                    sessionDuration: dto.sessionDuration,
                    utmSource: dto.utmSource,
                    utmMedium: dto.utmMedium,
                    utmCampaign: dto.utmCampaign,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to track analytics event: ${error.message}`, error.stack);
            // Don't throw error to avoid blocking the main request
        }
    }

    async getStatsByUserId(userId: string, days = 30) {
        const profile = await this.prisma.creatorProfile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return {
                totalViews: 0,
                totalClicks: 0,
                ctr: 0,
                timeSeries: [],
                topLocations: [],
                devices: [],
                referrers: []
            };
        }

        return this.getStats(profile.id, days);
    }

    private getFlagEmoji(countryCode: string) {
        if (!countryCode) return '';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    }

    async getStats(creatorId: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch raw events
        const events = await this.prisma.analyticsEvent.findMany({
            where: {
                creatorId,
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                type: true,
                createdAt: true,
                country: true,
                region: true,
                city: true,
                device: true,
            },
        });

        const totalViews = events.filter((e: any) => e.type === 'view').length;
        const totalClicks = events.filter((e: any) => e.type === 'click').length;
        const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

        // Time Series Data (Group by Day)
        const timeSeriesMap = new Map<string, { views: number, clicks: number }>();

        // Initialize all days
        for (let i = 0; i <= days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            timeSeriesMap.set(dateStr, { views: 0, clicks: 0 });
        }

        events.forEach((e: any) => {
            const dateStr = e.createdAt.toISOString().split('T')[0];
            if (timeSeriesMap.has(dateStr)) {
                const data = timeSeriesMap.get(dateStr);
                if (data) {
                    if (e.type === 'view') data.views++;
                    else if (e.type === 'click') data.clicks++;
                }
            }
        });

        const timeSeries = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
            date,
            views: data.views,
            clicks: data.clicks,
        }));

        // Geographic Data
        const countriesMap = new Map<string, number>();
        const citiesMap = new Map<string, number>();
        const devicesMap = new Map<string, number>();

        events.forEach((e: any) => {
            if (e.type === 'view') {
                if (e.country) {
                    const countryName = `${e.country} ${this.getFlagEmoji(e.country)}`;
                    countriesMap.set(countryName, (countriesMap.get(countryName) || 0) + 1);
                }
                // Combine City, Region, Country for uniqueness and display
                // Format: Atlanta, GA, US 🇺🇸
                if (e.city && e.country) {
                    const parts = [e.city];
                    if (e.region) parts.push(e.region);
                    parts.push(e.country);

                    const key = `${parts.join(', ')} ${this.getFlagEmoji(e.country)}`;
                    citiesMap.set(key, (citiesMap.get(key) || 0) + 1);
                }
                if (e.device) devicesMap.set(e.device, (devicesMap.get(e.device) || 0) + 1);
            }
        });

        const topCountries = Array.from(countriesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const topCities = Array.from(citiesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const devices = Array.from(devicesMap.entries())
            .map(([name, value]) => ({ name, value }));

        return {
            summary: {
                total_views: totalViews,
                total_clicks: totalClicks,
                ctr: parseFloat(ctr.toFixed(2)),
            },
            time_series: timeSeries,
            top_countries: topCountries,
            top_cities: topCities,
            devices: devices,
        };
    }
}
