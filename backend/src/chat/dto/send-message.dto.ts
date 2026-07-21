import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  LOCATION = 'location',
  SYSTEM = 'system',
}

export class MessageAttachmentDto {
  @ApiProperty({ description: 'Attachment URL', example: 'https://cdn.example.com/file.pdf' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Attachment type', example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'File name', example: 'document.pdf' })
  @IsString()
  filename: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 102456 })
  @IsOptional()
  size?: number;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Receiver user ID', format: 'uuid' })
  @IsUUID('4', { message: 'Invalid receiver ID' })
  receiverId: string;

  @ApiProperty({ description: 'Message content', example: 'Hello, is this product available?' })
  @IsString()
  @MinLength(1, { message: 'Message content is required' })
  @MaxLength(5000, { message: 'Message must not exceed 5000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType, { message: 'Invalid message type' })
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    description: 'Message attachments',
    type: [MessageAttachmentDto],
  })
  @IsArray()
  @IsOptional()
  attachments?: MessageAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Conversation ID (for existing conversations)',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Referenced product ID',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Referenced order ID',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;
}

export class TypingIndicatorDto {
  @ApiProperty({ description: 'Conversation ID', format: 'uuid' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ description: 'Is user typing', example: true })
  @IsOptional()
  isTyping?: boolean = true;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Message ID to mark as read', format: 'uuid' })
  @IsUUID()
  messageId: string;
}

export class ConversationFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;
}
