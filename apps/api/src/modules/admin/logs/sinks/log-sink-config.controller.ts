import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { LogSinkConfigService } from './log-sink-config.service';

@Controller('admin/logs/sinks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class LogSinkConfigController {
    constructor(private readonly service: LogSinkConfigService) {}

    @Get()
    async findAll() {
        const data = await this.service.findAll();
        return { data };
    }

    @Post()
    async create(@Body() body: any) {
        const data = await this.service.create(body);
        return { data, message: 'Sink created successfully' };
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        const data = await this.service.update(id, body);
        return { data, message: 'Sink updated successfully' };
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.service.delete(id);
        return { message: 'Sink deleted successfully' };
    }

    @Post(':id/test')
    async testConnection(@Param('id') id: string) {
        const result = await this.service.testConnection(id);
        return { data: result };
    }

    @Post('test-new')
    async testNewConnection(@Body() body: any) {
        // Test connection before saving
        const result = await this.service.testConnection('new', body);
        return { data: result };
    }

    @Post(':id/reset-errors')
    async resetErrors(@Param('id') id: string) {
        const data = await this.service.resetErrors(id);
        return { data, message: 'Errors reset successfully' };
    }
}
