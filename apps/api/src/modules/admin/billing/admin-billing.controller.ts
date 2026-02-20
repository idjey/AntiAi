
import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole, SubscriptionStatus, PlanTier } from '@antiai/database';
import { AdminBillingService } from './admin-billing.service';

@Controller('admin/billing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminBillingController {
    constructor(private readonly adminBillingService: AdminBillingService) { }

    @Get()
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('plan') plan?: string,
        @Query('search') search?: string,
    ) {
        const skipNum = skip ? parseInt(skip) : 0;
        const takeNum = take ? parseInt(take) : 20;

        let subStatus: SubscriptionStatus | undefined;
        if (status && Object.values(SubscriptionStatus).includes(status as any)) {
            subStatus = status as SubscriptionStatus;
        }

        let subPlan: PlanTier | undefined;
        if (plan && Object.values(PlanTier).includes(plan as any)) {
            subPlan = plan as PlanTier;
        }

        return this.adminBillingService.findAll({
            skip: skipNum,
            take: takeNum,
            status: subStatus,
            plan: subPlan,
            search
        });
    }

    @Post(':id/cancel')
    async cancel(@Param('id') id: string) {
        return this.adminBillingService.cancelSubscription(id);
    }
}
