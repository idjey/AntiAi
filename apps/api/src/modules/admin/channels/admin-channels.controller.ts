
import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole, VerificationStatus } from '@antiai/database';
import { AdminChannelsService } from './admin-channels.service';

@Controller('admin/channels')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminChannelsController {
    constructor(private readonly adminChannelsService: AdminChannelsService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('search') search?: string,
        @Query('status') status?: VerificationStatus,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 20;

        const where: any = {};

        if (search) {
            where.OR = [
                { channelName: { contains: search, mode: 'insensitive' } },
                { channelHandle: { contains: search, mode: 'insensitive' } },
                { youtubeChannelId: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.verificationStatus = status;
        }

        return this.adminChannelsService.findAll({
            skip: skipNum,
            take: takeNum,
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.adminChannelsService.findOne(id);
    }

    @Post(':id/verify')
    async verify(
        @Param('id') id: string,
        @Body('notes') notes?: string
    ) {
        return this.adminChannelsService.verifyChannel(id, notes);
    }

    @Post(':id/revoke')
    async revoke(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        return this.adminChannelsService.revokeChannel(id, reason);
    }
}
