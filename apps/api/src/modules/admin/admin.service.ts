
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
}
