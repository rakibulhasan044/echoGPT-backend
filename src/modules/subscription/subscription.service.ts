import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription' && session.subscription) {
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        
        if (userId) {
          // Fetch the stripe subscription to get price details and period end
          const stripeSubscription: any = await this.stripe.subscriptions.retrieve(subscriptionId);
          const priceId = stripeSubscription.items.data[0].price.id;
          
          // Lookup which of our Plans matches this price ID
          const plan = await this.prisma.plan.findFirst({
            where: { stripePriceId: priceId }
          });
          
          if (plan) {
                        const updatedSub = await this.prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                planId: plan.id,
                planName: plan.name,
                status: 'ACTIVE',
                requestLimit: plan.requestLimit,
                requestsUsed: 0,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              },
              update: {
                planId: plan.id,
                planName: plan.name,
                status: 'ACTIVE',
                requestLimit: plan.requestLimit,
                requestsUsed: 0, // Reset usage on upgrade/renewal
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                canceledAt: null,
              }
            });

            // Log the successful payment
            await this.prisma.payment.create({
              data: {
                amount: session.amount_total ? session.amount_total / 100 : 0,
                transactionId: session.payment_intent as string || session.id,
                stripeEventId: event.id,
                status: 'PAID',
                userId,
                subscriptionId: updatedSub.id,
                paymentGatewayData: JSON.parse(JSON.stringify(session))
              }
            });

          }
        }
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice: any = event.data.object;
      if (invoice.subscription) {
        const subscriptionId = invoice.subscription as string;
        
        // Find our local subscription record
        const sub = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (sub) {
          // Fetch the latest period end from Stripe
          const stripeSubscription: any = await this.stripe.subscriptions.retrieve(subscriptionId);
          
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: {
              requestsUsed: 0, // Reset for the new month!
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              status: 'ACTIVE'
            }
          });

          // Log the recurring payment receipt
          await this.prisma.payment.create({
            data: {
              amount: invoice.amount_paid / 100,
              transactionId: invoice.payment_intent as string || invoice.id,
              stripeEventId: event.id,
              status: 'PAID',
              userId: sub.userId,
              subscriptionId: sub.id,
              paymentGatewayData: JSON.parse(JSON.stringify(invoice))
            }
          });
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      await this.prisma.subscription.updateMany({
        where: { stripeSubscriptionId: stripeSubscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        }
      });
    }

    return { received: true };
  }

  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY is missing from environment variables.');
    }
    this.stripe = new Stripe(secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-01-27.acacia' as any, // Bypass strict type check for API version
    });
  }


  private getBaseUrl(): string {
    const backendDomain = this.configService.get<string>('app.backendDomain') || 'http://localhost';
    const port = this.configService.get<number>('app.port') || 6001;
    
    if (backendDomain.includes('localhost') && !backendDomain.includes(`:${port}`)) {
      return `${backendDomain}:${port}`;
    }
    return backendDomain;
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        requestLimit: true,
        benefits: true,
        // We do NOT return stripePriceId to the frontend for security
      }
    });
  }

  async getSubscriptionStatus(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) {
      // If they somehow don't have a row, return a default free status
      return {
        planName: 'FREE',
        status: 'ACTIVE',
        requestLimit: 3,
        requestsUsed: 0,
        remainingRequests: 3,
        currentPeriodEnd: null,
      };
    }

    return {
      planName: sub.planName,
      status: sub.status,
      requestLimit: sub.requestLimit,
      requestsUsed: sub.requestsUsed,
      remainingRequests: Math.max(0, sub.requestLimit - sub.requestsUsed),
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  async createCheckoutSession(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.stripePriceId || !plan.isActive) {
      throw new BadRequestException('Invalid or inactive plan selected.');
    }

    // Check if the user already has an active subscription
    const existingSub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existingSub && existingSub.status === 'ACTIVE') {
      throw new ConflictException('You already have an active subscription. Please use the Customer Portal to manage or upgrade your plan.');
    }

    let customerId = user.stripeCustomerId;

    // 1. Create a Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.fullName || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // 2. Create the Checkout Session
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${this.getBaseUrl()}/api/v1/subscription/success`,
        cancel_url: `${this.getBaseUrl()}/api/v1/subscription/canceled`,
        metadata: { userId: user.id },
      });

      return { url: session.url };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create checkout session: ' + error.message);
    }
  }

  async createCustomerPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new BadRequestException('You do not have an active billing account yet.');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${this.getBaseUrl()}/api/v1/subscription/success`,
      });

      return { url: session.url };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create portal session: ' + error.message);
    }
  }
  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub || !sub.stripeSubscriptionId) {
      throw new BadRequestException('You do not have an active subscription to cancel.');
    }

    if (sub.status === 'CANCELED') {
      throw new BadRequestException('Your subscription is already canceled.');
    }

    try {
      // Instantly cancel the subscription in Stripe
      await this.stripe.subscriptions.cancel(sub.stripeSubscriptionId);

      // Update our database immediately
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        }
      });

      return { success: true };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to cancel subscription: ' + error.message);
    }
  }
}
