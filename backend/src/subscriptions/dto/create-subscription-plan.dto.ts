import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionPlanType {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Subscription plan type',
    enum: SubscriptionPlanType,
    example: SubscriptionPlanType.STANDARD,
  })
  @IsEnum(SubscriptionPlanType, { message: 'Invalid plan type' })
  plan: SubscriptionPlanType;

  @ApiProperty({ description: 'Plan name in Arabic', example: 'الخطة القياسية' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  planNameAr: string;

  @ApiProperty({ description: 'Plan name in English', example: 'Standard Plan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  planNameEn: string;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle, { message: 'Invalid billing cycle' })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Plan price in OMR', example: 19.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: 'Sale price (discounted)', example: 14.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Plan features list',
    example: ['Up to 100 products', 'Basic analytics', 'Email support'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Product listing limit', example: 100 })
  @IsNumber()
  @IsOptional()
  @Min(-1)
  @Type(() => Number)
  productLimit?: number;

  @ApiPropertyOptional({ description: 'Storage limit in MB', example: 5120 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  storageLimit?: number;

  @ApiPropertyOptional({ description: 'Commission rate percentage', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Is plan active', default: true })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Plan description', example: 'Best for small businesses' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Plan tier level (for ordering)', example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  tier?: number;
}
