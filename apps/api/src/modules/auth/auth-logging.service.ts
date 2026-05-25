import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import * as geoip from 'geoip-lite';

@Injectable()
export class AuthLoggingService {
    constructor(private prisma: PrismaService) { }

    private getIpFromRequest(req: Request): string {
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (typeof xForwardedFor === 'string') {
            return xForwardedFor.split(',')[0].trim();
        }
        return req.socket.remoteAddress || 'unknown';
    }

    private getLocationFromIp(ip: string) {
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') {
            return { country: 'Localhost', city: 'Local' };
        }
        const geo = geoip.lookup(ip);
        if (geo) {
            return {
                country: geo.country,
                city: geo.city,
            };
        }
        return { country: 'Unknown', city: 'Unknown' };
    }

    private getDeviceFromUserAgent(ua: string): string {
        ua = ua.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'mobile';
        }
        if (ua.includes('ipad') || ua.includes('tablet')) {
            return 'tablet';
        }
        if (ua.includes('bot') || ua.includes('spider') || ua.includes('crawler')) {
            return 'bot';
        }
        return 'desktop';
    }

    async logActivity(params: {
        req: Request;
        email: string;
        status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
        failureReason?: string;
        userId?: string;
    }) {
        try {
            const { req, email, status, failureReason, userId } = params;
            const ipAddress = this.getIpFromRequest(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            const { country, city } = this.getLocationFromIp(ipAddress);
            const device = this.getDeviceFromUserAgent(userAgent);

            await this.prisma.authActivityLog.create({
                data: {
                    email,
                    status,
                    failureReason,
                    ipAddress,
                    userAgent,
                    country,
                    city,
                    device,
                    userId,
                },
            });

            // Return the recorded log details for downstream processing
            return { ipAddress, country, city, device, userAgent };
        } catch (error) {
            console.error('Failed to write auth activity log:', error);
            // We do not throw error here, so we don't break the auth flow if logging fails
        }
    }
}
