import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';
import { SubscriptionPlanType, BillingCycle } from './create-subscription-plan.dto';

export class SubscribeDto {
  @ApiProperty({
    description: 'Subscription plan type',
    enum: SubscriptionPlanType,
    example: SubscriptionPlanType.STANDARD,
  })
  @IsEnum(SubscriptionPlanType, { message: 'Invalid plan type' })
  plan: SubscriptionPlanType;

  @ApiProperty({
    description: 'Billing cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle, { message: 'Invalid billing cycle' })
  billingCycle: BillingCycle;

  @ApiPropertyOptional({
    description: 'Payment method ID',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  paymentMethodId?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Cancellation reason',
    example: 'Switching to another platform',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: 'New plan to upgrade to',
    enum: SubscriptionPlanType,
    example: SubscriptionPlanType.PREMIUM,
  })
  @IsEnum(SubscriptionPlanType, { message: 'Invalid plan type' })
  newPlan: SubscriptionPlanType;

  @ApiPropertyOptional({
    description: 'Payment method ID for upgrade',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  paymentMethodId?: string;
}
