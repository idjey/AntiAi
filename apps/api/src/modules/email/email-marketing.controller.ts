import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmailMarketingService } from './email-marketing.service';

@Controller('admin/emails')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class EmailMarketingController {
    constructor(private readonly emailMarketingService: EmailMarketingService) { }

    @Get('campaigns')
    async getCampaigns() {
        return this.emailMarketingService.getCampaigns();
    }

    @Get('campaigns/:id')
    async getCampaign(@Param('id') id: string) {
        return this.emailMarketingService.getCampaign(id);
    }

    @Post('campaigns')
    async createCampaign(@Body() dto: { name: string; subject: string; htmlContent: string; audienceSegment: string; customEmails?: string }) {
        return this.emailMarketingService.createCampaign(dto);
    }

    @Put('campaigns/:id')
    async updateCampaign(@Param('id') id: string, @Body() dto: any) {
        return this.emailMarketingService.updateCampaign(id, dto);
    }

    @Post('campaigns/:id/send')
    async sendCampaign(@Param('id') id: string) {
        return this.emailMarketingService.sendCampaign(id);
    }

    @Post('generate')
    async generateWithAi(@Body() dto: { prompt: string }) {
        return this.emailMarketingService.generateWithAi(dto.prompt);
    }
}
