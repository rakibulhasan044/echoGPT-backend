import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../../../generated/prisma/enums.js';

export class CheckoutUrlResponseDto {
  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/cs_test_...' })
  url!: string;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({ example: 'PREMIUM' })
  planName!: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @ApiProperty({ example: 100 })
  requestLimit!: number;

  @ApiProperty({ example: 45 })
  requestsUsed!: number;
  
  @ApiProperty({ example: 55 })
  remainingRequests!: number;

  @ApiProperty({ example: '2026-10-25T12:00:00.000Z', nullable: true })
  currentPeriodEnd!: Date | null;
}
