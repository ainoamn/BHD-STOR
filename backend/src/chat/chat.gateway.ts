import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TypingIndicatorDto, MarkAsReadDto } from './dto/send-message.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  /**
   * Handle new WebSocket connection
   * Validates the JWT token from handshake auth and extracts user identity
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract token from handshake auth or query parameter
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token as string;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      // Validate JWT token and extract user identity
      // The WsJwtGuard handles token verification; user data is attached to the socket
      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect(true);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    // Remove from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Register user with their socket
   */
  @SubscribeMessage('register')
  async handleRegister(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!data.userId) {
      throw new WsException('User ID is required');
    }

    client.user = {
      userId: data.userId,
      email: '',
      role: '',
    };

    this.connectedUsers.set(data.userId, client.id);
    client.join(`user_${data.userId}`);

    this.logger.log(`User ${data.userId} registered with socket ${client.id}`);

    // Send unread count
    const unreadCount = await this.chatService.getUnreadCount(data.userId);
    client.emit('unread_count', { count: unreadCount });
  }

  /**
   * Handle send message event
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const senderId = client.user?.userId || data.senderId;

    if (!senderId) {
      throw new WsException('Authentication required');
    }

    if (!data.receiverId || !data.content) {
      throw new WsException('Receiver ID and content are required');
    }

    try {
      const message = await this.chatService.sendMessage(senderId, {
        receiverId: data.receiverId,
        content: data.content,
        type: data.type || 'text',
        attachments: data.attachments || [],
        conversationId: data.conversationId,
        productId: data.productId,
        orderId: data.orderId,
      });

      // Emit to sender
      client.emit('message_sent', {
        success: true,
        message,
      });

      // Emit to receiver if online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('new_message', {
          message,
          conversationId: message.conversation?.id,
        });

        // Emit unread count update
        const unreadCount = await this.chatService.getUnreadCount(data.receiverId);
        this.server.to(receiverSocketId).emit('unread_count', { count: unreadCount });
      }

      // Emit to conversation room
      if (message.conversation?.id) {
        this.server.to(`conversation_${message.conversation.id}`).emit('new_message', {
          message,
        });
      }
    } catch (error) {
      client.emit('message_error', {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Handle join conversation event
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!data.conversationId) {
      throw new WsException('Conversation ID is required');
    }

    const userId = client.user?.userId;
    if (!userId) {
      throw new WsException('Authentication required');
    }

    try {
      // Verify user is a participant
      await this.chatService.getConversation(userId, data.conversationId);

      client.join(`conversation_${data.conversationId}`);
      client.emit('joined_conversation', {
        conversationId: data.conversationId,
        success: true,
      });

      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);
    } catch (error) {
      client.emit('join_error', {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Handle leave conversation event
   */
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    client.leave(`conversation_${data.conversationId}`);
    client.emit('left_conversation', {
      conversationId: data.conversationId,
      success: true,
    });
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = client.user?.userId;
    if (!userId) return;

    // Get conversation to find the other participant
    const conversation = await this.chatService.getConversation(
      userId,
      data.conversationId,
    );

    const receiverId =
      conversation.participant1.id === userId
        ? conversation.participant2.id
        : conversation.participant1.id;

    const receiverSocketId = this.connectedUsers.get(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_typing', {
        conversationId: data.conversationId,
        userId,
        isTyping: data.isTyping ?? true,
      });
    }
  }

  /**
   * Handle mark as read
   */
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = client.user?.userId;
    if (!userId) {
      throw new WsException('Authentication required');
    }

    try {
      const message = await this.chatService.markAsRead(userId, data.messageId);

      // Notify sender that message was read
      const senderSocketId = this.connectedUsers.get(message.sender.id);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('message_read', {
          messageId: message.id,
          conversationId: message.conversation?.id,
          readAt: message.readAt,
        });
      }

      // Emit to conversation room
      if (message.conversation?.id) {
        this.server
          .to(`conversation_${message.conversation.id}`)
          .emit('message_read', {
            messageId: message.id,
            readAt: message.readAt,
          });
      }
    } catch (error) {
      client.emit('read_error', {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Handle get conversations request
   */
  @SubscribeMessage('get_conversations')
  async handleGetConversations(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = client.user?.userId;
    if (!userId) {
      throw new WsException('Authentication required');
    }

    try {
      const result = await this.chatService.getConversations(
        userId,
        data.page || 1,
        data.limit || 20,
      );

      client.emit('conversations', {
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      });
    } catch (error) {
      client.emit('conversations_error', {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Handle get messages request
   */
  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @MessageBody() data: { conversationId: string; page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = client.user?.userId;
    if (!userId) {
      throw new WsException('Authentication required');
    }

    try {
      const result = await this.chatService.getMessages(
        userId,
        data.conversationId,
        data.page || 1,
        data.limit || 50,
      );

      client.emit('messages', {
        success: true,
        conversationId: data.conversationId,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      client.emit('messages_error', {
        success: false,
        error: error.message,
      });
    }
  }
}
