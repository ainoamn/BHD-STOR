import { IsUUID, IsString, IsObject, IsOptional, IsNumber, IsPositive, IsEnum, MinLength, MaxLength, IsBoolean, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  WIRE = 'wire',
  STRIPE_CONNECT = 'stripe_connect',
  PAYPAL = 'paypal',
  CHECK = 'check',
}

export enum PayoutStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export class BankAccountDetails {
  @ApiProperty({ example: 'Ahmed Al Balushi' })
  @IsString()
  accountHolderName: string;

  @ApiProperty({ example: '1000001234567890' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'BBMEOMRX' })
  @IsString()
  @MinLength(8)
  @MaxLength(11)
  swiftCode: string;

  @ApiProperty({ example: 'Bank of Muscat' })
  @IsString()
  bankName: string;

  @ApiPropertyOptional({ example: 'Musc001' })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiProperty({ example: 'OM' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country: string;

  @ApiPropertyOptional({ example: 'OMR' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreatePayoutDto {
  @ApiProperty({
    description: 'Store ID to send payout to',
    example: 'store-uuid-1234-5678',
    format: 'uuid',
  })
  @IsUUID('4')
  storeId: string;

  @ApiProperty({
    description: 'Payout amount',
    example: 500.0,
    minimum: 0.1,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Payout currency',
    example: 'OMR',
    default: 'OMR',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string = 'OMR';

  @ApiProperty({
    description: 'Payout method',
    example: 'bank_transfer',
    enum: PayoutMethod,
  })
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @ApiProperty({
    description: 'Account details for the payout',
    example: {
      accountHolderName: 'Ahmed Al Balushi',
      accountNumber: '1000001234567890',
      swiftCode: 'BBMEOMRX',
      bankName: 'Bank of Muscat',
      country: 'OM',
    },
  })
  @IsObject()
  accountDetails: BankAccountDetails | Record<string, any>;

  @ApiPropertyOptional({
    description: 'Internal reference for this payout',
    example: 'POUT-2024-001',
  })
  @IsOptional()
  @IsString()
  internalReference?: string;

  @ApiPropertyOptional({
    description: 'Description/memo for the payout',
    example: 'Weekly payout for Store ABC',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this is an instant payout (may incur additional fees)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  instant?: boolean = false;

  @ApiPropertyOptional({
    description: 'Scheduled date for the payout',
    example: '2024-01-20',
  })
  @IsOptional()
  @IsString()
  scheduleDate?: string;
}

export class PayoutResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PayoutStatus })
  status: PayoutStatus;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PayoutMethod })
  method: PayoutMethod;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  estimatedArrival?: Date;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiPropertyOptional()
  failureReason?: string;
}
