import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import Stripe from 'stripe';

@Injectable()
export class AdminService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  // ========================
  // PLAN MANAGEMENT
  // ========================
  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`A plan with the name ${dto.name} already exists.`);
    }

    let stripePriceId: string | null = null;

    // If the plan has a price > 0, automatically create the Product and Price in Stripe!
    if (dto.price > 0) {
      try {
        const product = await this.stripe.products.create({
          name: dto.name,
          description: `EchoGPT ${dto.name} Plan`,
        });

        const price = await this.stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(dto.price * 100), // Stripe uses cents
          currency: 'usd',
          recurring: { interval: 'month' },
        });

        stripePriceId = price.id;
      } catch (error: any) {
        throw new InternalServerErrorException('Failed to create Stripe product/price: ' + error.message);
      }
    }

    return this.prisma.plan.create({
      data: {
        ...dto,
        stripePriceId
      }
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found.');

    let newStripePriceId = plan.stripePriceId;

    // If the price changed, we must create a NEW price in Stripe (Stripe prices are immutable)
    if (dto.price !== undefined && dto.price !== plan.price && dto.price > 0) {
      try {
        // Find the product ID from the old price, or create a new product
        let productId: string;
        if (plan.stripePriceId) {
          const oldPrice = await this.stripe.prices.retrieve(plan.stripePriceId);
          productId = typeof oldPrice.product === 'string' ? oldPrice.product : oldPrice.product.id;
        } else {
          const product = await this.stripe.products.create({ name: plan.name });
          productId = product.id;
        }

        const price = await this.stripe.prices.create({
          product: productId,
          unit_amount: Math.round(dto.price * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
        });

        newStripePriceId = price.id;
      } catch (error: any) {
        throw new InternalServerErrorException('Failed to update Stripe price: ' + error.message);
      }
    }

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...dto,
        stripePriceId: newStripePriceId
      }
    });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found.');

    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getAllPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } });
  }

  // ========================
  // SUBSCRIPTION MANAGEMENT
  // ========================
  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        user: {
          select: { id: true, email: true, fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
