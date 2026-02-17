
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

    // Helper to get total counts for dashboard cards eventually
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
}
