import { IsUUID, IsString, IsObject, IsOptional, IsNumber, IsBoolean, IsPositive, IsEnum, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ShippingCarrier {
  OMAN_POST = 'oman_post',
  ARAMEX = 'aramex',
  DHL = 'dhl',
  FEDEX = 'fedex',
  UPS = 'ups',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  NEXT_DAY = 'next_day',
  ECONOMY = 'economy',
}

export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ShippingAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string; // ISO 3166-1 alpha-2 code
  phone: string;
  email?: string;
}

export class PackageDimensionsDto implements PackageDimensions {
  @ApiProperty({ example: 30, description: 'Length in specified unit' })
  @IsNumber()
  @IsPositive()
  length: number;

  @ApiProperty({ example: 20, description: 'Width in specified unit' })
  @IsNumber()
  @IsPositive()
  width: number;

  @ApiProperty({ example: 15, description: 'Height in specified unit' })
  @IsNumber()
  @IsPositive()
  height: number;

  @ApiProperty({ example: 'cm', enum: ['cm', 'in'], default: 'cm' })
  @IsString()
  @IsEnum(['cm', 'in'])
  unit: 'cm' | 'in' = 'cm';
}

export class ShippingAddressDto implements ShippingAddress {
  @ApiProperty({ example: 'Ahmed Al Balushi' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'ABC Trading LLC' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'Building 123, Way 456, Block 789' })
  @IsString()
  @MinLength(5)
  street1: string;

  @ApiPropertyOptional({ example: 'Near City Center Mall' })
  @IsOptional()
  @IsString()
  street2?: string;

  @ApiProperty({ example: 'Muscat' })
  @IsString()
  @MinLength(2)
  city: string;

  @ApiPropertyOptional({ example: 'Muscat Governorate' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'OM', minLength: 2, maxLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;

  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateShipmentDto {
  @ApiProperty({
    description: 'Order ID to create shipment for',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID('4')
  orderId: string;

  @ApiProperty({
    description: 'Shipping carrier to use',
    example: 'aramex',
    enum: ShippingCarrier,
  })
  @IsString()
  @IsEnum(ShippingCarrier)
  carrierId: ShippingCarrier;

  @ApiProperty({
    description: 'Shipping method/service type',
    example: 'express',
    enum: ShippingMethod,
  })
  @IsString()
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @ApiProperty({
    description: 'Total weight in kilograms',
    example: 2.5,
    minimum: 0.001,
  })
  @IsNumber()
  @IsPositive()
  weight: number;

  @ApiProperty({
    description: 'Package dimensions',
    type: PackageDimensionsDto,
  })
  @IsObject()
  @ValidateNested()
  dimensions: PackageDimensionsDto;

  @ApiProperty({
    description: 'Sender address',
    type: ShippingAddressDto,
  })
  @IsObject()
  @ValidateNested()
  senderAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Recipient address',
    type: ShippingAddressDto,
  })
  @IsObject()
  @ValidateNested()
  recipientAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    description: 'Insurance amount for the shipment',
    example: 100.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  insuranceAmount?: number;

  @ApiPropertyOptional({
    description: 'Require signature on delivery',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  signatureRequired?: boolean = false;

  @ApiPropertyOptional({
    description: 'Description of goods being shipped',
    example: 'Electronics - Mobile phone accessories',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Number of packages in shipment',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  packageCount?: number = 1;

  @ApiPropertyOptional({
    description: 'Cash on delivery amount (if COD)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @ApiPropertyOptional({
    description: 'Reference numbers for the shipment',
    example: ['REF-001', 'PO-12345'],
  })
  @IsOptional()
  @IsString({ each: true })
  references?: string[];

  @ApiPropertyOptional({
    description: 'Customs value for international shipments',
    example: 50.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  customsValue?: number;

  @ApiPropertyOptional({
    description: 'Contents for customs declaration',
    example: [{ description: 'T-shirts', quantity: 5, value: 25.0, weight: 1.0 }],
  })
  @IsOptional()
  @IsObject()
  customsItems?: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hsCode?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Additional shipping options',
    example: { fragile: true, notifyBeforeDelivery: true },
  })
  @IsOptional()
  @IsObject()
  shippingOptions?: Record<string, any>;
}
