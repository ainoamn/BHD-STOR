import { IsString, IsEnum, IsOptional, IsUUID, IsDecimal, IsBoolean, IsJSON, IsDate, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenseType, DriverStatus, BackgroundCheckStatus } from '../entities/driver.entity';
import { Type } from 'class-transformer';

export class CreateDriverDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'DRV-001' })
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 'OM-12345678' })
  @IsString()
  licenseNumber: string;

  @ApiProperty({ enum: LicenseType, example: LicenseType.LIGHT })
  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @ApiProperty({ type: 'string', format: 'date' })
  @Type(() => Date)
  licenseExpiry: Date;

  @ApiPropertyOptional({ enum: DriverStatus, default: DriverStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional()
  @IsOptional()
  workSchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  documents?: {
    idCard?: string;
    licensePhoto?: string;
    medicalCertificate?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };

  @ApiPropertyOptional({ enum: BackgroundCheckStatus, default: BackgroundCheckStatus.PENDING })
  @IsOptional()
  @IsEnum(BackgroundCheckStatus)
  backgroundCheck?: BackgroundCheckStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  currentZoneId?: string;
}
