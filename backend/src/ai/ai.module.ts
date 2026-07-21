import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIService } from './services/openai.service';
import { RecommendationService } from './services/recommendation.service';
import { SmartCartService } from './services/smart-cart.service';
import { SearchService } from './services/search.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    RedisModule,
    ThrottlerModule.forRoot([
      {
        name: 'ai',
        ttl: 60000, // 1 minute
        limit: 60,  // 60 requests per minute
      },
    ]),
  ],
  controllers: [AiController],
  providers: [
    // Main AI service
    AiService,
    // Sub-services
    OpenAIService,
    RecommendationService,
    SmartCartService,
    SearchService,
  ],
  exports: [
    AiService,
    OpenAIService,
    RecommendationService,
    SmartCartService,
    SearchService,
  ],
})
export class AiModule {}
