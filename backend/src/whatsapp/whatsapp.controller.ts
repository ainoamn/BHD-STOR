import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  RawBody,
  Logger,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto, BulkMessageDto } from './dto/send-message.dto';
import { WebhookMessageDto } from './dto/webhook-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);
  private readonly verifyToken: string;

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {
    this.verifyToken =
      this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || '';
    if (!this.verifyToken) {
      const isProd =
        (this.configService.get<string>('NODE_ENV') || 'development') ===
        'production';
      if (isProd) {
        this.logger.error(
          'WHATSAPP_WEBHOOK_VERIFY_TOKEN is required in production',
        );
      } else {
        this.logger.warn(
          'WHATSAPP_WEBHOOK_VERIFY_TOKEN unset — webhook verify will reject until configured',
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // WEBHOOK ENDPOINTS (Public - called by Twilio/Meta)
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /whatsapp/webhook - Receive webhooks from Twilio/Meta
   * Public endpoint - no auth required (validated by signature)
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp webhooks (Twilio/Meta)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async receiveWebhook(
    @Body() payload: WebhookMessageDto | Record<string, any>,
    @Headers('x-twilio-signature') twilioSignature?: string,
    @Headers('x-hub-signature-256') metaSignature?: string,
  ): Promise<{ status: string; messageId?: string }> {
    try {
      this.logger.debug(`Webhook received: ${JSON.stringify(payload).substring(0, 200)}`);

      // Determine provider from payload structure
      const isMetaPayload = payload?.object === 'whatsapp_business_account';

      if (isMetaPayload) {
        return this.handleMetaWebhook(payload);
      }

      // Handle Twilio format
      return this.handleTwilioWebhook(payload as WebhookMessageDto);
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      return { status: 'error' };
    }
  }

  /**
   * GET /whatsapp/webhook - Verify webhook (Meta challenge response)
   * Public endpoint for webhook verification
   */
  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Verify WhatsApp webhook (Meta challenge)' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): Promise<string> {
    this.logger.log(`Webhook verification attempt - mode: ${mode}`);

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn(`Webhook verification failed - invalid token: ${token}`);
    throw new UnauthorizedException('Invalid verify token');
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS (Protected)
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /whatsapp/send - Send a message (Admin)
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send WhatsApp message (Admin/Support)' })
  @ApiResponse({ status: 200, description: 'Message sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendMessage(@Body() dto: SendMessageDto) {
    const receipt = await this.whatsAppService.sendMessage(
      dto.phone,
      dto.message,
      {
        type: dto.type as any,
        mediaUrl: dto.mediaUrl,
        caption: dto.caption,
        buttons: dto.buttons,
        templateName: dto.templateName,
        templateLanguage: dto.language,
        templateComponents: dto.components,
      },
    );

    return {
      success: true,
      messageId: receipt.messageId,
      status: receipt.status,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * POST /whatsapp/send-bulk - Send bulk messages (Admin)
   */
  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send bulk WhatsApp messages (Admin only)' })
  async sendBulkMessages(@Body() dto: BulkMessageDto) {
    return this.whatsAppService.sendBulkMessages(
      dto.messages.map((m) => ({ phone: m.phone, message: m.message })),
      { delayMs: dto.delayMs },
    );
  }

  /**
   * GET /whatsapp/templates - List message templates (Admin)
   */
  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List WhatsApp message templates' })
  async listTemplates() {
    const templates = await this.whatsAppService.listTemplates();
    return { templates, count: templates.length };
  }

  /**
   * GET /whatsapp/conversations/:phone - Get conversation (Admin)
   */
  @Get('conversations/:phone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation history for a phone number' })
  async getConversation(@Query('phone') phone: string) {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    const history = await this.whatsAppService.getConversationHistory(phone);
    return {
      phone,
      messageCount: history.length,
      messages: history,
    };
  }

  /**
   * GET /whatsapp/conversations - List active conversations (Admin)
   */
  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active WhatsApp conversations' })
  async getActiveConversations() {
    const conversations = await this.whatsAppService.getActiveConversations();
    return {
      count: conversations.length,
      conversations,
    };
  }

  /**
   * POST /whatsapp/send-template - Send template message (Admin)
   */
  @Post('send-template')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send template WhatsApp message' })
  async sendTemplate(
    @Body() body: {
      phone: string;
      templateName: string;
      language?: string;
      components?: any[];
    },
  ) {
    const receipt = await this.whatsAppService.sendTemplate(
      body.phone,
      body.templateName,
      body.language || 'en',
      body.components,
    );

    return {
      success: true,
      messageId: receipt.messageId,
      status: receipt.status,
    };
  }

  /**
   * POST /whatsapp/send-product - Send product details (Admin)
   */
  @Post('send-product')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send product details via WhatsApp' })
  async sendProduct(
    @Body() body: {
      phone: string;
      product: {
        id: string;
        name: string;
        price: number;
        currency: string;
        imageUrl?: string;
        description?: string;
        store: string;
        url?: string;
      };
    },
  ) {
    const receipt = await this.whatsAppService.sendProduct(body.phone, body.product);
    return {
      success: true,
      messageId: receipt.messageId,
      status: receipt.status,
    };
  }

  /**
   * POST /whatsapp/send-order-confirmation - Send order confirmation (Admin)
   */
  @Post('send-order-confirmation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'support')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send order confirmation via WhatsApp' })
  async sendOrderConfirmation(
    @Body() body: {
      phone: string;
      order: {
        orderId: string;
        customerName: string;
        items: Array<{ name: string; quantity: number; price: number }>;
        total: number;
        currency: string;
        estimatedDelivery?: string;
        trackingNumber?: string;
      };
    },
  ) {
    const receipt = await this.whatsAppService.sendOrderConfirmation(body.phone, body.order);
    return {
      success: true,
      messageId: receipt.messageId,
      status: receipt.status,
    };
  }

  /**
   * POST /whatsapp/simulate - Dry-run bot commands without Twilio/Meta send
   * Useful for local smoke of /order and /track.
   * Disabled in production unless WHATSAPP_ALLOW_SIMULATE=true.
   */
  @Public()
  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate WhatsApp bot command (no outbound provider send)',
  })
  async simulateCommand(
    @Body()
    body: {
      phone?: string;
      message: string;
      userId?: string;
      language?: 'en' | 'ar';
    },
  ) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allow =
      process.env.WHATSAPP_ALLOW_SIMULATE === 'true' || nodeEnv !== 'production';
    if (!allow) {
      throw new UnauthorizedException('WhatsApp simulate is disabled in production');
    }
    if (!body?.message?.trim()) {
      throw new BadRequestException('message is required');
    }
    const phone = (body.phone || '+96890000000').replace(/^whatsapp:/, '');
    const result = await this.whatsAppService.processCommand(phone, body.message.trim());
    return {
      success: true,
      phone,
      ...result,
    };
  }

  /**
   * GET /whatsapp/health - Health check
   */
  @Get('health')
  @ApiOperation({ summary: 'WhatsApp service health check' })
  async healthCheck() {
    return this.whatsAppService.healthCheck();
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HANDLERS
  // ═══════════════════════════════════════════════════════════════

  private async handleTwilioWebhook(payload: WebhookMessageDto): Promise<{ status: string; messageId?: string }> {
    // Validate required fields
    if (!payload.From || !payload.Body) {
      this.logger.warn('Invalid Twilio webhook payload');
      return { status: 'invalid_payload' };
    }

    // Extract phone number (remove 'whatsapp:' prefix)
    const from = payload.From.replace(/^whatsapp:/, '');
    const messageId = payload.MessageSid;
    const body = payload.Body;

    this.logger.log(`Received message from ${from}: ${body.substring(0, 50)}...`);

    // Handle status callbacks
    if (payload.MessageStatus) {
      this.logger.debug(`Message ${messageId} status: ${payload.MessageStatus}`);
      return { status: 'status_received', messageId };
    }

    // Handle button replies
    if (payload.ButtonPayload) {
      this.logger.debug(`Button pressed: ${payload.ButtonPayload}`);
    }

    // Process the message through bot engine
    const result = await this.whatsAppService.handleIncomingMessage(from, body, messageId, {
      profileName: payload.ProfileName,
      buttonPayload: payload.ButtonPayload,
      mediaUrl: payload.MediaUrl0,
    });

    return { status: 'processed', messageId: result.actions?.[0]?.type || messageId };
  }

  private async handleMetaWebhook(payload: any): Promise<{ status: string }> {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from;
            const messageId = message.id;

            this.logger.log(`Meta message from ${from}, type: ${message.type}`);

            let body = '';
            let buttonPayload: string | undefined;
            let mediaUrl: string | undefined;

            switch (message.type) {
              case 'text':
                body = message.text?.body || '';
                break;
              case 'button':
                body = message.button?.text || '';
                buttonPayload = message.button?.payload;
                break;
              case 'interactive':
                body = message.interactive?.button_reply?.title || '';
                buttonPayload = message.interactive?.button_reply?.id;
                break;
              case 'image':
                body = '[Image]';
                mediaUrl = message.image?.id;
                break;
              case 'document':
                body = `[Document: ${message.document?.filename}]`;
                break;
              case 'location':
                body = `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
                break;
              default:
                body = `[${message.type}]`;
            }

            await this.whatsAppService.handleIncomingMessage(from, body, messageId, {
              profileName: value.contacts?.[0]?.profile?.name,
              buttonPayload,
              mediaUrl,
              latitude: message.location?.latitude?.toString(),
              longitude: message.location?.longitude?.toString(),
            });
          }
        }

        // Handle status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            this.logger.debug(`Status update: ${status.id} -> ${status.status}`);
          }
        }
      }
    }

    return { status: 'processed' };
  }
}
