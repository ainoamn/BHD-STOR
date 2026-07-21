import { IsString, IsEnum, IsNumber, IsOptional, IsDecimal, IsJSON, IsDate, IsArray, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, FuelType } from '../entities/vehicle.entity';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota Hiace 001' })
  @IsString()
  name: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.VAN })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  plateNumber: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityWeight?: number;

  @ApiPropertyOptional({ example: 15.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityVolume?: number;

  @ApiProperty({ enum: FuelType, example: FuelType.DIESEL })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Hiace' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometer?: number;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @Type(() => Date)
  insuranceExpiry?: Date;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @Type(() => Date)
  registrationExpiry?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  documents?: Record<string, any>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];
}
