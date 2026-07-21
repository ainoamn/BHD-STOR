import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat-request.dto';
import {
  RecommendationRequestDto,
  RecommendationResponseDto,
} from './dto/recommendation-request.dto';
import {
  SearchRequestDto,
  SearchResponseDto,
  TranslateRequestDto,
  SummarizeRequestDto,
  ModerateRequestDto,
} from './dto/search-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Services')
@Controller('ai')
@UseInterceptors(TransformInterceptor)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * AI Assistant Chat - Conversational AI for customer support
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle(20, 60) // 20 requests per minute
  @ApiOperation({ summary: 'Chat with BHD AI Assistant' })
  @ApiResponse({
    status: 200,
    description: 'AI response generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async chat(
    @Body() dto: ChatRequestDto,
    @CurrentUser('id') userId?: string,
  ): Promise<ChatResponseDto> {
    this.logger.debug(`Chat request from user ${userId || 'anonymous'}: ${dto.message.substring(0, 50)}...`);

    const startTime = Date.now();
    const response = await this.aiService.chat(dto, userId);

    return {
      response: response.content,
      conversationId: dto.conversationId || `conv-${Date.now()}`,
      suggestions: response.suggestions || [],
      metadata: {
        model: response.model || 'gpt-4',
        tokensUsed: response.tokensUsed || 0,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Get Personalized Product Recommendations
   */
  @Post('recommendations')
  @HttpCode(HttpStatus.OK)
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Get AI-powered product recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Recommendations generated',
    type: RecommendationResponseDto,
  })
  async getRecommendations(
    @Body() dto: RecommendationRequestDto,
  ): Promise<RecommendationResponseDto> {
    const startTime = Date.now();
    const recommendations = await this.aiService.getRecommendations(dto);

    return {
      userId: dto.userId,
      products: recommendations,
      algorithm: 'hybrid',
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Get Similar Products (Content-based)
   */
  @Post('recommendations/similar')
  @HttpCode(HttpStatus.OK)
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Get similar products' })
  async getSimilarProducts(
    @Body('productId') productId: string,
    @Body('limit') limit?: number,
  ) {
    return this.aiService.getSimilarProducts(productId, limit);
  }

  /**
   * Get Frequently Bought Together
   */
  @Post('recommendations/bought-together')
  @HttpCode(HttpStatus.OK)
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Get frequently bought together products' })
  async getFrequentlyBoughtTogether(@Body('productId') productId: string) {
    return this.aiService.getFrequentlyBoughtTogether(productId);
  }

  /**
   * Smart Cart Suggestions
   */
  @Post('smart-cart')
  @HttpCode(HttpStatus.OK)
  @Throttle(20, 60)
  @ApiOperation({ summary: 'Get smart cart suggestions' })
  async getSmartCart(@Body() body: { userId: string; items: any[] }) {
    return this.aiService.getSmartCartSuggestions(body.userId, body.items);
  }

  /**
   * Cart Abandonment Prediction
   */
  @Post('smart-cart/abandonment-prediction')
  @HttpCode(HttpStatus.OK)
  @Throttle(10, 60)
  @ApiOperation({ summary: 'Predict cart abandonment risk' })
  async predictAbandonment(@Body('userId') userId: string) {
    return this.aiService.predictCartAbandonment(userId);
  }

  /**
   * Suggest Best Coupon
   */
  @Post('smart-cart/coupon')
  @HttpCode(HttpStatus.OK)
  @Throttle(15, 60)
  @ApiOperation({ summary: 'Get best coupon for cart' })
  async suggestCoupon(@Body() body: { userId: string; items: any[] }) {
    return this.aiService.suggestCoupon(body.userId, body.items);
  }

  /**
   * Compare Products
   */
  @Post('smart-cart/compare')
  @HttpCode(HttpStatus.OK)
  @Throttle(15, 60)
  @ApiOperation({ summary: 'Compare products with AI analysis' })
  async compareProducts(@Body('productIds') productIds: string[]) {
    return this.aiService.compareProducts(productIds);
  }

  /**
   * Semantic Search
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @Throttle(40, 60)
  @ApiOperation({ summary: 'AI semantic search' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: SearchResponseDto,
  })
  async semanticSearch(
    @Body() dto: SearchRequestDto,
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const results = await this.aiService.semanticSearch(dto);

    return {
      query: dto.query,
      correctedQuery: results.correctedQuery,
      results: results.results,
      total: results.results.length,
      suggestions: results.suggestions?.map((s) => s.text) || [],
      processingTime: Date.now() - startTime,
      appliedFilters: dto.filters,
      aiSummary: results.aiSummary,
    };
  }

  /**
   * Get Search Suggestions (Autocomplete)
   */
  @Post('search/suggestions')
  @HttpCode(HttpStatus.OK)
  @Throttle(60, 60)
  @ApiOperation({ summary: 'Get search autocomplete suggestions' })
  async getSearchSuggestions(@Body('query') query: string) {
    return this.aiService.getSearchSuggestions(query);
  }

  /**
   * Get Popular Searches
   */
  @Post('search/popular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trending searches' })
  async getPopularSearches(@Body('limit') limit?: number) {
    return this.aiService.getPopularSearches(limit);
  }

  /**
   * Translate Text
   */
  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Translate text between languages' })
  @ApiResponse({ status: 200, description: 'Translation completed' })
  async translate(@Body() dto: TranslateRequestDto) {
    return this.aiService.translate(dto);
  }

  /**
   * Summarize Text
   */
  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  @Throttle(20, 60)
  @ApiOperation({ summary: 'Summarize long text' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  async summarize(@Body() dto: SummarizeRequestDto) {
    return this.aiService.summarize(dto);
  }

  /**
   * Moderate Content
   */
  @Post('moderate')
  @HttpCode(HttpStatus.OK)
  @Throttle(50, 60)
  @ApiOperation({ summary: 'Check content for inappropriate material' })
  @ApiResponse({ status: 200, description: 'Moderation result' })
  async moderate(@Body() dto: ModerateRequestDto) {
    return this.aiService.moderate(dto);
  }

  /**
   * Generate Product Description
   */
  @Post('generate/description')
  @HttpCode(HttpStatus.OK)
  @Throttle(10, 60)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate SEO product description (Vendor only)' })
  async generateProductDescription(
    @Body() productData: {
      name: string;
      category: string;
      brand?: string;
      features?: string[];
      specifications?: Record<string, string>;
      targetAudience?: string;
      price?: number;
      currency?: string;
    },
  ) {
    return this.aiService.generateProductDescription(productData);
  }

  /**
   * Analyze Sentiment
   */
  @Post('sentiment')
  @HttpCode(HttpStatus.OK)
  @Throttle(30, 60)
  @ApiOperation({ summary: 'Analyze sentiment of text' })
  async analyzeSentiment(@Body('text') text: string) {
    return this.aiService.analyzeSentiment(text);
  }

  /**
   * Get Search Analytics (Admin)
   */
  @Post('analytics/search')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get search analytics (Admin only)' })
  async getSearchAnalytics(
    @Body('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.aiService.getSearchAnalytics(period);
  }

  /**
   * Generate Response Template
   */
  @Post('generate/template')
  @HttpCode(HttpStatus.OK)
  @Throttle(15, 60)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate message template' })
  async generateTemplate(
    @Body() body: {
      type: 'order_confirmation' | 'shipping_update' | 'password_reset' | 'welcome' | 'abandoned_cart' | 'review_request' | 'support_reply';
      data: Record<string, any>;
    },
  ) {
    return this.aiService.generateTemplate(body.type, body.data);
  }

  /**
   * Health Check
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI service health check' })
  async healthCheck() {
    return this.aiService.healthCheck();
  }
}
