
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    @Get('users')
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('search') search?: string,
    ): Promise<any> {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 20;

        const where = search ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { profile: { handle: { contains: search, mode: 'insensitive' as const } } }
            ]
        } : {};

        const [users, total] = await Promise.all([
            this.adminService.findAllUsers({
                skip: skipNum,
                take: takeNum,
                where,
                orderBy: { createdAt: 'desc' }
            }),
            this.adminService.countUsers(where)
        ]);

        return {
            data: users,
            meta: {
                total,
                skip: skipNum,
                take: takeNum,
                page: Math.floor(skipNum / takeNum) + 1,
                last_page: Math.ceil(total / takeNum)
            }
        };
    }

    @Get('stats')
    @Get('stats')
    async getStats(): Promise<any> {
        return this.adminService.getDashboardStats();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    @Post('users/:id/suspend')
    async suspendUser(@Param('id') id: string) {
        return this.adminService.suspendUser(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    @Post('users/:id/plan')
    async updateUserPlan(@Param('id') id: string, @Body('plan') plan: 'free' | 'pro' | 'elite') {
        return this.adminService.updateUserPlan(id, plan);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    @Post('users/:id/reset-limits')
    async resetLimits(@Param('id') id: string) {
        return this.adminService.resetUserLimits(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    @Post('users/:id/impersonate')
    async impersonateUser(@Param('id') id: string) {
        // In a real implementation, this would generate a token.
        // For now, we'll just return the user to confirm permissions.
        return this.adminService.impersonateUser(id);
    }
}
