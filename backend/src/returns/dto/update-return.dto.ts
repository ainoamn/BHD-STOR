import { PartialType } from '@nestjs/swagger';
import { CreateReturnDto } from './create-return.dto';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDecimal,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReturnStatus } from '../entities/return-request.entity';

export class UpdateReturnDto extends PartialType(CreateReturnDto) {
  @ApiPropertyOptional({ enum: ReturnStatus, description: 'Return status' })
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Refund amount' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Pickup date' })
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @ApiPropertyOptional({ description: 'Assigned driver ID' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Tracking number for return shipment' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
