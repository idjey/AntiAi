import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutDto } from './dto';
import { PLAN_LIMITS, getPlanLimits } from '@antiai/shared';

@Injectable()
export class BillingService {
    private stripe: Stripe | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (secretKey) {
            this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
        }
    }

    async getStatus(userId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            return {
                plan: 'free',
                interval: 'month',
                status: 'active',
                current_period_end: null,
                videos_used: 0,
                videos_limit: PLAN_LIMITS.free,
            };
        }

        return {
            plan: subscription.plan,
            interval: subscription.interval,
            status: subscription.status,
            current_period_end: subscription.currentPeriodEnd?.toISOString() || null,
            videos_used: subscription.videosThisMonth,
            videos_limit: PLAN_LIMITS[subscription.plan],
        };
    }

    async createCheckout(userId: string, dto: CheckoutDto) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe not configured');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Get or create Stripe customer
        let subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        let customerId = subscription?.stripeCustomerId;

        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email,
                metadata: { userId },
            });
            customerId = customer.id;

            // Update subscription with customer ID
            await this.prisma.subscription.upsert({
                where: { userId },
                update: { stripeCustomerId: customerId },
                create: {
                    userId,
                    plan: 'free',
                    interval: 'month',
                    status: 'active',
                    stripeCustomerId: customerId,
                },
            });
        }

        // Get price ID based on plan and interval
        const isYearly = dto.interval === 'year';
        let priceId: string | undefined;

        if (dto.plan === 'pro') {
            priceId = isYearly
                ? this.configService.get<string>('STRIPE_PRICE_PRO_YEAR')
                : this.configService.get<string>('STRIPE_PRICE_PRO_MONTH');
        } else if (dto.plan === 'business') {
            priceId = isYearly
                ? this.configService.get<string>('STRIPE_PRICE_BUSINESS_ANNUAL')
                : this.configService.get<string>('STRIPE_PRICE_BUSINESS_MONTHLY');
        } else {
            priceId = isYearly
                ? this.configService.get<string>('STRIPE_PRICE_ELITE_YEAR')
                : this.configService.get<string>('STRIPE_PRICE_ELITE_MONTH');
        }

        if (!priceId) {
            throw new BadRequestException('Price not configured');
        }

        // Create checkout session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: dto.success_url,
            cancel_url: dto.cancel_url,
            metadata: {
                userId,
                plan: dto.plan,
                interval: dto.interval
            },
        };

        // Apply coupon if provided
        if (dto.couponCode) {
            const coupon = await this.prisma.coupon.findUnique({
                where: { code: dto.couponCode.toUpperCase() },
            });

            if (coupon && coupon.isActive && coupon.stripeCouponId) {
                const isExpired = coupon.expiresAt && coupon.expiresAt < new Date();
                const isMaxedOut = coupon.maxRedemptions && coupon.currentUses >= coupon.maxRedemptions;

                if (!isExpired && !isMaxedOut) {
                    sessionParams.discounts = [{ coupon: coupon.stripeCouponId }];

                    // Record redemption
                    await this.prisma.$transaction([
                        this.prisma.couponRedemption.create({
                            data: { couponId: coupon.id, userId },
                        }),
                        this.prisma.coupon.update({
                            where: { id: coupon.id },
                            data: { currentUses: { increment: 1 } },
                        }),
                    ]);
                }
            }
        }

        const session = await this.stripe.checkout.sessions.create(sessionParams);

        return { checkout_url: session.url };
    }

    async createPortalSession(userId: string, returnUrl: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe not configured');
        }

        const subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription?.stripeCustomerId) {
            throw new BadRequestException('No billing account found');
        }

        const session = await this.stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    async handleWebhook(rawBody: Buffer, signature: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe not configured');
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new BadRequestException('Webhook secret not configured');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err) {
            throw new BadRequestException('Invalid webhook signature');
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await this.handleCheckoutComplete(session);
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await this.syncSubscription(subscription);
                break;
            }
        }

        return { received: true };
    }

    private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'pro' | 'business' | 'elite';
        const interval = session.metadata?.interval as 'month' | 'year' || 'month';

        if (!userId || !plan) {
            console.error('[STRIPE] Missing metadata in checkout session', { userId, plan });
            return;
        }

        console.log(`[STRIPE] Processing checkout completion for user ${userId} -> ${plan} (${interval})`);

        await this.prisma.subscription.update({
            where: { userId },
            data: {
                plan,
                interval,
                status: 'active',
                stripeSubscriptionId: session.subscription as string,
            },
        });
    }

    private async syncSubscription(stripeSubscription: Stripe.Subscription) {
        try {
            const subscription = await this.prisma.subscription.findFirst({
                where: { stripeSubscriptionId: stripeSubscription.id },
            });

            if (!subscription) {
                console.log(`[STRIPE] Subscription ${stripeSubscription.id} not found locally (yet)`);
                return;
            }

            const statusMap: Record<string, any> = {
                active: 'active',
                past_due: 'past_due',
                canceled: 'canceled',
                unpaid: 'unpaid',
                trialing: 'trialing',
                incomplete: 'incomplete',
                incomplete_expired: 'incomplete_expired',
            };

            const mappedStatus = statusMap[stripeSubscription.status] || 'active';

            // Map Stripe price nickname to PlanTier
            const planNickname = stripeSubscription.items.data[0]?.price?.nickname?.toLowerCase() || '';
            const planMap: Record<string, string> = {
                'free': 'free',
                'pro': 'pro',
                'pro monthly': 'pro',
                'pro annual': 'pro',
                'business': 'business',
                'business monthly': 'business',
                'business annual': 'business',
                'elite': 'elite',
                'elite monthly': 'elite',
                'elite annual': 'elite',
            };
            const mappedPlan = planMap[planNickname];

            // Extract interval from the first item's price
            const interval = stripeSubscription.items.data[0]?.price.recurring?.interval || 'month';

            console.log(`[STRIPE] Syncing subscription ${stripeSubscription.id} -> ${mappedStatus} (${interval})`);

            const newPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            const isRenewal = subscription.currentPeriodEnd && newPeriodEnd.getTime() > subscription.currentPeriodEnd.getTime();

            if (isRenewal) {
                console.log(`[STRIPE] Subscription renewed! Resetting usage for user ${subscription.userId}`);
            }

            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    ...(mappedPlan ? { plan: mappedPlan as any } : {}),
                    status: mappedStatus,
                    interval,
                    currentPeriodEnd: newPeriodEnd,
                    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                    ...(isRenewal ? { videosThisMonth: 0 } : {}),
                },
            });
        } catch (error) {
            console.error('[STRIPE] Error syncing subscription:', error);
            throw error;
        }
    }

    async cancelSubscription(userId: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe not configured');
        }

        const subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription || !subscription.stripeSubscriptionId) {
            throw new BadRequestException('No active subscription found');
        }

        try {
            // Cancel at period end
            await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });

            // Update local state immediately (though webhook will confirm)
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: { cancelAtPeriodEnd: true },
            });

            return { message: 'Subscription will be canceled at the end of the billing period.' };
        } catch (error: any) {
            console.error('[STRIPE] Error canceling subscription:', error);
            throw new BadRequestException('Failed to cancel subscription');
        }
    }

    async verifyCheckoutSession(userId: string, sessionId: string) {
        if (!this.stripe) {
            throw new BadRequestException('Stripe not configured');
        }

        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);

            // Ensure the session belongs to the user and payment was successful
            if (session.metadata?.userId !== userId) {
                return { success: false, message: 'Session does not belong to user' };
            }

            if (session.payment_status === 'paid') {
                // Manually trigger the checkout complete logic
                await this.handleCheckoutComplete(session);

                // If a subscription ID is present, sync it manually
                if (session.subscription) {
                    const subscriptionId = typeof session.subscription === 'string'
                        ? session.subscription
                        : session.subscription.id;

                    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
                    await this.syncSubscription(subscription);
                }

                return { success: true };
            }

            return { success: false, status: session.payment_status };
        } catch (error) {
            console.error('[STRIPE] Error verifying checkout session:', error);
            throw new BadRequestException('Failed to verify session');
        }
    }
}
