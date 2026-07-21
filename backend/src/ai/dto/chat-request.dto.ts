import { IsString, IsObject, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'User message to send to the AI assistant',
    example: 'What are the best electronics deals today?',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Additional context for the conversation',
    example: { userId: 'user-123', previousOrders: ['ORD-001'] },
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Conversation ID for maintaining chat history',
    example: 'conv-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'AI response message' })
  response: string;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiPropertyOptional({ description: 'Suggested products' })
  suggestions?: any[];

  @ApiPropertyOptional({ description: 'Response metadata' })
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}
