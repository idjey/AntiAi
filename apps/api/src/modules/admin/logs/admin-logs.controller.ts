
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@antiai/database';
import { AdminLogsService } from './admin-logs.service';

@Controller('admin/logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminLogsController {
    constructor(private readonly adminLogsService: AdminLogsService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('eventType') eventType?: string,
        @Query('entityType') entityType?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 50; // Default to larger page size for logs

        return this.adminLogsService.findAll({
            skip: skipNum,
            take: takeNum,
            eventType,
            entityType
        });
    }
}
