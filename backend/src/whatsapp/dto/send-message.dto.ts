import { IsString, IsEnum, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'text',
  TEMPLATE = 'template',
  PRODUCT = 'product',
  ORDER = 'order',
  IMAGE = 'image',
  DOCUMENT = 'document',
  LOCATION = 'location',
  INTERACTIVE = 'interactive',
}

export enum TemplateName {
  WELCOME = 'welcome_message',
  ORDER_CONFIRMATION = 'order_confirmation',
  SHIPPING_UPDATE = 'shipping_update',
  DELIVERED = 'order_delivered',
  PAYMENT_RECEIVED = 'payment_received',
  ABANDONED_CART = 'abandoned_cart',
  REVIEW_REQUEST = 'review_request',
  SUPPORT_TICKET = 'support_ticket_update',
  OTP = 'otp_verification',
  PRICE_DROP = 'price_drop_alert',
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Recipient phone number (international format, e.g., +968XXXXXXX)',
    example: '+96891234567',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! Your order #ORD-123 has been confirmed.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({
    description: 'Template name (required for template messages)',
    enum: TemplateName,
    example: TemplateName.ORDER_CONFIRMATION,
  })
  @IsString()
  @IsOptional()
  templateName?: string;

  @ApiPropertyOptional({
    description: 'Template language code',
    example: 'en',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Template components (variables)',
    example: [
      { type: 'header', parameters: [{ type: 'text', text: 'Order #123' }] },
      { type: 'body', parameters: [{ type: 'text', text: 'John' }, { type: 'text', text: 'OMR 45.500' }] },
    ],
  })
  @IsObject()
  @IsOptional()
  components?: any[];

  @ApiPropertyOptional({
    description: 'Product data (for product messages)',
    example: {
      id: 'PROD-123',
      name: 'iPhone 15 Pro',
      price: 499.0,
      imageUrl: 'https://bhdoman.com/images/iphone15.jpg',
    },
  })
  @IsObject()
  @IsOptional()
  productData?: any;

  @ApiPropertyOptional({
    description: 'Order data (for order messages)',
    example: {
      orderId: 'ORD-123',
      status: 'confirmed',
      items: [],
      total: 45.5,
    },
  })
  @IsObject()
  @IsOptional()
  orderData?: any;

  @ApiPropertyOptional({
    description: 'Media URL for image/document messages',
    example: 'https://bhdoman.com/invoices/inv-123.pdf',
  })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Caption for media messages',
    example: 'Your invoice for order #ORD-123',
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Interactive buttons for the message',
    example: [
      { type: 'reply', reply: { id: 'track', title: 'Track Order' } },
      { type: 'reply', reply: { id: 'support', title: 'Contact Support' } },
    ],
  })
  @IsOptional()
  buttons?: any[];

  @ApiPropertyOptional({
    description: 'Whether to log this message in conversation history',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  logConversation?: boolean;
}

export class BulkMessageDto {
  @ApiProperty({
    description: 'Array of messages to send',
    type: [SendMessageDto],
  })
  messages: SendMessageDto[];

  @ApiPropertyOptional({
    description: 'Delay between messages in milliseconds',
    example: 1000,
    default: 500,
  })
  @IsOptional()
  delayMs?: number;
}

export class MessageStatusDto {
  @ApiProperty({ description: 'Message ID' })
  messageId: string;

  @ApiProperty({ description: 'Delivery status' })
  status: 'sent' | 'delivered' | 'read' | 'failed';

  @ApiPropertyOptional({ description: 'Timestamp' })
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Error details if failed' })
  error?: string;
}
