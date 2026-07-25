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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { TypingIndicatorDto } from './dto/send-message.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import {
  extractWsHandshakeToken,
  resolveWsUserFromJwtPayload,
} from './utils/ws-auth';

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
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify JWT from handshake and bind identity to the socket.
   * Client-supplied userId is never trusted.
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = extractWsHandshakeToken(client.handshake);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
        userId?: string;
        email?: string;
        role?: string;
        type?: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        issuer: this.configService.get<string>(
          'JWT_ISSUER',
          'bhd-oman-marketplace',
        ),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'bhd-oman-api',
        ),
      });

      const user = resolveWsUserFromJwtPayload(payload);
      if (!user) {
        this.logger.warn(`Client ${client.id} presented invalid token claims`);
        client.disconnect(true);
        return;
      }

      client.user = user;
      this.connectedUsers.set(user.userId, client.id);
      client.join(`user_${user.userId}`);

      this.logger.log(`Client connected: ${client.id} as user ${user.userId}`);
    } catch (error) {
      this.logger.warn(
        `Connection rejected for ${client.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Re-join rooms / push unread for the JWT-bound user only. */
  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = this.requireUserId(client);
    this.connectedUsers.set(userId, client.id);
    client.join(`user_${userId}`);

    const unreadCount = await this.chatService.getUnreadCount(userId);
    client.emit('unread_count', { count: unreadCount });
    client.emit('registered', { success: true, userId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const senderId = this.requireUserId(client);

    if (!data?.receiverId || !data?.content) {
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

      client.emit('message_sent', {
        success: true,
        message,
      });

      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('new_message', {
          message,
          conversationId: message.conversation?.id,
        });

        const unreadCount = await this.chatService.getUnreadCount(
          data.receiverId,
        );
        this.server
          .to(receiverSocketId)
          .emit('unread_count', { count: unreadCount });
      }

      if (message.conversation?.id) {
        this.server
          .to(`conversation_${message.conversation.id}`)
          .emit('new_message', {
            message,
          });
      }
    } catch (error) {
      client.emit('message_error', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!data?.conversationId) {
      throw new WsException('Conversation ID is required');
    }

    const userId = this.requireUserId(client);

    try {
      await this.chatService.getConversation(userId, data.conversationId);

      client.join(`conversation_${data.conversationId}`);
      client.emit('joined_conversation', {
        conversationId: data.conversationId,
        success: true,
      });
    } catch (error) {
      client.emit('join_error', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    this.requireUserId(client);
    client.leave(`conversation_${data.conversationId}`);
    client.emit('left_conversation', {
      conversationId: data.conversationId,
      success: true,
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = this.requireUserId(client);

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

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = this.requireUserId(client);

    try {
      const message = await this.chatService.markAsRead(userId, data.messageId);

      const senderSocketId = this.connectedUsers.get(message.sender.id);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('message_read', {
          messageId: message.id,
          conversationId: message.conversation?.id,
          readAt: message.readAt,
        });
      }

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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @SubscribeMessage('get_conversations')
  async handleGetConversations(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = this.requireUserId(client);

    try {
      const result = await this.chatService.getConversations(
        userId,
        data?.page || 1,
        data?.limit || 20,
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @MessageBody()
    data: { conversationId: string; page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = this.requireUserId(client);

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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private requireUserId(client: AuthenticatedSocket): string {
    const userId = client.user?.userId;
    if (!userId) {
      throw new WsException('Authentication required');
    }
    return userId;
  }
}
