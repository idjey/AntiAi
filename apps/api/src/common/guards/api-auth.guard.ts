import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { getPlanLimits } from '@antiai/shared';

@Injectable()
export class ApiAuthGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['x-api-key'] || request.headers['authorization'];

        if (!authHeader) {
            throw new UnauthorizedException('Missing API Key. Use x-api-key header.');
        }

        let rawKey = authHeader;
        if (rawKey.startsWith('Bearer ')) {
            rawKey = rawKey.split(' ')[1];
        }

        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKey = await this.prisma.apiKey.findUnique({
            where: { keyHash },
            include: {
                user: {
                    include: { subscription: true }
                }
            }
        });

        if (!apiKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        const subscription = apiKey.user.subscription;
        if (!subscription) {
            throw new UnauthorizedException('No active subscription found');
        }

        const limits = getPlanLimits(subscription.plan);

        // Check if API access is allowed at all
        if (limits.apiCallsPerMonth === 0) {
            throw new HttpException({
                statusCode: 402,
                message: 'Your current plan does not include API access.',
                code: 'UPGRADE_REQUIRED'
            }, 402);
        }

        // Hard Cap Check
        if (limits.apiCallsPerMonth !== -1 && subscription.apiCallsThisMonth >= limits.apiCallsPerMonth) {
            throw new HttpException({
                statusCode: 429,
                message: 'API rate limit exceeded for your current billing cycle.',
                code: 'QUOTA_EXCEEDED_UPGRADE_REQUIRED'
            }, 429);
        }

        // Increment usage & Update last used
        await this.prisma.$transaction([
            this.prisma.subscription.update({
                where: { id: subscription.id },
                data: { apiCallsThisMonth: { increment: 1 } }
            }),
            this.prisma.apiKey.update({
                where: { id: apiKey.id },
                data: { lastUsed: new Date() }
            })
        ]);

        request.user = apiKey.user;
        request.apiKey = apiKey;

        return true;
    }
}
