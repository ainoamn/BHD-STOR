import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsBoolean, IsDecimal, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../entities/vehicle.entity';
import { Type } from 'class-transformer';

export class CreatePricingRuleDto {
  @ApiProperty({ example: 'Muscat to Salalah - Standard' })
  @IsString()
  name: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  fromZoneId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  toZoneId: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.TRUCK })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 5.000 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 0.500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightRate?: number;

  @ApiPropertyOptional({ example: 2.000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeRate?: number;

  @ApiPropertyOptional({ example: 0.200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceRate?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  expressMultiplier?: number;

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  sameDayMultiplier?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  fuelSurcharge?: number;

  @ApiProperty({ example: 3.000 })
  @IsNumber()
  @Min(0)
  minPrice: number;

  @ApiPropertyOptional({ example: 500.000 })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: 'string', format: 'date' })
  @Type(() => Date)
  effectiveFrom: Date;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @Type(() => Date)
  effectiveTo?: Date;
}
