import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatMessage } from '../dto/chat-request.dto';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  embeddingModel: string;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
    trust: number;
  };
  summary: string;
}

export interface TranslationResult {
  translatedText: string;
  fromLang: string;
  toLang: string;
  detectedLang?: string;
}

export interface ModerationResult {
  isSafe: boolean;
  categories: {
    harassment: boolean;
    harassmentThreatening: boolean;
    hate: boolean;
    hateThreatening: boolean;
    selfHarm: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    sexual: boolean;
    sexualMinors: boolean;
    violence: boolean;
    violenceGraphic: boolean;
  };
  scores: Record<string, number>;
  flagged: boolean;
}

export interface ProductDescriptionResult {
  description: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  bulletPoints: string[];
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI | null;
  private readonly config: OpenAIConfig;
  private readonly timeoutMs: number;
  private readonly rateLimitPerMinute: number;
  private readonly rateWindow: number[] = [];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4',
      temperature: parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7'),
      maxTokens: parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '2000', 10),
      embeddingModel: this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small',
    };
    this.timeoutMs = parseInt(
      this.configService.get<string>('OPENAI_TIMEOUT_MS') ||
        this.configService.get<string>('ai.openai.timeout') ||
        '30000',
      10,
    );
    this.rateLimitPerMinute = parseInt(
      this.configService.get<string>('AI_RATE_LIMIT_PER_MINUTE') || '60',
      10,
    );

    if (!this.config.apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. AI features will degrade safely.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        timeout: this.timeoutMs,
        maxRetries: 1,
      });
      this.logger.log(`OpenAI service initialized with model: ${this.config.model}`);
    }
  }

  /** Whether outbound OpenAI calls are possible. */
  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.openai);
  }

  private ensureClient(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('OpenAI API key not configured');
    }
  }

  private enforceLocalRateLimit(): void {
    const now = Date.now();
    while (this.rateWindow.length && now - this.rateWindow[0] > 60_000) {
      this.rateWindow.shift();
    }
    if (this.rateWindow.length >= this.rateLimitPerMinute) {
      throw new HttpException(
        'AI rate limit exceeded. Please try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.rateWindow.push(now);
  }

  private toHttpException(error: any): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    const status = error?.status || error?.statusCode || error?.response?.status;
    const message = error?.message || 'OpenAI request failed';
    if (status === 429) {
      return new HttpException(
        `AI rate limit (provider): ${message}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      status === 401 ||
      status === 403 ||
      /api key|authentication|unauthorized/i.test(message)
    ) {
      return new ServiceUnavailableException(`OpenAI authentication failed: ${message}`);
    }
    // Network / 5xx / timeouts → unavailable, not a client bad request
    return new ServiceUnavailableException(`AI service unavailable: ${message}`);
  }

  /**
   * Send chat completion request to OpenAI GPT-4
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
    this.ensureClient();
    this.enforceLocalRateLimit();

    const startTime = Date.now();
    try {
      const response = await this.openai!.chat.completions.create({
        model: options?.model || this.config.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens || this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };

      this.logger.debug(`Chat completion took ${Date.now() - startTime}ms, tokens: ${usage.totalTokens}`);

      return { content, usage };
    } catch (error) {
      this.logger.error(`Chat completion failed: ${error.message}`, error.stack);
      throw this.toHttpException(error);
    }
  }

  /**
   * Get personalized product recommendations using AI
   */
  async getProductRecommendations(
    userId: string,
    context: {
      browsingHistory?: string[];
      purchaseHistory?: string[];
      wishlist?: string[];
      cartItems?: string[];
      preferences?: Record<string, any>;
      popularProducts?: any[];
    },
  ): Promise<Array<{ productId: string; reason: string; score: number }>> {
    const prompt = `You are a product recommendation engine for BHD Oman, an e-commerce marketplace.
Analyze the user's context and recommend the most relevant products.

User ID: ${userId}
Browsing History: ${JSON.stringify(context.browsingHistory || [])}
Purchase History: ${JSON.stringify(context.purchaseHistory || [])}
Wishlist: ${JSON.stringify(context.wishlist || [])}
Cart Items: ${JSON.stringify(context.cartItems || [])}
Preferences: ${JSON.stringify(context.preferences || {})}

Available Products:
${JSON.stringify((context.popularProducts || []).slice(0, 30), null, 2)}

Return ONLY a JSON array with up to 10 recommendations. Each item must have:
- productId: string (must match an available product ID)
- reason: string (personalized explanation)
- score: number (0-1 relevance score)

Format: [{"productId": "...", "reason": "...", "score": 0.95}]`;

    try {
      const { content } = await this.chatCompletion(
        [
          { role: 'system', content: 'You are an expert e-commerce recommendation engine. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.3, maxTokens: 1500 },
      );

      const recommendations = JSON.parse(content);
      return Array.isArray(recommendations) ? recommendations.slice(0, 10) : [];
    } catch (error) {
      this.logger.error(`Recommendation generation failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyze sentiment of review/comment text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content:
              'Analyze sentiment and return ONLY valid JSON with fields: sentiment (positive/negative/neutral/mixed), score (-1 to 1), emotions (joy, anger, sadness, fear, surprise, trust each 0-1), summary (brief string)',
          },
          { role: 'user', content: `Analyze sentiment: "${text}"` },
        ],
        { temperature: 0.2, maxTokens: 500 },
      );

      const result = JSON.parse(content);
      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        emotions: {
          joy: result.emotions?.joy || 0,
          anger: result.emotions?.anger || 0,
          sadness: result.emotions?.sadness || 0,
          fear: result.emotions?.fear || 0,
          surprise: result.emotions?.surprise || 0,
          trust: result.emotions?.trust || 0,
        },
        summary: result.summary || '',
      };
    } catch (error) {
      this.logger.error(`Sentiment analysis failed: ${error.message}`);
      return {
        sentiment: 'neutral',
        score: 0,
        emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, trust: 0 },
        summary: 'Analysis unavailable',
      };
    }
  }

  /**
   * Generate SEO-optimized product description
   */
  async generateProductDescription(productData: {
    name: string;
    category: string;
    brand?: string;
    features?: string[];
    specifications?: Record<string, string>;
    targetAudience?: string;
    price?: number;
    currency?: string;
  }): Promise<ProductDescriptionResult> {
    const prompt = `Generate an SEO-optimized product listing for BHD Oman marketplace.

Product: ${productData.name}
Category: ${productData.category}
Brand: ${productData.brand || 'N/A'}
Features: ${JSON.stringify(productData.features || [])}
Specs: ${JSON.stringify(productData.specifications || {})}
Target: ${productData.targetAudience || 'General'}
Price: ${productData.price || 'N/A'} ${productData.currency || 'OMR'}

Return ONLY JSON:
{
  "description": "compelling HTML product description (200-300 words)",
  "seoTitle": "SEO title under 60 chars",
  "metaDescription": "meta description under 160 chars",
  "keywords": ["keyword1", "keyword2", ...],
  "bulletPoints": ["feature 1", "feature 2", ...]
}`;

    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content:
              'You are an expert e-commerce copywriter specializing in SEO for the Middle East market. Write in English and Arabic where appropriate. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.7, maxTokens: 1200 },
      );

      const result = JSON.parse(content);
      return {
        description: result.description || '',
        seoTitle: result.seoTitle || productData.name,
        metaDescription: result.metaDescription || '',
        keywords: result.keywords || [],
        bulletPoints: result.bulletPoints || [],
      };
    } catch (error) {
      this.logger.error(`Product description generation failed: ${error.message}`);
      return {
        description: productData.name,
        seoTitle: productData.name,
        metaDescription: '',
        keywords: [],
        bulletPoints: productData.features || [],
      };
    }
  }

  /**
   * Expand search query with AI-generated keywords
   */
  async generateSearchKeywords(query: string): Promise<string[]> {
    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content:
              'You are a search query expansion engine. Given a user query, return related keywords and synonyms to improve search results. Return ONLY a JSON array of strings.',
          },
          {
            role: 'user',
            content: `Expand search query: "${query}". Return up to 10 related keywords including synonyms, related terms, and common variations. Include Arabic transliterations where relevant for Oman market.`,
          },
        ],
        { temperature: 0.4, maxTokens: 300 },
      );

      const keywords = JSON.parse(content);
      return Array.isArray(keywords) ? keywords.slice(0, 10) : [query];
    } catch (error) {
      this.logger.error(`Search keyword generation failed: ${error.message}`);
      return [query];
    }
  }

  /**
   * AI assistant chat with marketplace-specific system prompt
   */
  async chatWithAssistant(
    message: string,
    context?: {
      userId?: string;
      userName?: string;
      previousMessages?: ChatMessage[];
      productContext?: any;
      orderContext?: any;
    },
  ): Promise<{ response: string; suggestions?: any[]; actions?: any[] }> {
    const systemPrompt = `You are BHD Assistant, the AI shopping assistant for BHD Oman - Oman's leading e-commerce marketplace.

Your capabilities:
- Help users discover products across electronics, fashion, home, beauty, groceries, and more
- Answer questions about orders, shipping, returns, and payments
- Provide product recommendations and comparisons
- Assist with account issues and support inquiries
- Support both English and Arabic languages
- Understand Omani culture and shopping preferences

Guidelines:
- Be friendly, helpful, and professional
- Use OMR (Omani Rial) for currency references
- Mention BHD Oman marketplace features when relevant
- Provide accurate, honest product information
- If you don't know something, suggest contacting support
- Keep responses concise but informative
- Include product suggestions when relevant

Current user: ${context?.userName || 'Guest'} (${context?.userId || 'anonymous'})`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(context?.previousMessages || []),
      { role: 'user', content: message },
    ];

    try {
      const { content } = await this.chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Extract any product suggestions from the response
      const suggestions: any[] = [];
      const actions: any[] = [];

      return { response: content, suggestions, actions };
    } catch (error) {
      this.logger.error(`Assistant chat failed: ${error.message}`);
      return {
        response:
          "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team at support@bhdoman.com.",
      };
    }
  }

  /**
   * Translate text between languages
   */
  async translateText(text: string, fromLang: string, toLang: string): Promise<TranslationResult> {
    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text accurately, preserving tone and context. Return ONLY the translated text, no explanations.`,
          },
          {
            role: 'user',
            content: `Translate from ${fromLang} to ${toLang}:\n\n"${text}"`,
          },
        ],
        { temperature: 0.2, maxTokens: 1000 },
      );

      return {
        translatedText: content.trim(),
        fromLang,
        toLang,
      };
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`);
      return {
        translatedText: text,
        fromLang,
        toLang,
      };
    }
  }

  /**
   * Summarize long text
   */
  async summarizeText(text: string, maxLength?: number): Promise<string> {
    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content: `Summarize the given text concisely while preserving key information. Limit to ${maxLength || 100} words.`,
          },
          { role: 'user', content: text },
        ],
        { temperature: 0.3, maxTokens: 500 },
      );

      return content.trim();
    } catch (error) {
      this.logger.error(`Summarization failed: ${error.message}`);
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
  }

  /**
   * Check content for inappropriate material
   */
  async moderateContent(text: string): Promise<ModerationResult> {
    try {
      const moderation = await this.openai.moderations.create({
        input: text,
      });

      const result = moderation.results[0];

      return {
        isSafe: !result.flagged,
        categories: {
          harassment: result.categories?.harassment || false,
          harassmentThreatening: result.categories?.['harassment/threatening'] || false,
          hate: result.categories?.hate || false,
          hateThreatening: result.categories?.['hate/threatening'] || false,
          selfHarm: result.categories?.['self-harm'] || false,
          selfHarmIntent: result.categories?.['self-harm/intent'] || false,
          selfHarmInstructions: result.categories?.['self-harm/instructions'] || false,
          sexual: result.categories?.sexual || false,
          sexualMinors: result.categories?.['sexual/minors'] || false,
          violence: result.categories?.violence || false,
          violenceGraphic: result.categories?.['violence/graphic'] || false,
        },
        scores: {
          harassment: result.category_scores?.harassment || 0,
          harassmentThreatening: result.category_scores?.['harassment/threatening'] || 0,
          hate: result.category_scores?.hate || 0,
          hateThreatening: result.category_scores?.['hate/threatening'] || 0,
          selfHarm: result.category_scores?.['self-harm'] || 0,
          selfHarmIntent: result.category_scores?.['self-harm/intent'] || 0,
          selfHarmInstructions: result.category_scores?.['self-harm/instructions'] || 0,
          sexual: result.category_scores?.sexual || 0,
          sexualMinors: result.category_scores?.['sexual/minors'] || 0,
          violence: result.category_scores?.violence || 0,
          violenceGraphic: result.category_scores?.['violence/graphic'] || 0,
        },
        flagged: result.flagged,
      };
    } catch (error) {
      this.logger.error(`Content moderation failed: ${error.message}`);
      return {
        isSafe: true,
        categories: {} as any,
        scores: {},
        flagged: false,
      };
    }
  }

  /**
   * Generate email/message response templates
   */
  async generateResponseTemplate(
    type: 'order_confirmation' | 'shipping_update' | 'password_reset' | 'welcome' | 'abandoned_cart' | 'review_request' | 'support_reply',
    data: Record<string, any>,
  ): Promise<{ subject: string; body: string; smsText?: string; whatsappText?: string }> {
    const typePrompts: Record<string, string> = {
      order_confirmation: 'Generate an order confirmation message',
      shipping_update: 'Generate a shipping status update',
      password_reset: 'Generate a password reset email',
      welcome: 'Generate a welcome message for new users',
      abandoned_cart: 'Generate a cart recovery message',
      review_request: 'Generate a product review request',
      support_reply: 'Generate a customer support response',
    };

    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content: `You are a template generator for BHD Oman e-commerce marketplace. Generate professional, friendly messages in both English and Arabic. Return ONLY valid JSON with fields: subject, body (HTML), smsText, whatsappText.`,
          },
          {
            role: 'user',
            content: `${typePrompts[type] || 'Generate a message'} for BHD Oman.

Data: ${JSON.stringify(data, null, 2)}

Return JSON:
{
  "subject": "email subject line",
  "body": "HTML email body",
  "smsText": "short SMS version",
  "whatsappText": "WhatsApp-friendly version with emojis"
}`,
          },
        ],
        { temperature: 0.6, maxTokens: 800 },
      );

      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Template generation failed: ${error.message}`);
      return {
        subject: 'BHD Oman Notification',
        body: `<p>Dear Customer,</p><p>${typePrompts[type] || 'Notification'}.</p><p>Best regards,<br>BHD Oman Team</p>`,
        smsText: 'BHD Oman: Please check your email for details.',
        whatsappText: 'Hello from BHD Oman! 📦 Please check your account for updates.',
      };
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.openai!.embeddings.create({
        model: this.config.embeddingModel,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Compare products with AI analysis
   */
  async compareProducts(products: any[]): Promise<{
    comparison: string;
    winner: string;
    prosCons: Array<{ productId: string; pros: string[]; cons: string[] }>;
  }> {
    try {
      const { content } = await this.chatCompletion(
        [
          {
            role: 'system',
            content:
              'You are a product comparison expert. Compare the given products and provide insights. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: `Compare these products for a customer:
${JSON.stringify(products, null, 2)}

Return JSON:
{
  "comparison": "brief comparison summary (2-3 sentences)",
  "winner": "productId of best value or 'tie'",
  "prosCons": [
    {"productId": "id", "pros": ["pro1", "pro2"], "cons": ["con1"]}
  ]
}`,
          },
        ],
        { temperature: 0.4, maxTokens: 800 },
      );

      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Product comparison failed: ${error.message}`);
      return {
        comparison: 'Comparison unavailable.',
        winner: 'tie',
        prosCons: products.map((p) => ({
          productId: p.id,
          pros: [],
          cons: [],
        })),
      };
    }
  }

  /**
   * Get the current OpenAI configuration (sanitized)
   */
  getConfig(): Omit<OpenAIConfig, 'apiKey'> & { configured: boolean } {
    return {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      embeddingModel: this.config.embeddingModel,
      configured: this.isConfigured(),
    };
  }
}
