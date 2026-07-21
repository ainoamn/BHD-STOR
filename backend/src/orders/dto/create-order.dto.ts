import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsObject,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid product ID format' })
  productId: string;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Variant attributes (color, size, etc.)',
    example: { color: 'red', size: 'XL' },
  })
  @IsObject()
  @IsOptional()
  variantAttributes?: Record<string, string>;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Shipping address ID', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid shipping address ID' })
  shippingAddressId: string;

  @ApiPropertyOptional({ description: 'Billing address ID (defaults to shipping)', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  billingAddressId?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'OMR', example: 'OMR' })
  @IsString()
  @IsOptional()
  currency?: string = 'OMR';

  @ApiPropertyOptional({ description: 'Order notes', example: 'Please deliver after 5 PM' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Coupon code for discount', example: 'SUMMER2024' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  couponCode?: string;
}
