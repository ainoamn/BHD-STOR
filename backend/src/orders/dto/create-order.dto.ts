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
  MinLength,
  MaxLength,
  ValidateIf,
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

export class InlineShippingAddressDto {
  @ApiProperty({ example: 'Ahmed Al Balushi' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: 'Muscat' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Al Khuwair Street 12' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  street: string;

  @ApiPropertyOptional({ example: 'OM' })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ example: 'Muscat' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  governorate?: string;
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

  @ApiPropertyOptional({
    description: 'Saved shipping address ID (optional if shippingAddress is provided)',
    format: 'uuid',
  })
  @ValidateIf((o) => !o.shippingAddress)
  @IsUUID('4', { message: 'Invalid shipping address ID' })
  @IsOptional()
  shippingAddressId?: string;

  @ApiPropertyOptional({
    description: 'Inline shipping address (used when no saved address ID)',
    type: InlineShippingAddressDto,
  })
  @ValidateIf((o) => !o.shippingAddressId)
  @ValidateNested()
  @Type(() => InlineShippingAddressDto)
  @IsOptional()
  shippingAddress?: InlineShippingAddressDto;

  @ApiPropertyOptional({ description: 'Billing address ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  billingAddressId?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'OMR', example: 'OMR' })
  @IsString()
  @IsOptional()
  currency?: string = 'OMR';

  @ApiPropertyOptional({ description: 'Payment method', example: 'cod' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Shipping method', example: 'standard' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  shippingMethod?: string;

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
