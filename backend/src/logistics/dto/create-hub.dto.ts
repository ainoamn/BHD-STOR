import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsJSON, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HubType } from '../entities/hub.entity';

export class CreateHubDto {
  @ApiProperty({ example: 'Muscat Central Hub' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MCT-CH-01' })
  @IsString()
  code: string;

  @ApiProperty({ enum: HubType, example: HubType.CENTRAL })
  @IsEnum(HubType)
  type: HubType;

  @ApiProperty({ type: Object })
  address: {
    street: string;
    city: string;
    area?: string;
    postalCode?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  location?: { lat: number; lng: number };

  @ApiPropertyOptional({ example: '+968-2412-3456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Khalid Al-Saadi' })
  @IsOptional()
  @IsString()
  managerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
