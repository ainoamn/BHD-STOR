import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../entities/vehicle.entity';
import { ServiceType } from '../entities/shipment.entity';

export class CalculatePriceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  fromZoneId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  toZoneId: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ enum: VehicleType, example: VehicleType.VAN })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440099' })
  @IsOptional()
  @IsUUID()
  b2bCustomerId?: string;
}
