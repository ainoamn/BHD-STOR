import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebhookEventType {
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_READ = 'message_read',
  MESSAGE_FAILED = 'message_failed',
  STATUS_UPDATE = 'status_update',
  TEMPLATE_SENT = 'template_sent',
  OPT_IN = 'opt_in',
  OPT_OUT = 'opt_out',
}

export class WebhookMessageDto {
  @ApiProperty({
    description: 'Sender phone number',
    example: '+96891234567',
  })
  @IsString()
  From: string;

  @ApiProperty({
    description: 'Recipient phone number (your Twilio/WhatsApp number)',
    example: '+14155238886',
  })
  @IsString()
  To: string;

  @ApiProperty({
    description: 'Message body/content',
    example: 'Hello, I want to track my order',
  })
  @IsString()
  Body: string;

  @ApiProperty({
    description: 'Twilio/Message ID',
    example: 'SM1234567890abcdef',
  })
  @IsString()
  MessageSid: string;

  @ApiPropertyOptional({
    description: 'Media URL if message contains media',
    example: 'https://api.twilio.com/media/ME123',
  })
  @IsString()
  @IsOptional()
  MediaUrl0?: string;

  @ApiPropertyOptional({
    description: 'Media content type',
    example: 'image/jpeg',
  })
  @IsString()
  @IsOptional()
  MediaContentType0?: string;

  @ApiPropertyOptional({
    description: 'Number of media items',
    example: '1',
  })
  @IsString()
  @IsOptional()
  NumMedia?: string;

  @ApiPropertyOptional({
    description: 'Profile name of the sender',
    example: 'Ahmed Al-Rashdi',
  })
  @IsString()
  @IsOptional()
  ProfileName?: string;

  @ApiPropertyOptional({
    description: 'Message timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  @IsOptional()
  Timestamp?: string;

  @ApiPropertyOptional({
    description: 'Account SID',
    example: 'AC1234567890abcdef',
  })
  @IsString()
  @IsOptional()
  AccountSid?: string;

  @ApiPropertyOptional({
    description: 'API version',
    example: '2010-04-01',
  })
  @IsString()
  @IsOptional()
  ApiVersion?: string;

  @ApiPropertyOptional({
    description: 'SMS status (for status callbacks)',
    example: 'delivered',
  })
  @IsString()
  @IsOptional()
  MessageStatus?: string;

  @ApiPropertyOptional({
    description: 'Error code if message failed',
    example: '30001',
  })
  @IsString()
  @IsOptional()
  ErrorCode?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp specific - Button payload for interactive messages',
    example: 'track_order',
  })
  @IsString()
  @IsOptional()
  ButtonPayload?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp specific - Button text',
    example: 'Track Order',
  })
  @IsString()
  @IsOptional()
  ButtonText?: string;

  @ApiPropertyOptional({
    description: 'Latitude for location messages',
    example: '23.5859',
  })
  @IsString()
  @IsOptional()
  Latitude?: string;

  @ApiPropertyOptional({
    description: 'Longitude for location messages',
    example: '58.4059',
  })
  @IsString()
  @IsOptional()
  Longitude?: string;

  @ApiPropertyOptional({
    description: 'Original SmsSid (for status callbacks)',
    example: 'SM1234567890abcdef',
  })
  @IsString()
  @IsOptional()
  SmsSid?: string;

  @ApiPropertyOptional({
    description: 'SmsStatus (for status callbacks)',
    example: 'received',
  })
  @IsString()
  @IsOptional()
  SmsStatus?: string;
}

export class WebhookVerificationDto {
  @ApiProperty({
    description: 'Hub mode for verification',
    example: 'subscribe',
  })
  @IsString()
  'hub.mode': string;

  @ApiProperty({
    description: 'Hub challenge for verification',
    example: '1234567890',
  })
  @IsString()
  'hub.challenge': string;

  @ApiProperty({
    description: 'Hub verify token',
    example: 'bhd_webhook_verify_token_2024',
  })
  @IsString()
  'hub.verify_token': string;
}

export class MetaWebhookPayloadDto {
  @ApiProperty({ description: 'Webhook object type' })
  @IsString()
  object: 'whatsapp_business_account';

  @ApiProperty({ description: 'Array of entry objects' })
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: 'text' | 'image' | 'document' | 'location' | 'button' | 'interactive';
          button?: { text: string; payload: string };
          image?: { id: string; mime_type: string };
          document?: { id: string; mime_type: string; filename: string };
          location?: { latitude: number; longitude: number };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: { id: string; origin: { type: string } };
          errors?: Array<{ code: number; title: string }>;
        }>;
      };
      field: 'messages';
    }>;
  }>;
}

export class ConversationMessageDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  messageId: string;

  @ApiProperty({ description: 'Message direction' })
  @IsEnum(['inbound', 'outbound'])
  direction: 'inbound' | 'outbound';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Message type' })
  @IsEnum(['text', 'template', 'product', 'order', 'image', 'document'])
  type: string;

  @ApiProperty({ description: 'Timestamp' })
  @IsString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Message status' })
  @IsOptional()
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}
