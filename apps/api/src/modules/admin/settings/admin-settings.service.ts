
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminSettingsService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async getSettings() {
        return this.prisma.systemSetting.findMany();
    }

    async updateSetting(key: string, value: string) {
        const result = await this.prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value, description: 'Created via Admin Panel' }
        });

        // Log to transparency log
        await this.prisma.transparencyLog.create({
            data: {
                eventType: 'system_setting_updated',
                entityType: 'system_setting',
                entityId: key, // Using key as entityId (might need to be careful if entityId is UUID in schema... let's check schema)
                data: {
                    key,
                    value,
                    action: 'update'
                }
            }
        });

        return result;
    }

    async impersonateUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Generate JWT for this user
        // Note: Payload structure must match AuthModule's expectations
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };

        return {
            accessToken: this.jwtService.sign(payload)
        };
    }
}
