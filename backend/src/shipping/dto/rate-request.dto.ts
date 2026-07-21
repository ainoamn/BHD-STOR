import { IsObject, IsNumber, IsPositive, IsOptional, ValidateNested, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiProperty({ example: 'OM', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'Muscat' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Al Khuwair' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: 23.5859 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 58.4059 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class PackageDimensionsDto {
  @ApiProperty({ example: 30, description: 'Length in cm' })
  @IsNumber()
  @IsPositive()
  length: number;

  @ApiProperty({ example: 20, description: 'Width in cm' })
  @IsNumber()
  @IsPositive()
  width: number;

  @ApiProperty({ example: 15, description: 'Height in cm' })
  @IsNumber()
  @IsPositive()
  height: number;

  @ApiPropertyOptional({ example: 'cm', enum: ['cm', 'in'], default: 'cm' })
  @IsOptional()
  @IsString()
  unit?: string = 'cm';
}

export class RateRequestDto {
  @ApiProperty({
    description: 'Origin address',
    type: LocationDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({
    description: 'Destination address',
    type: LocationDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiProperty({
    description: 'Total weight in kilograms',
    example: 2.5,
    minimum: 0.001,
  })
  @IsNumber()
  @IsPositive()
  weight: number;

  @ApiPropertyOptional({
    description: 'Package dimensions',
    type: PackageDimensionsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PackageDimensionsDto)
  dimensions?: PackageDimensionsDto;

  @ApiPropertyOptional({
    description: 'Total value of contents (for insurance calculation)',
    example: 100.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  declaredValue?: number;

  @ApiPropertyOptional({
    description: 'Preferred carrier (omit to compare all)',
    enum: ['oman_post', 'aramex', 'dhl', 'fedex', 'ups'],
  })
  @IsOptional()
  @IsString()
  preferredCarrier?: string;

  @ApiPropertyOptional({
    description: 'Required delivery date',
    example: '2024-01-20',
  })
  @IsOptional()
  @IsString()
  requiredDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Whether shipment contains dangerous goods',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsString()
  isDangerousGoods?: boolean;

  @ApiPropertyOptional({
    description: 'Additional options',
    example: { signatureRequired: true, insurance: true },
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export interface ShippingRate {
  carrier: string;
  carrierName: string;
  service: string;
  serviceName: string;
  totalAmount: number;
  currency: string;
  estimatedDelivery: string;
  estimatedDays: number;
  transitTime: string;
  insuranceAmount?: number;
  insuranceFee?: number;
  fuelSurcharge?: number;
  vatAmount?: number;
  baseAmount: number;
  discount?: number;
  trackingAvailable: boolean;
  signatureAvailable: boolean;
  codAvailable: boolean;
}

export interface RateComparisonResult {
  rates: ShippingRate[];
  cheapest?: ShippingRate;
  fastest?: ShippingRate;
  recommended?: ShippingRate;
  origin: LocationDto;
  destination: LocationDto;
  weight: number;
}
