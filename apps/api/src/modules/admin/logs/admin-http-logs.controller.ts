
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@antiai/database';
import { AdminHttpLogsService } from './admin-http-logs.service';

@Controller('admin/logs/http')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminHttpLogsController {
    constructor(private readonly adminHttpLogsService: AdminHttpLogsService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('method') method?: string,
        @Query('statusCode') statusCode?: string,
        @Query('statusGroup') statusGroup?: string,
        @Query('path') path?: string,
        @Query('ipAddress') ipAddress?: string,
        @Query('userId') userId?: string,
        @Query('minDuration') minDuration?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 50;

        return this.adminHttpLogsService.findAll({
            skip: skipNum,
            take: takeNum,
            method,
            statusCode: statusCode ? parseInt(statusCode) : undefined,
            statusGroup,
            path,
            ipAddress,
            userId,
            minDuration: minDuration ? parseInt(minDuration) : undefined,
            startDate,
            endDate,
        });
    }

    @Get('stats')
    async getStats() {
        return this.adminHttpLogsService.getStats();
    }
}
