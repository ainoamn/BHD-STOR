import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppGateway } from './whatsapp.gateway';
import { BotEngine } from './bot/BotEngine';
import { OpenAIService } from '../ai/services/openai.service';
import { SearchService } from '../ai/services/search.service';
import { AiModule } from '../ai/ai.module';

/**
 * WhatsApp Module for BHD Oman E-Commerce Marketplace
 *
 * Provides:
 * - WhatsApp Business API integration (Twilio & Meta)
 * - Bot engine with NLP and command routing
 * - Real-time WebSocket gateway for admin live chat
 * - Webhook handlers for incoming messages
 * - Template message management
 * - Conversation tracking and analytics
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    RedisModule,
    // Import AiModule for OpenAI and Search services
    forwardRef(() => AiModule),
  ],
  controllers: [WhatsAppController],
  providers: [
    // Core WhatsApp service
    WhatsAppService,
    // Bot engine for processing messages
    BotEngine,
    // WebSocket gateway for real-time admin chat
    WhatsAppGateway,
    // AI services (also provided by AiModule, but registered here for standalone use)
    OpenAIService,
    SearchService,
  ],
  exports: [
    WhatsAppService,
    BotEngine,
    WhatsAppGateway,
  ],
})
export class WhatsAppModule {}
