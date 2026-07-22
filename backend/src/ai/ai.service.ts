import { Injectable, Logger, BadRequestException, ServiceUnavailableException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { OpenAIService } from './services/openai.service';
import { RecommendationService } from './services/recommendation.service';
import { SmartCartService } from './services/smart-cart.service';
import { SearchService } from './services/search.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { RecommendationRequestDto } from './dto/recommendation-request.dto';
import { SearchRequestDto, TranslateRequestDto, SummarizeRequestDto, ModerateRequestDto } from './dto/search-request.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly rateLimitPrefix = 'ai_ratelimit:';
  private readonly cachePrefix = 'ai_cache:';
  private readonly maxRequestsPerMinute: number;
  private readonly cacheEnabled: boolean;
  private readonly cacheTtl: number;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
    private readonly recommendationService: RecommendationService,
    private readonly smartCartService: SmartCartService,
    private readonly searchService: SearchService,
  ) {
    this.maxRequestsPerMinute = parseInt(
      this.configService.get<string>('AI_RATE_LIMIT_PER_MINUTE') || '60',
      10,
    );
    this.cacheEnabled = this.configService.get<string>('AI_CACHE_ENABLED') !== 'false';
    this.cacheTtl = parseInt(this.configService.get<string>('AI_CACHE_TTL') || '300', 10);
  }

  // ─── Rate Limiting ───────────────────────────────────────────────

  private async checkRateLimit(userId?: string): Promise<boolean> {
    const key = `${this.rateLimitPrefix}${userId || 'anonymous'}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 60);
    }

    return current <= this.maxRequestsPerMinute;
  }

  // ─── Caching ──────────────────────────────────────────────────────

  private async getCached<T>(key: string): Promise<T | null> {
    if (!this.cacheEnabled) return null;

    try {
      const cached = await this.redis.get(`${this.cachePrefix}${key}`);
      if (cached) {
        this.logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Cache read error: ${error.message}`);
    }
    return null;
  }

  private async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.cacheEnabled) return;

    try {
      await this.redis.setex(
        `${this.cachePrefix}${key}`,
        ttl || this.cacheTtl,
        JSON.stringify(value),
      );
    } catch (error) {
      this.logger.warn(`Cache write error: ${error.message}`);
    }
  }

  private generateCacheKey(type: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join('|');
    return `${type}:${Buffer.from(sorted).toString('base64')}`;
  }

  // ─── Chat ─────────────────────────────────────────────────────────

  async chat(
    dto: ChatRequestDto,
    userId?: string,
  ): Promise<{
    content: string;
    suggestions?: any[];
    model?: string;
    tokensUsed?: number;
  }> {
    if (!(await this.checkRateLimit(userId))) {
      throw new HttpException(
        'AI rate limit exceeded. Please try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const cacheKey = this.generateCacheKey('chat', { message: dto.message, userId });
    const cached = await this.getCached<{
      content: string;
      suggestions?: any[];
      model?: string;
      tokensUsed?: number;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.openaiService.chatWithAssistant(dto.message, {
        userId,
        previousMessages: dto.conversationId
          ? await this.getConversationHistory(dto.conversationId)
          : undefined,
      });

      const response = {
        content: result.response,
        suggestions: result.suggestions,
        model: 'gpt-4',
        tokensUsed: 0,
      };

      await this.setCache(cacheKey, response, 60); // Short TTL for chat
      return response;
    } catch (error) {
      this.logger.error(`Chat failed: ${error.message}`);
      return {
        content: this.getFallbackResponse('chat'),
        model: 'fallback',
      };
    }
  }

  // ─── Recommendations ──────────────────────────────────────────────

  async getRecommendations(dto: RecommendationRequestDto) {
    const cacheKey = this.generateCacheKey('rec', {
      userId: dto.userId,
      limit: dto.limit,
      category: dto.category,
    });
    const cached = await this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const recommendations = await this.recommendationService.getRecommendationsForUser(
        dto.userId,
        dto.limit,
        dto.category,
      );

      await this.setCache(cacheKey, recommendations, 300);
      return recommendations;
    } catch (error) {
      this.logger.error(`Recommendations failed: ${error.message}`);
      return this.getFallbackRecommendations(dto.limit, dto.category);
    }
  }

  async getSimilarProducts(productId: string, limit?: number) {
    try {
      return await this.recommendationService.getSimilarProducts(productId, limit);
    } catch (error) {
      this.logger.error(`Similar products failed: ${error.message}`);
      return [];
    }
  }

  async getFrequentlyBoughtTogether(productId: string) {
    try {
      return await this.recommendationService.getFrequentlyBoughtTogether(productId);
    } catch (error) {
      this.logger.error(`Frequently bought together failed: ${error.message}`);
      return [];
    }
  }

  // ─── Smart Cart ───────────────────────────────────────────────────

  async getSmartCartSuggestions(userId: string, items: any[]) {
    try {
      return await this.smartCartService.getSmartSuggestions(items);
    } catch (error) {
      this.logger.error(`Smart cart failed: ${error.message}`);
      return [];
    }
  }

  async predictCartAbandonment(userId: string) {
    try {
      return await this.smartCartService.predictCartAbandonment(userId);
    } catch (error) {
      this.logger.error(`Abandonment prediction failed: ${error.message}`);
      return { riskLevel: 'low' as const, riskScore: 0, factors: [], recommendedActions: [] };
    }
  }

  async suggestCoupon(userId: string, items: any[]) {
    try {
      return await this.smartCartService.suggestCoupon(items, userId);
    } catch (error) {
      this.logger.error(`Coupon suggestion failed: ${error.message}`);
      return null;
    }
  }

  async compareProducts(productIds: string[]) {
    try {
      return await this.smartCartService.compareProducts(productIds);
    } catch (error) {
      this.logger.error(`Product comparison failed: ${error.message}`);
      return { products: [], comparison: 'Comparison unavailable', winner: '', prosCons: [] };
    }
  }

  // ─── Search ───────────────────────────────────────────────────────

  async semanticSearch(dto: SearchRequestDto) {
    const cacheKey = this.generateCacheKey('search', {
      query: dto.query,
      filters: dto.filters,
      userId: dto.userId,
    });
    const cached = await this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.searchService.semanticSearch(dto.query, {
        limit: dto.limit,
        category: dto.filters?.category,
        minPrice: dto.filters?.minPrice,
        maxPrice: dto.filters?.maxPrice,
        userId: dto.userId,
      });

      await this.setCache(cacheKey, result, 120);
      return result;
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      return { results: [], processingTime: 0 };
    }
  }

  async getSearchSuggestions(query: string) {
    try {
      return await this.searchService.getSearchSuggestions(query);
    } catch (error) {
      this.logger.error(`Search suggestions failed: ${error.message}`);
      return [];
    }
  }

  async getPopularSearches(limit?: number) {
    try {
      return await this.searchService.getPopularSearches(limit);
    } catch (error) {
      this.logger.error(`Popular searches failed: ${error.message}`);
      return [];
    }
  }

  // ─── Translation ──────────────────────────────────────────────────

  async translate(dto: TranslateRequestDto) {
    const cacheKey = this.generateCacheKey('translate', {
      text: dto.text.substring(0, 100),
      from: dto.fromLang,
      to: dto.toLang,
    });
    const cached = await this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.openaiService.translateText(dto.text, dto.fromLang, dto.toLang);
      await this.setCache(cacheKey, result, 3600); // Longer TTL for translations
      return result;
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`);
      return { translatedText: dto.text, fromLang: dto.fromLang, toLang: dto.toLang };
    }
  }

  // ─── Summarization ────────────────────────────────────────────────

  async summarize(dto: SummarizeRequestDto) {
    try {
      return {
        summary: await this.openaiService.summarizeText(dto.text, dto.maxLength),
        originalLength: dto.text.length,
      };
    } catch (error) {
      this.logger.error(`Summarization failed: ${error.message}`);
      return {
        summary: dto.text.length > 200 ? dto.text.substring(0, 200) + '...' : dto.text,
        originalLength: dto.text.length,
      };
    }
  }

  // ─── Moderation ───────────────────────────────────────────────────

  async moderate(dto: ModerateRequestDto) {
    try {
      const result = await this.openaiService.moderateContent(dto.text);
      return {
        ...result,
        contentType: dto.contentType,
      };
    } catch (error) {
      this.logger.error(`Moderation failed: ${error.message}`);
      return { isSafe: true, categories: {}, scores: {}, flagged: false };
    }
  }

  // ─── Product Description Generation ───────────────────────────────

  async generateProductDescription(productData: {
    name: string;
    category: string;
    brand?: string;
    features?: string[];
    specifications?: Record<string, string>;
    targetAudience?: string;
    price?: number;
    currency?: string;
  }) {
    const cacheKey = this.generateCacheKey('desc', { name: productData.name, brand: productData.brand });
    const cached = await this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.openaiService.generateProductDescription(productData);
      await this.setCache(cacheKey, result, 86400);
      return result;
    } catch (error) {
      this.logger.error(`Description generation failed: ${error.message}`);
      return {
        description: productData.name,
        seoTitle: productData.name,
        metaDescription: '',
        keywords: [],
        bulletPoints: productData.features || [],
      };
    }
  }

  // ─── Sentiment Analysis ───────────────────────────────────────────

  async analyzeSentiment(text: string) {
    try {
      return await this.openaiService.analyzeSentiment(text);
    } catch (error) {
      this.logger.error(`Sentiment analysis failed: ${error.message}`);
      return {
        sentiment: 'neutral' as const,
        score: 0,
        emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, trust: 0 },
        summary: '',
      };
    }
  }

  // ─── Search Analytics ─────────────────────────────────────────────

  async getSearchAnalytics(period?: 'day' | 'week' | 'month') {
    try {
      return await this.searchService.getSearchAnalytics(period);
    } catch (error) {
      this.logger.error(`Search analytics failed: ${error.message}`);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        avgResultsPerSearch: 0,
        topQueries: [],
        zeroResultQueries: [],
        avgLatency: 0,
      };
    }
  }

  // ─── Template Generation ──────────────────────────────────────────

  async generateTemplate(
    type: 'order_confirmation' | 'shipping_update' | 'password_reset' | 'welcome' | 'abandoned_cart' | 'review_request' | 'support_reply',
    data: Record<string, any>,
  ) {
    try {
      return await this.openaiService.generateResponseTemplate(type, data);
    } catch (error) {
      this.logger.error(`Template generation failed: ${error.message}`);
      return {
        subject: 'BHD Oman Notification',
        body: `<p>Dear Customer,</p><p>Please check your account for updates.</p>`,
        smsText: 'BHD Oman: Please check your account.',
        whatsappText: 'Hello from BHD Oman! Please check your account for updates.',
      };
    }
  }

  // ─── Health Check ─────────────────────────────────────────────────

  async healthCheck() {
    const checks: Record<string, 'healthy' | 'unhealthy' | 'disabled'> = {};

    // Check OpenAI — configured key required; do not probe live API here
    try {
      checks.openai = this.openaiService.isConfigured() ? 'healthy' : 'disabled';
    } catch {
      checks.openai = 'unhealthy';
    }

    // Check Redis
    try {
      await this.redis.ping();
      checks.redis = 'healthy';
    } catch {
      checks.redis = 'unhealthy';
    }

    const criticalOk = checks.redis === 'healthy';
    const openaiOk = checks.openai === 'healthy' || checks.openai === 'disabled';

    return {
      status: criticalOk && openaiOk
        ? checks.openai === 'disabled'
          ? 'degraded'
          : 'healthy'
        : 'degraded',
      checks,
      openaiConfigured: this.openaiService.isConfigured(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private async getConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const history = await this.redis.lrange(`conversation:${conversationId}`, 0, 19);
      return history.map((h) => JSON.parse(h));
    } catch {
      return [];
    }
  }

  private getFallbackResponse(type: string): string {
    const fallbacks: Record<string, string> = {
      chat: "I apologize, but I'm experiencing high demand right now. Please try again shortly or contact support@bhdoman.com for assistance.",
      recommendation: 'Unable to generate recommendations at this time.',
      search: 'Search service temporarily unavailable. Please try a different query.',
    };
    return fallbacks[type] || 'Service temporarily unavailable. Please try again later.';
  }

  private getFallbackRecommendations(limit: number, category?: string): any[] {
    // Return empty but structured response
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      productId: `fallback-${i}`,
      name: 'Recommended Product',
      price: 0,
      currency: 'OMR',
      category: category || 'general',
      store: 'BHD Marketplace',
      score: 0,
      reason: 'Popular choice',
      algorithm: 'trending',
    }));
  }
}
