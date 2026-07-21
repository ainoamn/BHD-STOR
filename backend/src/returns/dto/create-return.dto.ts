import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDecimal,
  IsArray,
  IsDateString,
  IsObject,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReturnType, ReturnReason, RefundMethod } from '../entities/return-request.entity';
import type { PickupAddress } from '../entities/return-request.entity';

export class CreateReturnDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Product ID to return/exchange' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: ReturnType, description: 'Return or exchange' })
  @IsEnum(ReturnType)
  @IsNotEmpty()
  type: ReturnType;

  @ApiProperty({ enum: ReturnReason, description: 'Reason for return/exchange' })
  @IsEnum(ReturnReason)
  @IsNotEmpty()
  reason: ReturnReason;

  @ApiProperty({ description: 'Detailed description' })
  @IsString()
  @Length(10, 2000)
  description: string;

  @ApiPropertyOptional({ type: [String], description: 'Image URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ enum: RefundMethod, description: 'Preferred refund method' })
  @IsOptional()
  @IsEnum(RefundMethod)
  refundMethod?: RefundMethod;

  @ApiPropertyOptional({ description: 'Exchange product ID (for exchanges)' })
  @IsOptional()
  @IsUUID()
  exchangeProductId?: string;

  @ApiPropertyOptional({ description: 'Exchange variant (for exchanges)' })
  @IsOptional()
  @IsString()
  exchangeVariant?: string;

  @ApiPropertyOptional({ description: 'Pickup address' })
  @IsOptional()
  @IsObject()
  pickupAddress?: PickupAddress;
}
