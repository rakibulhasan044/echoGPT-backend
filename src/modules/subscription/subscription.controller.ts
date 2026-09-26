import { Controller, Get, Post, Body, Req, Headers, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service.js';
import { CurrentUser } from '../../common/decorators/auth.decorator.js';
import { ApiSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { CheckoutUrlResponseDto, SubscriptionStatusResponseDto } from './dto/subscription-responses.dto.js';
import { PlanResponseDto } from './dto/plan-responses.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';

@ApiTags('Subscription & Billing')
@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionController {

  @Public()
  @Get('success')
  @ApiOperation({ summary: 'Stripe redirect URL for successful payments' })
  successPage() {
    return { success: true, message: 'Payment successful! Your account has been upgraded. You can close this window.' };
  }

  @Public()
  @Get('canceled')
  @ApiOperation({ summary: 'Stripe redirect URL for canceled payments' })
  canceledPage() {
    return { success: false, message: 'Payment canceled. You can close this window.' };
  }


  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe Webhook Endpoint (Do not call manually)' })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    return this.subscriptionService.handleWebhook(signature, req.rawBody);
  }

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Get('plans')
  @ResponseMessage('Subscription plans retrieved successfully')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiSuccessResponse(PlanResponseDto, 'Subscription plans retrieved successfully')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }



  @Get('status')
  @ResponseMessage('Subscription status retrieved successfully')
  @ApiOperation({ summary: 'Get current subscription status and usage' })
  @ApiSuccessResponse(SubscriptionStatusResponseDto, 'Subscription status retrieved successfully')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getSubscriptionStatus(userId);
  }

  @Post('checkout')
  @ResponseMessage('Checkout session created successfully')
  @ApiOperation({ summary: 'Create Stripe Checkout session for upgrading' })
  @ApiSuccessResponse(CheckoutUrlResponseDto, 'Checkout session created successfully')
  async createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto
  ) {
    return this.subscriptionService.createCheckoutSession(userId, dto.planId);
  }

  @Post('portal')
  @ResponseMessage('Customer portal session created successfully')
  @ApiOperation({ summary: 'Create Stripe Customer Portal session to manage billing' })
  @ApiSuccessResponse(CheckoutUrlResponseDto, 'Customer portal session created successfully')
  async createPortal(@CurrentUser('id') userId: string) {
    return this.subscriptionService.createCustomerPortalSession(userId);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @ResponseMessage('Subscription canceled successfully')
  @ApiOperation({ summary: 'Cancel active subscription immediately' })
  async cancelSubscription(@CurrentUser('id') userId: string) {
    await this.subscriptionService.cancelSubscription(userId);
    return null;
  }

}
