import { IsString, IsEnum, IsOptional, IsEmail, IsNumber, IsBoolean, IsUrl, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTerms, B2BCustomerStatus } from '../entities/b2b-customer.entity';

export class CreateB2bCustomerDto {
  @ApiProperty({ example: 'Al-Farooq Trading LLC' })
  @IsString()
  @MaxLength(150)
  companyName: string;

  @ApiPropertyOptional({ example: 'TR-123456' })
  @IsOptional()
  @IsString()
  tradeLicense?: string;

  @ApiProperty({ example: 'Mohammed Al-Farooq' })
  @IsString()
  contactName: string;

  @ApiProperty({ example: 'mohammed@alfarooq.om' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: '+968-9123-4567' })
  @IsString()
  contactPhone: string;

  @ApiPropertyOptional({ example: 10000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ enum: PaymentTerms, default: PaymentTerms.PREPAID })
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @ApiPropertyOptional({ example: 10.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountRate?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyVolumeCommitment?: number;

  @ApiPropertyOptional({ enum: B2BCustomerStatus, default: B2BCustomerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(B2BCustomerStatus)
  status?: B2BCustomerStatus;

  @ApiPropertyOptional({ example: 'https://alfarooq.om/webhook/bhd' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}
