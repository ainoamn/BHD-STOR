import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsDecimal, IsDate, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType, MaintenanceStatus } from '../entities/maintenance-record.entity';
import { Type } from 'class-transformer';

export class CreateMaintenanceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.ROUTINE })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Regular 10,000 km service - oil change, filter replacement' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 45.500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'Oman Auto Services' })
  @IsOptional()
  @IsString()
  performedBy?: string;

  @ApiProperty({ type: 'string', format: 'date' })
  @Type(() => Date)
  date: Date;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @Type(() => Date)
  nextDueDate?: Date;

  @ApiPropertyOptional({ enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  documents?: string[];
}
