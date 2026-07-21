import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsJSON, IsArray, IsDate, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RouteStatus } from '../entities/route.entity';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  driverId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ type: 'string', format: 'date' })
  @Type(() => Date)
  date: Date;

  @ApiPropertyOptional({ enum: RouteStatus, default: RouteStatus.PLANNED })
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  stops?: {
    shipmentId: string;
    sequence: number;
    lat: number;
    lng: number;
    address: string;
    estimatedArrival?: Date;
  }[];
}
