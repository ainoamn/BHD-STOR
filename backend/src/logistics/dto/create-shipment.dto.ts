import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsDecimal, IsJSON, IsDate, IsArray, IsNotEmpty, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType, ServiceType } from '../entities/shipment.entity';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}

export class CreateShipmentDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ enum: SourceType, example: SourceType.STORE_ORDER })
  @IsEnum(SourceType)
  sourceType: SourceType;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  @IsUUID()
  senderId: string;

  @ApiProperty({ example: 'Ahmed Al-Rashdi' })
  @IsString()
  senderName: string;

  @ApiProperty({ example: '+968-9123-4567' })
  @IsString()
  senderPhone: string;

  @ApiProperty({ type: AddressDto })
  senderAddress: AddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  senderLocation?: { lat: number; lng: number };

  @ApiProperty({ example: 'Fatima Al-Balushi' })
  @IsString()
  receiverName: string;

  @ApiProperty({ example: '+968-9234-5678' })
  @IsString()
  receiverPhone: string;

  @ApiProperty({ type: AddressDto })
  receiverAddress: AddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  receiverLocation?: { lat: number; lng: number };

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  pickupDate?: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @Type(() => Date)
  promisedDeliveryDate: Date;

  @ApiProperty({ example: 5.5 })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiPropertyOptional()
  @IsOptional()
  dimensions?: { length: number; width: number; height: number };

  @ApiProperty({ example: 0.2 })
  @IsNumber()
  @Min(0)
  volume: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pieces?: number;

  @ApiPropertyOptional({ example: 'Electronics - fragile items' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 250.00 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 250.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional({ example: 'Handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;
}
