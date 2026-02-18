
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
        return this.prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value, description: 'Created via Admin Panel' }
        });
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
