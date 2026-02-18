
import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@antiai/database';
import { AdminSettingsService } from './admin-settings.service';

@Controller('admin/settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminSettingsController {
    constructor(private readonly adminSettingsService: AdminSettingsService) { }

    @Get()
    async getSettings() {
        return this.adminSettingsService.getSettings();
    }

    @Patch(':key')
    async updateSetting(@Param('key') key: string, @Body('value') value: string) {
        return this.adminSettingsService.updateSetting(key, value);
    }

    @Post('impersonate')
    async impersonate(@Body('userId') userId: string) {
        return this.adminSettingsService.impersonateUser(userId);
    }
}
