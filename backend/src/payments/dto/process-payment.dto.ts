import { IsUUID, IsString, IsOptional, IsNumber, IsPositive, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Order ID to process payment for',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID('4')
  orderId: string;

  @ApiProperty({
    description: 'Payment gateway to use',
    example: 'stripe',
    enum: ['stripe', 'paypal', 'oman_net', 'thawani', 'telr', 'ccavenue'],
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  gateway: string;

  @ApiPropertyOptional({
    description: 'Stripe Payment Method ID (required for Stripe gateway)',
    example: 'pm_1O1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Currency code in ISO 4217 format',
    example: 'OMR',
    default: 'OMR',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a valid 3-letter ISO code' })
  currency: string = 'OMR';

  @ApiPropertyOptional({
    description: 'Amount to charge (in smallest currency unit for some gateways)',
    example: 25.5,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Customer email for payment receipt',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'Ahmed Al Balushi',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Return URL after payment completion (for redirect-based gateways)',
    example: 'https://bhd.marketplace.com/payment/success',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'Cancel URL if payment is cancelled',
    example: 'https://bhd.marketplace.com/payment/cancel',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the payment',
    example: { customerPhone: '+96891234567', shippingAddress: 'Muscat, Oman' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
