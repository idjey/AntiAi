import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutDto } from './dto';
import { PLAN_LIMITS } from '@antiai/shared';

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
                status: 'active',
                current_period_end: null,
                videos_used: 0,
                videos_limit: PLAN_LIMITS.free,
            };
        }

        return {
            plan: subscription.plan,
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
                    status: 'active',
                    stripeCustomerId: customerId,
                },
            });
        }

        // Get price ID based on plan
        const priceId =
            dto.plan === 'pro'
                ? this.configService.get<string>('STRIPE_PRICE_PRO')
                : this.configService.get<string>('STRIPE_PRICE_ELITE');

        if (!priceId) {
            throw new BadRequestException('Price not configured');
        }

        // Create checkout session
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: dto.success_url,
            cancel_url: dto.cancel_url,
            metadata: { userId, plan: dto.plan },
        });

        return { checkout_url: session.url };
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
        const plan = session.metadata?.plan as 'pro' | 'elite';

        if (!userId || !plan) return;

        await this.prisma.subscription.update({
            where: { userId },
            data: {
                plan,
                status: 'active',
                stripeSubscriptionId: session.subscription as string,
            },
        });
    }

    private async syncSubscription(stripeSubscription: Stripe.Subscription) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { stripeSubscriptionId: stripeSubscription.id },
        });

        if (!subscription) return;

        const statusMap: Record<string, any> = {
            active: 'active',
            past_due: 'past_due',
            canceled: 'canceled',
            unpaid: 'unpaid',
            trialing: 'trialing',
            incomplete: 'incomplete',
            incomplete_expired: 'incomplete_expired',
        };

        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: statusMap[stripeSubscription.status] || 'active',
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
        });
    }
}
