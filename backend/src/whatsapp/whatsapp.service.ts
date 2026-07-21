import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { firstValueFrom } from 'rxjs';
import { BotEngine } from './bot/BotEngine';
import { OpenAIService } from '../ai/services/openai.service';

export interface WhatsAppConfig {
  provider: 'twilio' | 'meta';
  // Twilio config
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  // Meta/WhatsApp Business API config
  apiToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  apiVersion: string;
  // General
  webhookVerifyToken?: string;
  callbackUrl?: string;
}

export interface SendMessageOptions {
  type?: 'text' | 'template' | 'image' | 'document' | 'location' | 'interactive';
  mediaUrl?: string;
  caption?: string;
  buttons?: Array<{ id: string; title: string }>;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
}

export interface MessageReceipt {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
  error?: string;
}

export interface ConversationMessage {
  messageId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  type: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly config: WhatsAppConfig;
  private readonly redisPrefix = 'wa:';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly botEngine: BotEngine,
    private readonly openaiService: OpenAIService,
  ) {
    this.config = {
      provider: (this.configService.get<string>('WHATSAPP_PROVIDER') as 'twilio' | 'meta') || 'twilio',
      // Twilio
      accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN'),
      fromNumber: this.configService.get<string>('TWILIO_WHATSAPP_NUMBER'),
      // Meta
      apiToken: this.configService.get<string>('WHATSAPP_API_TOKEN'),
      phoneNumberId: this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID'),
      businessAccountId: this.configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID'),
      apiVersion: this.configService.get<string>('WHATSAPP_API_VERSION') || 'v18.0',
      // General
      webhookVerifyToken: this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
      callbackUrl: this.configService.get<string>('WHATSAPP_CALLBACK_URL'),
    };

    this.logger.log(`WhatsApp service initialized with provider: ${this.config.provider}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // MESSAGE SENDING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send a WhatsApp message (Twilio or Meta API)
   */
  async sendMessage(
    phone: string,
    message: string,
    options?: SendMessageOptions,
  ): Promise<MessageReceipt> {
    const normalizedPhone = this.normalizePhone(phone);

    try {
      if (this.config.provider === 'twilio') {
        return await this.sendTwilioMessage(normalizedPhone, message, options);
      } else {
        return await this.sendMetaMessage(normalizedPhone, message, options);
      }
    } catch (error) {
      this.logger.error(`Failed to send message to ${normalizedPhone}: ${error.message}`);
      throw new BadRequestException(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Send message via Twilio WhatsApp API
   */
  private async sendTwilioMessage(
    phone: string,
    message: string,
    options?: SendMessageOptions,
  ): Promise<MessageReceipt> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${this.config.fromNumber}`);
    formData.append('To', `whatsapp:${phone}`);
    formData.append('Body', message);

    // Add media if provided
    if (options?.mediaUrl) {
      formData.append('MediaUrl', options.mediaUrl);
    }

    const response = await firstValueFrom(
      this.httpService.post(url, formData.toString(), {
        auth: {
          username: this.config.accountSid!,
          password: this.config.authToken!,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    const receipt: MessageReceipt = {
      messageId: response.data.sid,
      status: response.data.status === 'queued' ? 'queued' : 'sent',
      timestamp: new Date().toISOString(),
    };

    // Log the message
    await this.logMessage(phone, receipt.messageId, 'outbound', message, options?.type || 'text');

    return receipt;
  }

  /**
   * Send message via Meta WhatsApp Business API
   */
  private async sendMetaMessage(
    phone: string,
    message: string,
    options?: SendMessageOptions,
  ): Promise<MessageReceipt> {
    const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;

    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
    };

    // Build message based on type
    switch (options?.type) {
      case 'template':
        payload.type = 'template';
        payload.template = {
          name: options.templateName || 'hello_world',
          language: { code: options.templateLanguage || 'en' },
          components: options.templateComponents || [],
        };
        break;

      case 'image':
        payload.type = 'image';
        payload.image = {
          link: options.mediaUrl,
          caption: options.caption || message,
        };
        break;

      case 'document':
        payload.type = 'document';
        payload.document = {
          link: options.mediaUrl,
          caption: options.caption || message,
        };
        break;

      case 'interactive':
        payload.type = 'interactive';
        payload.interactive = {
          type: 'button',
          body: { text: message },
          action: {
            buttons: (options.buttons || []).map((b) => ({
              type: 'reply',
              reply: { id: b.id, title: b.title.substring(0, 20) },
            })),
          },
        };
        break;

      case 'location':
        payload.type = 'location';
        payload.location = {
          latitude: options?.['latitude'] || 23.5859,
          longitude: options?.['longitude'] || 58.4059,
          name: message,
          address: options?.caption || '',
        };
        break;

      default:
        // Text message
        payload.type = 'text';
        payload.text = {
          preview_url: true,
          body: message,
        };
    }

    const response = await firstValueFrom(
      this.httpService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    const receipt: MessageReceipt = {
      messageId: response.data.messages?.[0]?.id || `meta_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    await this.logMessage(phone, receipt.messageId, 'outbound', message, options?.type || 'text');

    return receipt;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE MESSAGES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send a template message (order confirmation, shipping update, etc.)
   */
  async sendTemplate(
    phone: string,
    templateName: string,
    language: string = 'en',
    components?: any[],
  ): Promise<MessageReceipt> {
    try {
      if (this.config.provider === 'twilio') {
        // Twilio uses Content API/SID for templates
        return await this.sendTwilioTemplate(phone, templateName, language, components);
      } else {
        return await this.sendMessage(phone, '', {
          type: 'template',
          templateName,
          templateLanguage: language,
          templateComponents: components,
        });
      }
    } catch (error) {
      this.logger.error(`Template send failed: ${error.message}`);
      // Fallback: send plain text
      return this.sendMessage(phone, this.getTemplateFallback(templateName, components));
    }
  }

  private async sendTwilioTemplate(
    phone: string,
    templateName: string,
    language: string,
    components?: any[],
  ): Promise<MessageReceipt> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${this.config.fromNumber}`);
    formData.append('To', `whatsapp:${this.normalizePhone(phone)}`);
    formData.append('ContentSid', templateName);
    if (components) {
      formData.append('ContentVariables', JSON.stringify(components));
    }

    const response = await firstValueFrom(
      this.httpService.post(url, formData.toString(), {
        auth: {
          username: this.config.accountSid!,
          password: this.config.authToken!,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    return {
      messageId: response.data.sid,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT MESSAGES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send product details via WhatsApp
   */
  async sendProduct(
    phone: string,
    product: {
      id: string;
      name: string;
      price: number;
      currency: string;
      imageUrl?: string;
      description?: string;
      store: string;
      url?: string;
    },
  ): Promise<MessageReceipt> {
    const message = `*${product.name}*\n\n${product.description || ''}\n\n💰 *${product.currency} ${product.price.toFixed(3)}*\n🏪 ${product.store}\n\n${product.url || ''}`;

    if (product.imageUrl) {
      return this.sendMessage(phone, message, {
        type: 'image',
        mediaUrl: product.imageUrl,
        caption: message,
        buttons: [
          { id: `buy_${product.id}`, title: 'Buy Now' },
          { id: `cart_${product.id}`, title: 'Add to Cart' },
        ],
      });
    }

    return this.sendMessage(phone, message, {
      type: 'interactive',
      buttons: [
        { id: `buy_${product.id}`, title: 'Buy Now' },
        { id: `cart_${product.id}`, title: 'Add to Cart' },
      ],
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ORDER NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send order confirmation message
   */
  async sendOrderConfirmation(
    phone: string,
    order: {
      orderId: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      currency: string;
      estimatedDelivery?: string;
      trackingNumber?: string;
    },
  ): Promise<MessageReceipt> {
    const items = order.items.map((i) => `• ${i.name} x${i.quantity} - ${order.currency} ${i.price.toFixed(3)}`).join('\n');

    const message = `✅ *Order Confirmed!*\n\nHello ${order.customerName},\n\nYour order *${order.orderId}* has been confirmed.\n\n*Order Summary:*\n${items}\n\n*Total: ${order.currency} ${order.total.toFixed(3)}*\n\n${order.estimatedDelivery ? `📅 Estimated Delivery: ${order.estimatedDelivery}` : ''}\n${order.trackingNumber ? `📍 Tracking: ${order.trackingNumber}` : ''}\n\nThank you for shopping with BHD Oman! 🙏`;

    try {
      // Try template first
      return await this.sendTemplate(phone, 'order_confirmation', 'en', [
        { type: 'body', parameters: [
          { type: 'text', text: order.customerName },
          { type: 'text', text: order.orderId },
          { type: 'text', text: `${order.currency} ${order.total.toFixed(3)}` },
        ]},
      ]);
    } catch {
      return this.sendMessage(phone, message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SHIPPING UPDATES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send shipping/tracking update
   */
  async sendShippingUpdate(
    phone: string,
    trackingNumber: string,
    status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed',
    details?: {
      orderId?: string;
      location?: string;
      estimatedDelivery?: string;
      carrier?: string;
      notes?: string;
    },
  ): Promise<MessageReceipt> {
    const statusEmojis: Record<string, string> = {
      picked_up: '📦',
      in_transit: '🚚',
      out_for_delivery: '🛵',
      delivered: '✅',
      failed: '❌',
    };

    const statusMessages: Record<string, string> = {
      picked_up: 'Your package has been picked up!',
      in_transit: 'Your package is on its way!',
      out_for_delivery: 'Your package is out for delivery!',
      delivered: 'Your package has been delivered!',
      failed: 'There was an issue with your delivery.',
    };

    let message = `${statusEmojis[status]} *Shipping Update*\n\n${statusMessages[status]}\n\n📍 Tracking: *${trackingNumber}*`;

    if (details?.orderId) message += `\n📦 Order: ${details.orderId}`;
    if (details?.location) message += `\n📍 Current Location: ${details.location}`;
    if (details?.estimatedDelivery) message += `\n📅 Estimated: ${details.estimatedDelivery}`;
    if (details?.carrier) message += `\n🚛 Carrier: ${details.carrier}`;
    if (details?.notes) message += `\n📝 ${details.notes}`;

    message += `\n\nTrack your order anytime by sending:\n\`/track ${trackingNumber}\``;

    const buttons = status === 'delivered'
      ? [
          { id: `review_${details?.orderId}`, title: 'Leave Review' },
          { id: 'cmd_support', title: 'Need Help?' },
        ]
      : [
          { id: `track_${trackingNumber}`, title: 'Track' },
          { id: 'cmd_support', title: 'Support' },
        ];

    return this.sendMessage(phone, message, { type: 'interactive', buttons });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT CONFIRMATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send payment confirmation/receipt
   */
  async sendPaymentConfirmation(
    phone: string,
    payment: {
      paymentId: string;
      orderId: string;
      amount: number;
      currency: string;
      method: string;
      status: 'success' | 'pending' | 'failed';
      timestamp: string;
    },
  ): Promise<MessageReceipt> {
    if (payment.status === 'success') {
      const message = `✅ *Payment Received!*\n\nThank you for your payment.\n\n*Payment Details:*\n💳 Amount: ${payment.currency} ${payment.amount.toFixed(3)}\n📦 Order: ${payment.orderId}\n🔢 Payment ID: ${payment.paymentId}\n💳 Method: ${payment.method}\n🕐 Date: ${payment.timestamp}\n\nYour order is now being processed! 📦`;

      return this.sendMessage(phone, message, {
        type: 'interactive',
        buttons: [
          { id: `order_${payment.orderId}`, title: 'View Order' },
          { id: 'cmd_products', title: 'Continue Shopping' },
        ],
      });
    }

    if (payment.status === 'failed') {
      const message = `❌ *Payment Failed*\n\nWe couldn't process your payment of ${payment.currency} ${payment.amount.toFixed(3)} for order ${payment.orderId}.\n\nPlease try again or use a different payment method.\n\nIf you need help, contact support@bhdoman.com`;

      return this.sendMessage(phone, message, {
        type: 'interactive',
        buttons: [
          { id: `retry_payment_${payment.orderId}`, title: 'Retry Payment' },
          { id: 'cmd_support', title: 'Contact Support' },
        ],
      });
    }

    // Pending
    const message = `⏳ *Payment Pending*\n\nYour payment of ${payment.currency} ${payment.amount.toFixed(3)} is being processed.\n\nOrder: ${payment.orderId}\nWe'll notify you once confirmed.`;

    return this.sendMessage(phone, message);
  }

  // ═══════════════════════════════════════════════════════════════
  // INCOMING MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Handle incoming WhatsApp message (from webhook)
   */
  async handleIncomingMessage(
    from: string,
    body: string,
    messageId: string,
    metadata?: {
      profileName?: string;
      userId?: string;
      buttonPayload?: string;
      mediaUrl?: string;
      latitude?: string;
      longitude?: string;
    },
  ): Promise<{ response: string; actions: any[] }> {
    try {
      // Log incoming message
      await this.logMessage(from, messageId, 'inbound', body, 'text');

      // Update user activity
      await this.redis.setex(`${this.redisPrefix}active:${from}`, 86400, new Date().toISOString());

      // Process through bot engine
      const result = await this.botEngine.processIncomingMessage(from, body, {
        userId: metadata?.userId,
        profileName: metadata?.profileName,
        buttonPayload: metadata?.buttonPayload,
        mediaUrl: metadata?.mediaUrl,
      });

      // Send response back via WhatsApp
      const responseMessage = result.session.language === 'ar' && result.response.messageAr
        ? result.response.messageAr
        : result.response.message;

      // Send with appropriate formatting
      if (result.response.buttons && result.response.buttons.length > 0) {
        await this.sendMessage(from, responseMessage, {
          type: 'interactive',
          buttons: result.response.buttons.slice(0, 3),
        });
      } else {
        await this.sendMessage(from, responseMessage);
      }

      return {
        response: responseMessage,
        actions: result.actions,
      };
    } catch (error) {
      this.logger.error(`Failed to handle incoming message: ${error.message}`);

      // Send error response
      const errorMsg = "I'm sorry, I couldn't process your message. Please try again or type /help for assistance.";
      await this.sendMessage(from, errorMsg);

      return { response: errorMsg, actions: [] };
    }
  }

  /**
   * Process a user command
   */
  async processCommand(
    phone: string,
    command: string,
  ): Promise<{ message: string; type: string }> {
    const result = await this.botEngine.processIncomingMessage(phone, command);
    const message =
      result.session.language === 'ar' && result.response.messageAr
        ? result.response.messageAr
        : result.response.message;

    return { message, type: result.response.type };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONVERSATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get conversation history for a phone number
   */
  async getConversationHistory(phone: string): Promise<ConversationMessage[]> {
    return this.botEngine.getConversationHistory(phone);
  }

  /**
   * Get active conversations (for admin dashboard)
   */
  async getActiveConversations(): Promise<
    Array<{
      phone: string;
      lastMessage: string;
      lastActivity: Date;
      messageCount: number;
      status: 'active' | 'idle' | 'closed';
    }>
  > {
    try {
      const activeKeys = await this.redis.keys(`${this.redisPrefix}active:*`);
      const conversations: Array<any> = [];

      for (const key of activeKeys) {
        const phone = key.replace(`${this.redisPrefix}active:`, '');
        const lastActive = await this.redis.get(key);
        const history = await this.botEngine.getConversationHistory(phone);

        if (history.length > 0) {
          const lastMsg = history[0];
          const lastActivity = lastActive ? new Date(lastActive) : new Date();
          const minutesSince = (Date.now() - lastActivity.getTime()) / 60000;

          conversations.push({
            phone,
            lastMessage: lastMsg.content.substring(0, 50),
            lastActivity,
            messageCount: history.length,
            status: minutesSince < 5 ? 'active' : minutesSince < 30 ? 'idle' : 'closed',
          });
        }
      }

      return conversations.sort((a, b) => b.lastActivity - a.lastActivity);
    } catch (error) {
      this.logger.error(`Failed to get active conversations: ${error.message}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * List available message templates (Meta API)
   */
  async listTemplates(): Promise<
    Array<{
      name: string;
      language: string;
      category: string;
      status: string;
      components: any[];
    }>
  > {
    try {
      if (this.config.provider === 'meta') {
        const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates`;

        const response = await firstValueFrom(
          this.httpService.get(url, {
            headers: { Authorization: `Bearer ${this.config.apiToken}` },
          }),
        );

        return (response.data.data || []).map((t: any) => ({
          name: t.name,
          language: t.language,
          category: t.category,
          status: t.status,
          components: t.components || [],
        }));
      }

      // Twilio: return predefined templates
      return [
        { name: 'welcome_message', language: 'en', category: 'UTILITY', status: 'APPROVED', components: [] },
        { name: 'order_confirmation', language: 'en', category: 'UTILITY', status: 'APPROVED', components: [] },
        { name: 'shipping_update', language: 'en', category: 'UTILITY', status: 'APPROVED', components: [] },
      ];
    } catch (error) {
      this.logger.error(`Failed to list templates: ${error.message}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BULK MESSAGING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send bulk messages (for marketing/promotions)
   */
  async sendBulkMessages(
    recipients: Array<{ phone: string; message: string }>,
    options?: { delayMs?: number; templateName?: string },
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    errors: Array<{ phone: string; error: string }>;
  }> {
    const results = { total: recipients.length, sent: 0, failed: 0, errors: [] as Array<{ phone: string; error: string }> };
    const delay = options?.delayMs || 500;

    for (const recipient of recipients) {
      try {
        if (options?.templateName) {
          await this.sendTemplate(recipient.phone, options.templateName);
        } else {
          await this.sendMessage(recipient.phone, recipient.message);
        }
        results.sent++;
        await this.sleep(delay);
      } catch (error) {
        results.failed++;
        results.errors.push({ phone: recipient.phone, error: error.message });
        this.logger.error(`Bulk message failed for ${recipient.phone}: ${error.message}`);
      }
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════
  // HEALTH & STATUS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check WhatsApp service health
   */
  async healthCheck(): Promise<{
    status: string;
    provider: string;
    accountConfigured: boolean;
    apiAccessible: boolean;
  }> {
    let apiAccessible = false;

    try {
      if (this.config.provider === 'twilio') {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}.json`;
        await firstValueFrom(
          this.httpService.get(url, {
            auth: {
              username: this.config.accountSid!,
              password: this.config.authToken!,
            },
          }),
        );
        apiAccessible = true;
      } else {
        const url = `https://graph.facebook.com/${this.config.apiVersion}/me`;
        await firstValueFrom(
          this.httpService.get(url, {
            headers: { Authorization: `Bearer ${this.config.apiToken}` },
          }),
        );
        apiAccessible = true;
      }
    } catch {
      apiAccessible = false;
    }

    const accountConfigured =
      this.config.provider === 'twilio'
        ? !!(this.config.accountSid && this.config.authToken && this.config.fromNumber)
        : !!(this.config.apiToken && this.config.phoneNumberId);

    return {
      status: accountConfigured && apiAccessible ? 'healthy' : 'degraded',
      provider: this.config.provider,
      accountConfigured,
      apiAccessible,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private normalizePhone(phone: string): string {
    // Remove 'whatsapp:' prefix if present
    let normalized = phone.replace(/^whatsapp:/, '');
    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      // Assume Oman number
      normalized = '+968' + normalized.replace(/^0/, '');
    }
    return normalized;
  }

  private async logMessage(
    phone: string,
    messageId: string,
    direction: 'inbound' | 'outbound',
    content: string,
    type: string,
  ): Promise<void> {
    try {
      const logEntry = {
        messageId,
        direction,
        content: content.substring(0, 2000),
        type,
        timestamp: new Date().toISOString(),
      };

      await this.redis.lpush(`${this.redisPrefix}msg:${phone}`, JSON.stringify(logEntry));
      await this.redis.ltrim(`${this.redisPrefix}msg:${phone}`, 0, 199);
    } catch (error) {
      this.logger.warn(`Failed to log message: ${error.message}`);
    }
  }

  private getTemplateFallback(templateName: string, components?: any[]): string {
    const fallbacks: Record<string, string> = {
      welcome_message: 'Welcome to BHD Oman! How can we help you today?',
      order_confirmation: 'Your order has been confirmed! Thank you for shopping with BHD Oman.',
      shipping_update: 'Your order is on the way! Track it anytime on our app or website.',
      order_delivered: 'Your order has been delivered! Enjoy your purchase.',
      payment_received: 'Payment received! Your order is being processed.',
      abandoned_cart: 'You left items in your cart! Complete your order before they sell out.',
      review_request: 'How was your experience? Please leave a review for your recent purchase.',
      support_ticket_update: 'Your support ticket has been updated. Check the app for details.',
      otp_verification: 'Your BHD Oman verification code is: {{1}}. Valid for 10 minutes.',
      price_drop_alert: 'Good news! An item in your wishlist is now on sale!',
    };

    return fallbacks[templateName] || 'Notification from BHD Oman.';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
