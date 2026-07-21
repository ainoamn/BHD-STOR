import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, MarkAsReadDto, ConversationFilterDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message', description: 'Send a message to another user' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  async sendMessage(@Body() dto: SendMessageDto, @Request() req) {
    const message = await this.chatService.sendMessage(req.user.userId, dto);
    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get conversations',
    description: 'Get all conversations for the authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversations(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.chatService.getConversations(
      req.user.userId,
      +page,
      +limit,
    );
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Get('conversations/:conversationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation', description: 'Get a single conversation by ID' })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Request() req,
  ) {
    const conversation = await this.chatService.getConversation(
      req.user.userId,
      conversationId,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages', description: 'Get messages in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const result = await this.chatService.getMessages(
      req.user.userId,
      conversationId,
      +page,
      +limit,
    );
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Post('messages/:messageId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as read', description: 'Mark a specific message as read' })
  @ApiParam({ name: 'messageId', description: 'Message UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the receiver' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markAsRead(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Request() req,
  ) {
    const message = await this.chatService.markAsRead(req.user.userId, messageId);
    return {
      success: true,
      message: 'Message marked as read',
      data: message,
    };
  }

  @Post('conversations/:conversationId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark conversation as read',
    description: 'Mark all messages in a conversation as read',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markConversationAsRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Request() req,
  ) {
    await this.chatService.markConversationAsRead(req.user.userId, conversationId);
    return {
      success: true,
      message: 'All messages marked as read',
    };
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread count', description: 'Get total unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req) {
    const count = await this.chatService.getUnreadCount(req.user.userId);
    return {
      success: true,
      data: { count },
    };
  }

  @Get('unread-by-conversation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unread counts by conversation',
    description: 'Get unread message counts grouped by conversation',
  })
  @ApiResponse({ status: 200, description: 'Unread counts retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCountsByConversation(@Request() req) {
    const counts = await this.chatService.getUnreadCountsByConversation(
      req.user.userId,
    );
    return {
      success: true,
      data: counts,
    };
  }

  @Delete('messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete message', description: 'Soft delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only delete own messages' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Request() req,
  ) {
    await this.chatService.deleteMessage(req.user.userId, messageId);
    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }
}
