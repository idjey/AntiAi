
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@antiai/database';
import { AdminVideosService } from './admin-videos.service';

@Controller('admin/videos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminVideosController {
    constructor(private readonly adminVideosService: AdminVideosService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('search') search?: string,
        @Query('hasProof') hasProof?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 20;

        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { youtubeVideoId: { contains: search, mode: 'insensitive' } },
                { channel: { channelName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // Filter by proof status? 
        // Note: Prisma doesn't strictly support filtering by "has at least one related record matching X" easily in the top-level where without some checks
        // But we can verify if we need strict filtering. For now, let's keep it simple.

        return this.adminVideosService.findAll({
            skip: skipNum,
            take: takeNum,
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.adminVideosService.findOne(id);
    }

    @Post(':id/revoke-proofs')
    async revokeProofs(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        return this.adminVideosService.revokeProofs(id, reason);
    }
}
