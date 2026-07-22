import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanTier } from '../entities/subscription-plan.entity';

export enum MonetizationMode {
  SUBSCRIPTION = 'subscription',
  PERCENTAGE = 'percentage',
}

export class ChooseMonetizationDto {
  @ApiProperty({
    description: 'Seller monetization mode',
    enum: MonetizationMode,
    example: MonetizationMode.SUBSCRIPTION,
  })
  @IsEnum(MonetizationMode)
  mode: MonetizationMode;

  @ApiPropertyOptional({
    description: 'Required when mode=subscription',
    enum: PlanTier,
    example: PlanTier.BASIC,
  })
  @IsOptional()
  @IsEnum(PlanTier)
  planTier?: PlanTier;

  @ApiPropertyOptional({
    description: 'Commission percent when mode=percentage (e.g. 10 = 10%). Default 10.',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  commissionPercent?: number;
}
