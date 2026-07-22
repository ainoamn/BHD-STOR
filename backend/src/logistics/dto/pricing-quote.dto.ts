import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceType } from '../entities/shipment.entity';

class DimensionsDto {
  @IsNumber()
  @Min(0)
  length: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0)
  height: number;
}

export class PricingQuoteDto {
  @ApiProperty()
  @IsUUID()
  senderZoneId: string;

  @ApiProperty()
  @IsUUID()
  recipientZoneId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  weightKg: number;

  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensionsCm?: DimensionsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  declaredValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInsured?: boolean;
}
