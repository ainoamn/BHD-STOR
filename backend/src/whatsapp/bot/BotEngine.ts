import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { OpenAIService } from '../../ai/services/openai.service';
import { SearchService } from '../../ai/services/search.service';
import {
  COMMANDS,
  QUICK_REPLIES,
  Command,
  CommandContext,
  CommandResponse,
  findCommand,
  getWelcomeMessage,
} from './Commands';

export interface BotSession {
  phone: string;
  userId?: string;
  profileName?: string;
  language: 'en' | 'ar';
  conversationId: string;
  state: 'idle' | 'awaiting_input' | 'browsing' | 'checkout' | 'support';
  context: Record<string, any>;
  lastCommand?: string;
  lastInteraction: Date;
  messageCount: number;
}

export interface ProcessedMessage {
  response: CommandResponse;
  session: BotSession;
  actions: Array<{ type: string; payload: any }>;
}

@Injectable()
export class BotEngine {
  private readonly logger = new Logger(BotEngine.name);
  private readonly sessionPrefix = 'wa_session:';
  private readonly sessionTtl = 1800; // 30 minutes

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly openaiService: OpenAIService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Main message processing pipeline
   */
  async processIncomingMessage(
    phone: string,
    message: string,
    metadata?: {
      userId?: string;
      profileName?: string;
      buttonPayload?: string;
      mediaUrl?: string;
    },
  ): Promise<ProcessedMessage> {
    const startTime = Date.now();

    try {
      // 1. Get or create session
      const session = await this.getOrCreateSession(phone, metadata);

      // 2. Parse message intent
      const parsed = await this.parseIntent(message, session);

      // 3. Route to handler
      let response: CommandResponse;

      if (parsed.command) {
        // Explicit command matched
        response = await this.executeCommand(parsed.command, parsed.args, session);
      } else if (parsed.isNaturalLanguage) {
        // Natural language query - use AI
        response = await this.handleNaturalLanguage(message, session);
      } else if (session.state === 'awaiting_input' && session.context.awaiting) {
        // Continue previous flow
        response = await this.continueFlow(message, session);
      } else {
        // Default: try AI interpretation
        response = await this.handleNaturalLanguage(message, session);
      }

      // 4. Update session
      session.lastCommand = parsed.command?.name || session.lastCommand;
      session.lastInteraction = new Date();
      session.messageCount++;
      await this.saveSession(session);

      // 5. Log conversation
      await this.logConversation(phone, 'inbound', message);
      await this.logConversation(phone, 'outbound', response.message);

      const processingTime = Date.now() - startTime;
      this.logger.debug(`Message processed in ${processingTime}ms for ${phone}`);

      return {
        response,
        session,
        actions: response.actions || [],
      };
    } catch (error) {
      this.logger.error(`Message processing failed: ${error.message}`, error.stack);
      return {
        response: this.getErrorResponse(),
        session: await this.getOrCreateSession(phone, metadata),
        actions: [],
      };
    }
  }

  /**
   * Parse user intent from message
   */
  private async parseIntent(
    message: string,
    session: BotSession,
  ): Promise<{
    command?: Command;
    args: string[];
    isNaturalLanguage: boolean;
  }> {
    const trimmed = message.trim();

    // Check for button payload first (from interactive messages)
    if (QUICK_REPLIES[trimmed]) {
      const qr = QUICK_REPLIES[trimmed];
      const cmd = COMMANDS[qr.command];
      if (cmd) {
        return { command: cmd, args: qr.args, isNaturalLanguage: false };
      }
    }

    // Check for explicit command
    const found = findCommand(trimmed);
    if (found) {
      return { command: found.command, args: found.args, isNaturalLanguage: false };
    }

    // Check for common keywords that map to commands
    const keywordMap: Record<string, { command: string; args: string[] }> = {
      hi: { command: 'start', args: [] },
      hello: { command: 'start', args: [] },
      hey: { command: 'start', args: [] },
      مرحبا: { command: 'start', args: [] },
      أهلا: { command: 'start', args: [] },
      السلام: { command: 'start', args: [] },
      مساعدة: { command: 'help', args: [] },
      help: { command: 'help', args: [] },
      orders: { command: 'order', args: [] },
      طلبات: { command: 'order', args: [] },
      سلة: { command: 'cart', args: [] },
      cart: { command: 'cart', args: [] },
      دعم: { command: 'support', args: [] },
      support: { command: 'support', args: [] },
      متاجر: { command: 'stores', args: [] },
      stores: { command: 'stores', args: [] },
    };

    const lowerMsg = trimmed.toLowerCase();
    for (const [keyword, mapping] of Object.entries(keywordMap)) {
      if (lowerMsg === keyword || lowerMsg.startsWith(keyword + ' ')) {
        const cmd = COMMANDS[mapping.command];
        if (cmd) {
          const extraArgs = trimmed.slice(keyword.length).trim().split(' ').filter(Boolean);
          return { command: cmd, args: [...mapping.args, ...extraArgs], isNaturalLanguage: false };
        }
      }
    }

    // Check if it looks like an order ID or tracking number
    if (/^(ORD|ord)[-\s]?\d+/i.test(trimmed)) {
      const orderId = trimmed.match(/(ORD[-\s]?\d+)/i)?.[1] || trimmed;
      return {
        command: COMMANDS.order,
        args: [orderId],
        isNaturalLanguage: false,
      };
    }

    if (/^(TRK|trk|TR|tr)[-\s]?\d+/i.test(trimmed)) {
      const trackingNumber = trimmed.match(/(TRK?[-\s]?\d+)/i)?.[1] || trimmed;
      return {
        command: COMMANDS.track,
        args: [trackingNumber],
        isNaturalLanguage: false,
      };
    }

    // Treat as natural language
    return { args: [], isNaturalLanguage: true };
  }

  /**
   * Execute a command with given arguments
   */
  private async executeCommand(
    command: Command,
    args: string[],
    session: BotSession,
  ): Promise<CommandResponse> {
    try {
      const ctx: CommandContext = {
        userId: session.userId,
        phone: session.phone,
        profileName: session.profileName,
        language: session.language,
        conversationId: session.conversationId,
        previousCommand: session.lastCommand,
        userState: session.context,
      };

      const response = await command.handler(args, ctx);

      // Update session state based on response
      if (response.nextCommand) {
        session.state = 'awaiting_input';
        session.context.awaiting = response.nextCommand;
      } else {
        session.state = 'idle';
        delete session.context.awaiting;
      }

      return response;
    } catch (error) {
      this.logger.error(`Command execution failed: ${error.message}`);
      return this.getErrorResponse(session.language);
    }
  }

  /**
   * Handle natural language queries using AI
   */
  private async handleNaturalLanguage(
    message: string,
    session: BotSession,
  ): Promise<CommandResponse> {
    try {
      // First, try to detect if it's a product search
      const searchKeywords = [
        'looking for',
        'find',
        'search',
        'buy',
        'price of',
        'where can i get',
        'do you have',
        ' أبحث عن',
        'ابحث',
        'سعر',
        'أريد',
        'wanna buy',
        'need',
        'want',
      ];

      const isProductSearch = searchKeywords.some((kw) =>
        message.toLowerCase().includes(kw.toLowerCase()),
      );

      if (isProductSearch) {
        // Extract search query
        const cleanedQuery = message
          .replace(new RegExp(searchKeywords.join('|'), 'gi'), '')
          .replace(/[?.,!]/g, '')
          .trim();

        if (cleanedQuery.length > 2) {
          // Perform semantic search
          const searchResults = await this.searchService.semanticSearch(cleanedQuery, {
            limit: 5,
            userId: session.userId,
          });

          if (searchResults.results.length > 0) {
            const products = searchResults.results.slice(0, 5);
            const productList = products
              .map(
                (p, i) =>
                  `${i + 1}. *${p.name}* - OMR ${p.price.toFixed(3)}\n   ${p.store} ⭐ ${p.relevanceScore.toFixed(2)}`,
              )
              .join('\n\n');

            const msg =
              session.language === 'ar'
                ? `🔍 *نتائج البحث عن "${cleanedQuery}"*\n\n${productList}\n\nاكتب رقم المنتج للمزيد من التفاصيل، أو "شراء [الرقم]" للشراء.`
                : `🔍 *Search results for "${cleanedQuery}"*\n\n${productList}\n\nReply with a product number for details, or "buy [number]" to purchase.`;

            return {
              message: msg,
              type: 'product_list',
              products: products.map((p) => ({
                id: p.productId,
                name: p.name,
                price: p.price,
                store: p.store,
              })),
              buttons: [
                { id: 'cmd_cart', title: session.language === 'ar' ? '🛒 السلة' : '🛒 Cart' },
                { id: 'cmd_checkout', title: session.language === 'ar' ? '💳 الدفع' : '💳 Checkout' },
              ],
            };
          }
        }
      }

      // Use AI assistant for general queries
      const aiResponse = await this.openaiService.chatWithAssistant(message, {
        userId: session.userId,
        userName: session.profileName,
      });

      const msg =
        session.language === 'ar'
          ? aiResponse.response + '\n\nهل تحتاج مساعدة في شيء آخر؟'
          : aiResponse.response + '\n\nCan I help you with anything else?';

      return {
        message: msg,
        type: 'interactive',
        buttons: [
          { id: 'cmd_products', title: '🛍️ Products' },
          { id: 'cmd_order', title: '📦 Orders' },
          { id: 'cmd_support', title: '❓ Support' },
        ],
      };
    } catch (error) {
      this.logger.error(`Natural language handling failed: ${error.message}`);
      return this.getErrorResponse(session.language);
    }
  }

  /**
   * Continue a multi-step conversation flow
   */
  private async continueFlow(
    message: string,
    session: BotSession,
  ): Promise<CommandResponse> {
    const awaiting = session.context.awaiting;

    switch (awaiting) {
      case 'track': {
        // User provided tracking number
        const trackingNumber = message.trim();
        return {
          message: `📍 Tracking shipment *${trackingNumber}*...`,
          type: 'order_status',
          actions: [{ type: 'track_shipment', payload: { trackingNumber, userId: session.userId } }],
        };
      }

      case 'products': {
        // User selected a product number or provided more search terms
        const selection = parseInt(message.trim());
        if (!isNaN(selection) && session.context.lastProducts) {
          const product = session.context.lastProducts[selection - 1];
          if (product) {
            return {
              message: `*${product.name}*\n💰 OMR ${product.price.toFixed(3)}\n🏪 ${product.store}\n\nWould you like to add this to your cart?`,
              type: 'interactive',
              buttons: [
                { id: `add_cart_${product.id}`, title: '🛒 Add to Cart' },
                { id: 'cmd_products', title: '🔙 More Products' },
                { id: 'cmd_checkout', title: '💳 Checkout' },
              ],
              actions: [{ type: 'add_to_cart', payload: { productId: product.id, userId: session.userId } }],
            };
          }
        }
        // Treat as new search
        return this.handleNaturalLanguage(message, session);
      }

      case 'support': {
        // User provided support message
        return {
          message: `✅ *Support ticket created!*\n\nYour message: "${message}"\n\nWe've forwarded this to our support team. Reference: *SUP-${Date.now().toString(36).toUpperCase()}*\n\n_For urgent matters, call: +968 1234 5678_`,
          type: 'text',
          actions: [
            {
              type: 'create_support_ticket',
              payload: { message, userId: session.userId, phone: session.phone },
            },
          ],
        };
      }

      default:
        return this.handleNaturalLanguage(message, session);
    }
  }

  /**
   * Get or create a user session
   */
  private async getOrCreateSession(
    phone: string,
    metadata?: {
      userId?: string;
      profileName?: string;
    },
  ): Promise<BotSession> {
    const key = `${this.sessionPrefix}${phone}`;

    try {
      const stored = await this.redis.get(key);

      if (stored) {
        const session: BotSession = JSON.parse(stored);
        // Update metadata
        if (metadata?.userId) session.userId = metadata.userId;
        if (metadata?.profileName) session.profileName = metadata.profileName;
        return session;
      }
    } catch (error) {
      this.logger.warn(`Failed to parse session for ${phone}: ${error.message}`);
    }

    // Create new session
    const newSession: BotSession = {
      phone,
      userId: metadata?.userId,
      profileName: metadata?.profileName,
      language: 'en',
      conversationId: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      state: 'idle',
      context: {},
      lastInteraction: new Date(),
      messageCount: 0,
    };

    await this.saveSession(newSession);
    return newSession;
  }

  /**
   * Save session to Redis
   */
  private async saveSession(session: BotSession): Promise<void> {
    const key = `${this.sessionPrefix}${session.phone}`;
    await this.redis.setex(key, this.sessionTtl, JSON.stringify(session));
  }

  /**
   * Log conversation for history
   */
  private async logConversation(
    phone: string,
    direction: 'inbound' | 'outbound',
    content: string,
  ): Promise<void> {
    try {
      const logEntry = {
        direction,
        content: content.substring(0, 1000), // Limit log size
        timestamp: new Date().toISOString(),
      };

      await this.redis.lpush(`${this.sessionPrefix}${phone}:history`, JSON.stringify(logEntry));
      await this.redis.ltrim(`${this.sessionPrefix}${phone}:history`, 0, 99);
    } catch (error) {
      this.logger.warn(`Failed to log conversation: ${error.message}`);
    }
  }

  /**
   * Get conversation history for a phone number
   */
  async getConversationHistory(phone: string): Promise<Array<{ direction: string; content: string; timestamp: string }>> {
    try {
      const history = await this.redis.lrange(`${this.sessionPrefix}${phone}:history`, 0, -1);
      return history.map((h) => JSON.parse(h));
    } catch (error) {
      this.logger.error(`Failed to get conversation history: ${error.message}`);
      return [];
    }
  }

  /**
   * Get active sessions count (for monitoring)
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      return keys.filter((k) => !k.endsWith(':history')).length;
    } catch {
      return 0;
    }
  }

  /**
   * End a session
   */
  async endSession(phone: string): Promise<void> {
    await this.redis.del(`${this.sessionPrefix}${phone}`);
    await this.redis.del(`${this.sessionPrefix}${phone}:history`);
  }

  /**
   * Reset session to initial state
   */
  async resetSession(phone: string): Promise<void> {
    const key = `${this.sessionPrefix}${phone}`;
    const stored = await this.redis.get(key);

    if (stored) {
      const session: BotSession = JSON.parse(stored);
      session.state = 'idle';
      session.context = {};
      session.lastCommand = undefined;
      await this.saveSession(session);
    }
  }

  /**
   * Get error response in appropriate language
   */
  private getErrorResponse(language: 'en' | 'ar' = 'en'): CommandResponse {
    if (language === 'ar') {
      return {
        message:
          'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.',
        type: 'text',
      };
    }

    return {
      message:
        "I apologize, something went wrong. Please try again or contact our support team at support@bhdoman.com or call +968 1234 5678.",
      type: 'text',
    };
  }
}
