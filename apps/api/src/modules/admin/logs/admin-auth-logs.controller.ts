import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminAuthLogsService } from './admin-auth-logs.service';

@Controller('admin/logs/auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminAuthLogsController {
    constructor(private readonly adminAuthLogsService: AdminAuthLogsService) { }

    @Get()
    async getAuthLogs(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('action') action?: string,
        @Query('userId') userId?: string,
        @Query('ipAddress') ipAddress?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 50;

        const where: any = {};
        if (status) where.status = status;
        if (action) where.action = action;
        if (userId) where.userId = userId;
        if (ipAddress) where.ipAddress = { contains: ipAddress };

        return this.adminAuthLogsService.findAll({
            skip: skipNum,
            take: takeNum,
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get('stats')
    async getStats() {
        return this.adminAuthLogsService.getStats();
    }
}
