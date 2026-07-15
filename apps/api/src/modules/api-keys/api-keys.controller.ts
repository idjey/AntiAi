import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) {}

    @Post()
    async createKey(@CurrentUser() user: any, @Body() body: { name: string }) {
        return this.apiKeysService.createApiKey(user.id, body.name);
    }

    @Get()
    async getKeys(@CurrentUser() user: any) {
        return this.apiKeysService.getApiKeys(user.id);
    }

    @Get('usage')
    async getUsage(@CurrentUser() user: any) {
        return this.apiKeysService.getUsage(user.id);
    }

    @Delete(':id')
    async revokeKey(@CurrentUser() user: any, @Param('id') id: string) {
        return this.apiKeysService.revokeApiKey(user.id, id);
    }
}
