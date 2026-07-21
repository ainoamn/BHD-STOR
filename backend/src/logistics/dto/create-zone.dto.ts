import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean, IsNumber, IsJSON, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ZoneType, PricingTier } from '../entities/zone.entity';

export class CreateZoneDto {
  @ApiProperty({ example: '\u0645\u0633\u0642\u062a' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Muscat' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'MCT-01' })
  @IsString()
  code: string;

  @ApiProperty({ enum: ZoneType, example: ZoneType.CITY })
  @IsEnum(ZoneType)
  type: ZoneType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  coverage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  boundaries?: { lat: number; lng: number }[];

  @ApiPropertyOptional()
  @IsOptional()
  centerPoint?: { lat: number; lng: number };

  @ApiProperty({ enum: PricingTier, example: PricingTier.TIER1 })
  @IsEnum(PricingTier)
  pricingTier: PricingTier;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
