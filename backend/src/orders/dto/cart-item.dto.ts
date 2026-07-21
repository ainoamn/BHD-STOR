import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid product ID format' })
  productId: string;

  @ApiProperty({ description: 'Quantity', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Variant attributes (color, size, etc.)',
    example: { color: 'blue', size: 'M' },
  })
  @IsObject()
  @IsOptional()
  variantAttributes?: Record<string, string>;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Cart item ID', format: 'uuid' })
  @IsUUID('4')
  itemId: string;

  @ApiProperty({ description: 'New quantity', example: 3, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code', example: 'WELCOME10' })
  @IsUUID('4')
  code: string;
}

export class CartTotalsDto {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
  currency: string;
}
