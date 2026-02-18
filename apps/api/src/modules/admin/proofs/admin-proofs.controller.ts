
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole, ProofStatus } from '@antiai/database';
import { AdminProofsService } from './admin-proofs.service';

@Controller('admin/proofs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminProofsController {
    constructor(private readonly adminProofsService: AdminProofsService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 20;

        let proofStatus: ProofStatus | undefined;
        if (status && Object.values(ProofStatus).includes(status as any)) {
            proofStatus = status as ProofStatus;
        }

        return this.adminProofsService.findAll({
            skip: skipNum,
            take: takeNum,
            status: proofStatus,
            search
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.adminProofsService.findOne(id);
    }

    @Post(':id/revoke')
    async revoke(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        return this.adminProofsService.revoke(id, reason);
    }
}
