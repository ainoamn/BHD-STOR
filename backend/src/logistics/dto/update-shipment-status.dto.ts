import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '../entities/shipment.entity';

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.IN_TRANSIT })
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Package picked up from sender' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Muscat Hub' })
  @IsOptional()
  @IsString()
  location?: string;
}
