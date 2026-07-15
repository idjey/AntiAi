import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
    constructor(private prisma: PrismaService) {}

    async createApiKey(userId: string, name: string) {
        const existingKey = await this.prisma.apiKey.findFirst({
            where: { userId, name }
        });

        if (existingKey) {
            throw new BadRequestException('An API key with this name already exists');
        }

        const rawKey = 'aa_live_' + crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKey = await this.prisma.apiKey.create({
            data: {
                userId,
                name,
                keyHash,
            }
        });

        return {
            id: apiKey.id,
            name: apiKey.name,
            createdAt: apiKey.createdAt,
            rawKey, // IMPORTANT: only sent once upon creation
        };
    }

    async getApiKeys(userId: string) {
        return this.prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, createdAt: true, lastUsed: true }
        });
    }

    async revokeApiKey(userId: string, id: string) {
        const key = await this.prisma.apiKey.findFirst({
            where: { id, userId }
        });
        if (!key) throw new NotFoundException('API Key not found');

        await this.prisma.apiKey.delete({ where: { id } });
        return { success: true };
    }

    async getUsage(userId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { userId }
        });

        const plan = (subscription?.plan || 'free') as 'free' | 'pro' | 'business' | 'elite' | 'enterprise';
        const apiCallsThisMonth = subscription?.apiCallsThisMonth || 0;
        
        let apiCallsPerMonth = 0;
        switch (plan) {
            case 'business':
                apiCallsPerMonth = 10000;
                break;
            case 'elite':
            case 'enterprise':
                apiCallsPerMonth = -1; // Unlimited
                break;
            default:
                apiCallsPerMonth = 0;
        }

        return {
            plan,
            apiCallsThisMonth,
            apiCallsPerMonth
        };
    }
}
