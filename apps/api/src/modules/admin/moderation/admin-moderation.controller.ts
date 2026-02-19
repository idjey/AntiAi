
import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { AdminModerationService } from './admin-moderation.service';
import { Roles } from '../../../common/decorators/roles.decorator'; // Adjust import path
import { UserRole } from '@antiai/database';
// import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'; // Adjust if needed
// import { RolesGuard } from '../../../common/guards/roles.guard'; // Adjust if needed

@Controller('admin/moderation')
// @UseGuards(JwtAuthGuard, RolesGuard) // Assuming global guard or uncomment
@Roles(UserRole.admin)
export class AdminModerationController {
    constructor(private readonly moderationService: AdminModerationService) { }

    @Get('queue')
    async getQueue(
        @Query('status') status?: string,
        @Query('skip') skip?: number,
        @Query('take') take?: number,
    ) {
        return this.moderationService.getQueue({ status, skip: Number(skip) || 0, take: Number(take) || 20 });
    }

    @Post(':id/approve')
    async approve(@Param('id') id: string, @Body('adminId') adminId: string) {
        // In a real app, adminId comes from the request user object
        return this.moderationService.approve(id, adminId);
    }

    @Post(':id/reject')
    async reject(@Param('id') id: string, @Body() body: { adminId: string, reason: string }) {
        return this.moderationService.reject(id, body.adminId, body.reason);
    }
}
