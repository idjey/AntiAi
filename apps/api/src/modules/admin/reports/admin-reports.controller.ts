
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole, ReportStatus } from '@antiai/database';
import { AdminReportsService } from './admin-reports.service';

@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminReportsController {
    constructor(private readonly adminReportsService: AdminReportsService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 20;

        let reportStatus: ReportStatus | undefined;
        if (status && Object.values(ReportStatus).includes(status as any)) {
            reportStatus = status as ReportStatus;
        }

        return this.adminReportsService.findAll({
            skip: skipNum,
            take: takeNum,
            status: reportStatus,
            search
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.adminReportsService.findOne(id);
    }

    @Post(':id/resolve')
    async resolve(
        @Param('id') id: string,
        @Body('action') action: 'dismiss' | 'revoke_proof' | 'suspend_user' | 'close',
        @Body('reason') reason: string,
        @Request() req: any
    ) {
        return this.adminReportsService.resolve(id, action, req.user.id, reason);
    }
}
