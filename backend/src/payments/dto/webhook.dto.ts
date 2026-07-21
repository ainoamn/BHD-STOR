import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupportedWebhookGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  OMAN_NET = 'oman_net',
  THAWANI = 'thawani',
  TELR = 'telr',
  CCAVENUE = 'ccavenue',
}

export class WebhookDto {
  @ApiProperty({
    description: 'Payment gateway that sent the webhook',
    example: 'stripe',
    enum: SupportedWebhookGateway,
  })
  @IsEnum(SupportedWebhookGateway)
  gateway: SupportedWebhookGateway;

  @ApiProperty({
    description: 'Webhook payload/event body from the gateway',
    example: { id: 'evt_123456', type: 'payment_intent.succeeded', data: { object: {} } },
  })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({
    description: 'HTTP headers from the webhook request (contains signatures)',
    example: {
      'stripe-signature': 't=1234567890,v1=signature123',
      'content-type': 'application/json',
    },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Raw request body (for signature verification)',
    example: '{"id":"evt_123456","type":"payment_intent.succeeded"}',
  })
  @IsOptional()
  @IsString()
  rawBody?: string;

  @ApiPropertyOptional({
    description: 'Webhook signature if not in headers',
    example: 't=1234567890,v1=abc123',
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the webhook was received',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsString()
  receivedAt?: string;
}

export class WebhookResponseDto {
  @ApiProperty({ description: 'Whether the webhook was processed successfully' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Processing result message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Internal processing ID for tracking' })
  processingId?: string;

  @ApiPropertyOptional({ description: 'Payment/Order ID affected by this webhook' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Event type that was processed' })
  eventType?: string;
}
