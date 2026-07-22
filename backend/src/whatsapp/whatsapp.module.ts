import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppGateway } from './whatsapp.gateway';
import { BotEngine } from './bot/BotEngine';
import { WhatsAppCommerceResolver } from './bot/WhatsAppCommerceResolver';
import { OpenAIService } from '../ai/services/openai.service';
import { SearchService } from '../ai/services/search.service';
import { AiModule } from '../ai/ai.module';
import { OrdersModule } from '../orders/orders.module';
import { LogisticsModule } from '../logistics/logistics.module';

/**
 * WhatsApp Module for BHD Oman E-Commerce Marketplace
 *
 * Provides:
 * - WhatsApp Business API integration (Twilio & Meta)
 * - Bot engine with NLP and command routing
 * - Live /order and /track against orders + logistics
 * - Real-time WebSocket gateway for admin live chat
 * - Webhook handlers for incoming messages
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    RedisModule,
    forwardRef(() => AiModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => LogisticsModule),
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    BotEngine,
    WhatsAppCommerceResolver,
    WhatsAppGateway,
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
