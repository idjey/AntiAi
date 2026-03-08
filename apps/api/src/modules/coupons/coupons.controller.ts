import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CouponsService } from './coupons.service';

@Controller()
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    // ─── Admin Endpoints ───

    @Post('admin/coupons')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async createCoupon(@Body() body: {
        code: string;
        description?: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        maxRedemptions?: number;
        expiresAt?: string;
    }) {
        return this.couponsService.createCoupon({
            ...body,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        });
    }

    @Get('admin/coupons')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        return this.couponsService.findAll({
            skip: skip ? parseInt(skip) : 0,
            take: take ? parseInt(take) : 50,
            activeOnly: activeOnly === 'true',
        });
    }

    @Get('admin/coupons/stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async getStats() {
        return this.couponsService.getStats();
    }

    @Get('admin/coupons/tracking')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async getTracking() {
        return this.couponsService.getTrackingData();
    }

    @Patch('admin/coupons/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async updateCoupon(
        @Param('id') id: string,
        @Body() body: {
            description?: string;
            discountValue?: number;
            discountType?: string;
            maxRedemptions?: number | null;
            expiresAt?: string | null;
            isActive?: boolean;
        },
    ) {
        return this.couponsService.updateCoupon(id, {
            ...body,
            expiresAt: body.expiresAt === null ? null : body.expiresAt ? new Date(body.expiresAt) : undefined,
        });
    }

    @Delete('admin/coupons/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async deleteCoupon(@Param('id') id: string) {
        return this.couponsService.deleteCoupon(id);
    }

    @Post('admin/coupons/:id/send')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.admin)
    async sendToFreeUsers(@Param('id') id: string) {
        return this.couponsService.sendCouponToFreeUsers(id);
    }

    // ─── Public Endpoints ───

    @Get('coupons/validate/:code')
    async validateCoupon(@Param('code') code: string) {
        return this.couponsService.validateCoupon(code);
    }

    @Post('coupons/lead')
    async captureLead(@Body() body: { email: string }) {
        return this.couponsService.captureLeadAndGenerateCoupon(body.email);
    }
}
