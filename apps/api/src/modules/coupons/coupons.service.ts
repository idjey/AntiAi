import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import Stripe from 'stripe';
import * as crypto from 'crypto';

@Injectable()
export class CouponsService {
    private readonly logger = new Logger(CouponsService.name);
    private stripe: Stripe | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (stripeKey) {
            this.stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any });
        }
    }

    // ─── Admin CRUD ───

    async createCoupon(data: {
        code: string;
        description?: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        maxRedemptions?: number;
        expiresAt?: Date;
    }) {
        // Validate
        if (data.discountType === 'percentage' && (data.discountValue < 1 || data.discountValue > 100)) {
            throw new BadRequestException('Percentage must be between 1 and 100');
        }
        if (data.discountType === 'fixed' && data.discountValue <= 0) {
            throw new BadRequestException('Fixed amount must be greater than 0');
        }

        const existing = await this.prisma.coupon.findUnique({ where: { code: data.code.toUpperCase() } });
        if (existing) {
            throw new BadRequestException('Coupon code already exists');
        }

        // Create Stripe coupon + promo code
        let stripeCouponId: string | null = null;
        if (this.stripe) {
            try {
                const stripeCoupon = await this.stripe.coupons.create({
                    ...(data.discountType === 'percentage'
                        ? { percent_off: data.discountValue }
                        : { amount_off: Math.round(data.discountValue * 100), currency: 'usd' }),
                    duration: 'once',
                    max_redemptions: data.maxRedemptions || undefined,
                    redeem_by: data.expiresAt ? Math.floor(data.expiresAt.getTime() / 1000) : undefined,
                });

                // Create promo code so users can enter the code at checkout
                await this.stripe.promotionCodes.create({
                    coupon: stripeCoupon.id,
                    code: data.code.toUpperCase(),
                    max_redemptions: data.maxRedemptions || undefined,
                    expires_at: data.expiresAt ? Math.floor(data.expiresAt.getTime() / 1000) : undefined,
                });

                stripeCouponId = stripeCoupon.id;
            } catch (err) {
                this.logger.warn(`Stripe coupon sync failed: ${err.message}`);
            }
        }

        return this.prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                description: data.description,
                discountType: data.discountType,
                discountValue: data.discountValue,
                maxRedemptions: data.maxRedemptions || null,
                expiresAt: data.expiresAt || null,
                stripeCouponId,
            },
        });
    }

    async updateCoupon(id: string, data: {
        description?: string;
        discountValue?: number;
        discountType?: string;
        maxRedemptions?: number | null;
        expiresAt?: Date | null;
        isActive?: boolean;
    }) {
        const coupon = await this.prisma.coupon.findUnique({ where: { id } });
        if (!coupon) throw new BadRequestException('Coupon not found');

        return this.prisma.coupon.update({
            where: { id },
            data: {
                ...(data.description !== undefined && { description: data.description }),
                ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
                ...(data.discountType !== undefined && { discountType: data.discountType }),
                ...(data.maxRedemptions !== undefined && { maxRedemptions: data.maxRedemptions }),
                ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    }

    async deleteCoupon(id: string) {
        return this.prisma.coupon.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async findAll(params?: { skip?: number; take?: number; activeOnly?: boolean }) {
        const { skip = 0, take = 50, activeOnly = false } = params || {};

        const where = activeOnly ? {
            isActive: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ],
        } : {};

        const [coupons, total] = await Promise.all([
            this.prisma.coupon.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { redemptions: true } } },
            }),
            this.prisma.coupon.count({ where }),
        ]);

        return { data: coupons, meta: { total, skip, take } };
    }

    // ─── Public Validation ───

    async validateCoupon(code: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) throw new BadRequestException('Invalid coupon code');
        if (!coupon.isActive) throw new BadRequestException('This coupon is no longer active');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('This coupon has expired');
        if (coupon.maxRedemptions && coupon.currentUses >= coupon.maxRedemptions) {
            throw new BadRequestException('This coupon has reached its maximum uses');
        }

        return {
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            description: coupon.description,
        };
    }

    async redeemCoupon(code: string, userId?: string, email?: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) throw new BadRequestException('Invalid coupon code');
        if (!coupon.isActive) throw new BadRequestException('This coupon is no longer active');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon expired');
        if (coupon.maxRedemptions && coupon.currentUses >= coupon.maxRedemptions) {
            throw new BadRequestException('Coupon max uses reached');
        }

        // One-per-user guard
        if (userId) {
            const existing = await this.prisma.couponRedemption.findFirst({
                where: { couponId: coupon.id, userId },
            });
            if (existing) throw new BadRequestException('You have already used this coupon');
        }

        await this.prisma.$transaction([
            this.prisma.couponRedemption.create({
                data: { couponId: coupon.id, userId, email },
            }),
            this.prisma.coupon.update({
                where: { id: coupon.id },
                data: { currentUses: { increment: 1 } },
            }),
        ]);

        return coupon;
    }

    // ─── Welcome Coupon (Auto on Signup) ───

    async generateWelcomeCoupon(userId: string, userEmail: string) {
        try {
            const shortId = crypto.randomBytes(4).toString('hex').toUpperCase();
            const code = `WELCOME-${shortId}`;

            const coupon = await this.createCoupon({
                code,
                description: 'Welcome discount — 25% off your first Pro or Elite upgrade',
                discountType: 'percentage',
                discountValue: 25,
                maxRedemptions: 1,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });

            // Record the redemption link to the user
            await this.prisma.couponRedemption.create({
                data: {
                    couponId: coupon.id,
                    userId,
                    email: userEmail,
                },
            });

            // Send email
            await this.emailService.sendCouponEmail(userEmail, code, 25, 'percentage');

            return coupon;
        } catch (err) {
            this.logger.error(`Failed to generate welcome coupon: ${err.message}`);
            // Don't block signup if coupon generation fails
        }
    }

    // ─── Visitor Lead Capture ───

    async captureLeadAndGenerateCoupon(email: string) {
        if (!email || !email.includes('@')) {
            throw new BadRequestException('Valid email required');
        }

        // Check if this email already has a lead coupon
        const existing = await this.prisma.couponRedemption.findFirst({
            where: { email: email.toLowerCase(), userId: null },
            include: { coupon: true },
        });

        if (existing) {
            return {
                code: existing.coupon.code,
                discountType: existing.coupon.discountType,
                discountValue: existing.coupon.discountValue,
                alreadyExists: true,
            };
        }

        const shortId = crypto.randomBytes(4).toString('hex').toUpperCase();
        const code = `SAVE25-${shortId}`;

        const coupon = await this.createCoupon({
            code,
            description: 'Exclusive visitor discount — 25% off Pro or Elite',
            discountType: 'percentage',
            discountValue: 25,
            maxRedemptions: 1,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        });

        await this.prisma.couponRedemption.create({
            data: {
                couponId: coupon.id,
                email: email.toLowerCase(),
            },
        });

        // Send email
        await this.emailService.sendCouponEmail(email.toLowerCase(), code, 25, 'percentage');

        return {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            alreadyExists: false,
        };
    }

    // ─── Bulk Send to Free Users ───

    async sendCouponToFreeUsers(couponId: string) {
        const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
        if (!coupon) throw new BadRequestException('Coupon not found');
        if (!coupon.isActive) throw new BadRequestException('Coupon is not active');

        // Find all free-plan users
        const freeUsers = await this.prisma.user.findMany({
            where: {
                subscription: { plan: 'free' },
                isEmailVerified: true,
                isSuspended: false,
            },
            select: { id: true, email: true },
        });

        let sent = 0;
        for (const user of freeUsers) {
            try {
                await this.emailService.sendPromotionalCoupon(
                    user.email,
                    coupon.code,
                    coupon.discountValue,
                    coupon.discountType,
                    coupon.expiresAt,
                );
                sent++;
            } catch (err) {
                this.logger.warn(`Failed to send coupon to ${user.email}: ${err.message}`);
            }
        }

        return { sent, total: freeUsers.length };
    }

    // ─── Get stats for admin ───

    async getStats() {
        const [total, active, totalRedemptions] = await Promise.all([
            this.prisma.coupon.count(),
            this.prisma.coupon.count({
                where: {
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                },
            }),
            this.prisma.couponRedemption.count(),
        ]);

        return { total, active, totalRedemptions };
    }
}
