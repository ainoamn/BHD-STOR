import { IsUUID, IsString, IsOptional, IsNumber, IsPositive, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  PRODUCT_NOT_RECEIVED = 'product_not_received',
  PRODUCT_UNACCEPTABLE = 'product_unacceptable',
  OTHER = 'other',
}

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Payment ID to refund',
    example: 'pay_1O1234567890abcdef',
    format: 'uuid',
  })
  @IsUUID('4')
  paymentId: string;

  @ApiProperty({
    description: 'Amount to refund (partial refunds allowed). Omit for full refund.',
    example: 15.5,
    minimum: 0.001,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount?: number;

  @ApiProperty({
    description: 'Reason for the refund',
    example: 'requested_by_customer',
    enum: RefundReason,
  })
  @IsEnum(RefundReason)
  reason: RefundReason;

  @ApiPropertyOptional({
    description: 'Additional notes about the refund',
    example: 'Customer received damaged item',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Internal reference for the refund',
    example: 'REF-2024-001',
  })
  @IsOptional()
  @IsString()
  internalReference?: string;
}
