import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { BotEngine } from './bot/BotEngine';
import {
  extractWsHandshakeToken,
  isWsStaffRole,
  resolveWsUserFromJwtPayload,
} from '../chat/utils/ws-auth';

export interface WhatsAppSocketEvent {
  phone: string;
  message: string;
  type: 'text' | 'template' | 'image' | 'status_update';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TypingIndicatorEvent {
  phone: string;
  isTyping: boolean;
}

interface AuthenticatedWhatsAppSocket extends Socket {
  data: {
    userId?: string;
    role?: string;
    isStaff?: boolean;
  };
}

/**
 * WebSocket Gateway for real-time WhatsApp communication
 * Used by admin dashboard for live chat support
 */
@WebSocketGateway({
  namespace: '/whatsapp',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WhatsAppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WhatsAppGateway.name);

  @WebSocketServer()
  server: Server;

  // Track active admin sessions
  private adminSockets: Map<string, Socket> = new Map();
  // Track active customer chat sessions
  private activeChats: Map<string, { agentId?: string; startTime: Date }> = new Map();

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly botEngine: BotEngine,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  afterInit(server: Server): void {
    this.logger.log('WhatsApp WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedWhatsAppSocket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);
    client.data = client.data || {};

    try {
      const token = extractWsHandshakeToken(client.handshake);
      if (!token) {
        this.logger.warn(`WhatsApp WS ${client.id}: missing token`);
        client.emit('error', { message: 'Authentication required' });
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
      if (!user || !isWsStaffRole(user.role)) {
        this.logger.warn(
          `WhatsApp WS ${client.id}: rejected non-staff or invalid token`,
        );
        client.emit('error', { message: 'Staff access required' });
        client.disconnect(true);
        return;
      }

      client.data.userId = user.userId;
      client.data.role = user.role;
      client.data.isStaff = true;
      this.adminSockets.set(client.id, client);
      this.logger.log(
        `Staff connected to WhatsApp WS: ${client.id} (${user.userId})`,
      );
      this.sendActiveConversations(client);

      client.emit('connected', {
        socketId: client.id,
        userId: user.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `WhatsApp WS auth failed for ${client.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.adminSockets.delete(client.id);

    // Release any assigned chats
    for (const [phone, chat] of this.activeChats.entries()) {
      if (chat.agentId === client.id) {
        this.activeChats.set(phone, { ...chat, agentId: undefined });
        this.broadcastToAdmins('chat_unassigned', { phone, reason: 'agent_disconnected' });
      }
    }
  }

  private requireStaffSocket(client: AuthenticatedWhatsAppSocket): boolean {
    if (client.data?.isStaff && this.adminSockets.has(client.id)) {
      return true;
    }
    client.emit('error', { message: 'Staff access required' });
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // INCOMING MESSAGE HANDLERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Handle incoming WhatsApp message from webhook service
   * Broadcasts to admins if chat is active
   */
  async handleIncomingMessage(event: WhatsAppSocketEvent): Promise<void> {
    const { phone } = event;

    const activeChat = this.activeChats.get(phone);

    if (activeChat?.agentId) {
      const agentSocket = this.adminSockets.get(activeChat.agentId);
      if (agentSocket) {
        agentSocket.emit('new_message', event);
      }
    } else {
      this.broadcastToAdmins('new_customer_message', {
        ...event,
        isUnassigned: true,
      });
    }

    this.server.to(`phone_${phone}`).emit('message', event);
  }

  /**
   * Handle message status updates (sent/delivered/read)
   */
  async handleStatusUpdate(
    phone: string,
    messageId: string,
    status: string,
  ): Promise<void> {
    this.server.to(`phone_${phone}`).emit('status_update', {
      phone,
      messageId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CLIENT-TO-SERVER EVENTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Admin sends a message to a customer
   */
  @SubscribeMessage('send_message')
  async handleAdminSendMessage(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody()
    payload: {
      phone: string;
      message: string;
      type?: 'text' | 'template' | 'image';
      mediaUrl?: string;
    },
  ): Promise<void> {
    if (!this.requireStaffSocket(client)) return;

    try {
      const { phone, message, type, mediaUrl } = payload;

      const chat = this.activeChats.get(phone);
      if (chat?.agentId && chat.agentId !== client.id) {
        client.emit('error', { message: 'Chat is assigned to another agent' });
        return;
      }

      const receipt = await this.whatsAppService.sendMessage(phone, message, {
        type: type || 'text',
        mediaUrl,
      });

      client.emit('message_sent', {
        phone,
        messageId: receipt.messageId,
        status: receipt.status,
        timestamp: receipt.timestamp,
      });

      this.server.to(`phone_${phone}`).emit('message', {
        phone,
        message,
        type: type || 'text',
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        messageId: receipt.messageId,
      });
    } catch (error) {
      this.logger.error(`Admin send message failed: ${error.message}`);
      client.emit('error', {
        message: 'Failed to send message',
        details: error.message,
      });
    }
  }

  /**
   * Admin claims a chat session
   */
  @SubscribeMessage('claim_chat')
  async handleClaimChat(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody() payload: { phone: string },
  ): Promise<void> {
    if (!this.requireStaffSocket(client)) return;

    const { phone } = payload;
    const chat = this.activeChats.get(phone);

    if (chat?.agentId && chat.agentId !== client.id) {
      client.emit('chat_claim_failed', { phone, reason: 'already_claimed' });
      return;
    }

    this.activeChats.set(phone, {
      agentId: client.id,
      startTime: new Date(),
    });

    client.join(`phone_${phone}`);
    client.emit('chat_claimed', { phone, timestamp: new Date().toISOString() });

    this.broadcastToAdminsExcept(client, 'chat_assigned', {
      phone,
      agentId: client.id,
    });

    const history = await this.whatsAppService.getConversationHistory(phone);
    client.emit('conversation_history', { phone, messages: history });
  }

  /**
   * Admin releases a chat session
   */
  @SubscribeMessage('release_chat')
  handleReleaseChat(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody() payload: { phone: string },
  ): void {
    if (!this.requireStaffSocket(client)) return;

    const { phone } = payload;
    const chat = this.activeChats.get(phone);

    if (chat?.agentId === client.id) {
      this.activeChats.delete(phone);
      client.leave(`phone_${phone}`);
      client.emit('chat_released', { phone });
      this.broadcastToAdmins('chat_unassigned', {
        phone,
        reason: 'agent_released',
      });
    }
  }

  /**
   * Admin typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody() payload: TypingIndicatorEvent,
  ): void {
    if (!this.requireStaffSocket(client)) return;
    this.server.to(`phone_${payload.phone}`).emit('typing_indicator', {
      ...payload,
      agentId: client.id,
    });
  }

  /**
   * Join a phone number room (for viewing conversations)
   */
  @SubscribeMessage('subscribe_phone')
  handleSubscribePhone(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody() payload: { phone: string },
  ): void {
    if (!this.requireStaffSocket(client)) return;
    client.join(`phone_${payload.phone}`);
    client.emit('subscribed', { phone: payload.phone });
  }

  /**
   * Leave a phone number room
   */
  @SubscribeMessage('unsubscribe_phone')
  handleUnsubscribePhone(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody() payload: { phone: string },
  ): void {
    if (!this.requireStaffSocket(client)) return;
    client.leave(`phone_${payload.phone}`);
    client.emit('unsubscribed', { phone: payload.phone });
  }

  /**
   * Get active conversations list
   */
  @SubscribeMessage('get_conversations')
  async handleGetConversations(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
  ): Promise<void> {
    if (!this.requireStaffSocket(client)) return;
    await this.sendActiveConversations(client);
  }

  /**
   * Admin sends a quick reply template
   */
  @SubscribeMessage('send_quick_reply')
  async handleQuickReply(
    @ConnectedSocket() client: AuthenticatedWhatsAppSocket,
    @MessageBody()
    payload: {
      phone: string;
      templateId: string;
      variables?: Record<string, string>;
    },
  ): Promise<void> {
    if (!this.requireStaffSocket(client)) return;

    const templates: Record<string, string> = {
      greeting:
        'Hello! Thank you for contacting BHD Oman. How can I assist you today?',
      order_status:
        'Let me check your order status. Could you please provide your order ID?',
      shipping_info:
        'Your order is being processed. You will receive tracking information shortly.',
      refund_policy:
        'Our refund policy allows returns within 14 days of delivery. The item must be in original condition.',
      support_escalate:
        'I am escalating your issue to our specialist team. They will contact you within 24 hours.',
      thank_you:
        'Thank you for choosing BHD Oman! We appreciate your business. Have a wonderful day!',
      goodbye:
        'Thank you for chatting with us. If you need anything else, feel free to reach out. Goodbye!',
      arabic_greeting:
        'مرحباً! شكراً لتواصلك مع BHD عمان. كيف يمكنني مساعدتك؟',
      arabic_thanks:
        'شكراً لاختيارك BHD عمان! نقدر تعاملك معنا. يوماً سعيداً!',
    };

    const message = templates[payload.templateId] || payload.templateId;

    try {
      const receipt = await this.whatsAppService.sendMessage(
        payload.phone,
        message,
      );

      client.emit('message_sent', {
        phone: payload.phone,
        messageId: receipt.messageId,
        status: receipt.status,
      });

      this.server.to(`phone_${payload.phone}`).emit('message', {
        phone: payload.phone,
        message,
        type: 'text',
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        messageId: receipt.messageId,
      });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to send quick reply',
        details: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BROADCAST HELPERS
  // ═══════════════════════════════════════════════════════════════

  private broadcastToAdmins(event: string, data: any): void {
    for (const [, socket] of this.adminSockets) {
      socket.emit(event, data);
    }
  }

  private broadcastToAdminsExcept(
    exceptSocket: Socket,
    event: string,
    data: any,
  ): void {
    for (const [, socket] of this.adminSockets) {
      if (socket.id !== exceptSocket.id) {
        socket.emit(event, data);
      }
    }
  }

  private async sendActiveConversations(client: Socket): Promise<void> {
    try {
      const conversations = await this.whatsAppService.getActiveConversations();
      client.emit('active_conversations', {
        count: conversations.length,
        conversations: conversations.map((c) => ({
          ...c,
          isAssigned: !!this.activeChats.get(c.phone)?.agentId,
          assignedAgent: this.activeChats.get(c.phone)?.agentId,
        })),
      });
    } catch (error) {
      this.logger.error(`Failed to get active conversations: ${error.message}`);
      client.emit('error', { message: 'Failed to load conversations' });
    }
  }
}
