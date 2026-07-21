import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { OpenAIService } from './openai.service';

export interface SearchLog {
  query: string;
  userId?: string;
  results: number;
  timestamp: Date;
  filters?: Record<string, any>;
  latency: number;
}

export interface SemanticSearchResult {
  productId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  store: string;
  relevanceScore: number;
  matchedTerms: string[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly redisPrefix = 'search:';
  private readonly embeddingPrefix = 'embedding:';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Semantic search using OpenAI embeddings
   */
  async semanticSearch(
    query: string,
    options?: {
      limit?: number;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      userId?: string;
    },
  ): Promise<{
    results: SemanticSearchResult[];
    correctedQuery?: string;
    aiSummary?: string;
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: Spell check and correct query
      const correctedQuery = await this.spellCheck(query);
      const searchQuery = correctedQuery || query;

      // Step 2: Generate embedding for the query
      const queryEmbedding = await this.openaiService.generateEmbedding(searchQuery);

      if (!queryEmbedding || queryEmbedding.length === 0) {
        // Fallback to keyword search
        return {
          results: await this.keywordSearch(searchQuery, options),
          correctedQuery: correctedQuery !== query ? correctedQuery : undefined,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 3: Find similar product embeddings in Redis
      const productIds = await this.findSimilarEmbeddings(queryEmbedding, options?.limit || 20);

      // Step 4: Fetch product details
      const results: SemanticSearchResult[] = [];
      for (const { productId, score } of productIds) {
        const product = await this.getProductDetails(productId);
        if (!product) continue;

        // Apply filters
        if (options?.category && product.category !== options.category) continue;
        if (options?.minPrice && product.price < options.minPrice) continue;
        if (options?.maxPrice && product.price > options.maxPrice) continue;

        results.push({
          productId,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency || 'OMR',
          imageUrl: product.imageUrl,
          category: product.category,
          store: product.store,
          relevanceScore: Math.round(score * 100) / 100,
          matchedTerms: this.extractMatchedTerms(searchQuery, product),
        });
      }

      // Step 5: Generate AI summary if we have results
      let aiSummary: string | undefined;
      if (results.length > 0) {
        try {
          const { content } = await this.openaiService.chatCompletion(
            [
              {
                role: 'system',
                content: 'Summarize search results in 1-2 sentences. Be concise.',
              },
              {
                role: 'user',
                content: `Query: "${searchQuery}". Top results: ${results
                  .slice(0, 5)
                  .map((r) => r.name)
                  .join(', ')}.`,
              },
            ],
            { maxTokens: 150 },
          );
          aiSummary = content.trim();
        } catch (e) {
          this.logger.warn(`AI summary generation failed: ${e.message}`);
        }
      }

      // Step 6: Log the search
      await this.logSearch(query, options?.userId, results.length);

      const processingTime = Date.now() - startTime;
      this.logger.debug(`Semantic search for "${query}" took ${processingTime}ms, ${results.length} results`);

      return {
        results,
        correctedQuery: correctedQuery !== query ? correctedQuery : undefined,
        aiSummary,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      return {
        results: await this.keywordSearch(query, options),
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get autocomplete search suggestions
   */
  async getSearchSuggestions(query: string): Promise<
    Array<{
      text: string;
      type: 'autocomplete' | 'trending' | 'personalized' | 'corrected';
      resultCount?: number;
    }>
  > {
    if (!query || query.length < 2) return [];

    try {
      const suggestions: Array<{ text: string; type: any; resultCount?: number }> = [];

      // 1. Autocomplete from search index
      const autocompleteResults = await this.redis.hgetall(`${this.redisPrefix}autocomplete:${query.toLowerCase()}`);
      if (autocompleteResults && autocompleteResults.suggestions) {
        const auto = JSON.parse(autocompleteResults.suggestions);
        for (const s of auto.slice(0, 5)) {
          suggestions.push({ text: s, type: 'autocomplete' });
        }
      }

      // 2. Prefix matching from popular searches
      const popularSearches = await this.redis.zrevrange(
        `${this.redisPrefix}popular`,
        0,
        50,
      );

      for (const search of popularSearches) {
        if (search.toLowerCase().startsWith(query.toLowerCase()) && search !== query) {
          const count = await this.redis.zscore(`${this.redisPrefix}popular`, search);
          if (!suggestions.find((s) => s.text === search)) {
            suggestions.push({
              text: search,
              type: 'trending',
              resultCount: count ? Math.round(count) : undefined,
            });
          }
        }
      }

      // 3. Product name suggestions
      const productMatches = await this.redis.scan(0, 'MATCH', `product:*`, 'COUNT', 100);
      for (const key of productMatches[1]) {
        const name = await this.redis.hget(key, 'name');
        if (name && name.toLowerCase().includes(query.toLowerCase())) {
          if (!suggestions.find((s) => s.text === name)) {
            suggestions.push({ text: name, type: 'autocomplete' });
          }
        }
      }

      return suggestions.slice(0, 10);
    } catch (error) {
      this.logger.error(`Failed to get search suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Spell check and correct search query
   */
  async spellCheck(query: string): Promise<string | undefined> {
    try {
      // Check if query exists in our search vocabulary
      const exists = await this.redis.zscore(`${this.redisPrefix}popular`, query.toLowerCase());
      if (exists) return query; // Known query, no correction needed

      // Check against known product names and search terms
      const vocabulary = await this.redis.zrange(`${this.redisPrefix}vocabulary`, 0, -1);

      let bestMatch: string | undefined;
      let bestScore = 0;

      for (const word of vocabulary) {
        const similarity = this.calculateLevenshteinSimilarity(query.toLowerCase(), word.toLowerCase());
        if (similarity > 0.8 && similarity > bestScore) {
          bestScore = similarity;
          bestMatch = word;
        }
      }

      if (bestMatch) return bestMatch;

      // Use AI for complex corrections
      try {
        const { content } = await this.openaiService.chatCompletion(
          [
            {
              role: 'system',
              content: 'You are a spell checker. Fix typos in search queries. Return ONLY the corrected query, no explanation. If no correction needed, return the original.',
            },
            {
              role: 'user',
              content: `Fix this search query if it has typos: "${query}"`,
            },
          ],
          { temperature: 0.2, maxTokens: 50 },
        );

        const corrected = content.trim();
        if (corrected.toLowerCase() !== query.toLowerCase()) {
          return corrected;
        }
      } catch (aiError) {
        this.logger.warn(`AI spell check failed: ${aiError.message}`);
      }

      return query;
    } catch (error) {
      this.logger.error(`Spell check failed: ${error.message}`);
      return query;
    }
  }

  /**
   * Get trending/popular searches
   */
  async getPopularSearches(limit: number = 10): Promise<
    Array<{
      query: string;
      count: number;
      trend: 'up' | 'down' | 'stable';
    }>
  > {
    try {
      const searches = await this.redis.zrevrange(
        `${this.redisPrefix}popular`,
        0,
        limit - 1,
        'WITHSCORES',
      );

      const result: Array<{ query: string; count: number; trend: 'up' | 'down' | 'stable' }> = [];

      for (let i = 0; i < searches.length; i += 2) {
        const query = searches[i];
        const count = parseFloat(searches[i + 1]);

        // Get trend from previous period
        const previousCount = await this.redis.zscore(`${this.redisPrefix}popular:prev`, query);
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (previousCount) {
          if (count > previousCount * 1.2) trend = 'up';
          else if (count < previousCount * 0.8) trend = 'down';
        }

        result.push({ query, count: Math.round(count), trend });
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get popular searches: ${error.message}`);
      return [];
    }
  }

  /**
   * Log search for analytics
   */
  async logSearch(
    query: string,
    userId?: string,
    results?: number,
    filters?: Record<string, any>,
    latency?: number,
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const logEntry: SearchLog = {
        query: query.toLowerCase().trim(),
        userId,
        results: results || 0,
        timestamp: new Date(),
        filters,
        latency: latency || 0,
      };

      // Add to search history
      await this.redis.lpush(`${this.redisPrefix}history`, JSON.stringify(logEntry));
      await this.redis.ltrim(`${this.redisPrefix}history`, 0, 9999);

      // Update popular searches
      await this.redis.zincrby(`${this.redisPrefix}popular`, 1, logEntry.query);

      // Update vocabulary
      const words = logEntry.query.split(/\s+/);
      for (const word of words) {
        if (word.length > 2) {
          await this.redis.zincrby(`${this.redisPrefix}vocabulary`, 1, word);
        }
      }

      // Log user-specific search
      if (userId) {
        await this.redis.lpush(
          `${this.redisPrefix}user:${userId}`,
          JSON.stringify({ query: logEntry.query, timestamp }),
        );
        await this.redis.ltrim(`${this.redisPrefix}user:${userId}`, 0, 99);
      }

      // Update autocomplete index
      for (let i = 1; i <= query.length; i++) {
        const prefix = query.substring(0, i).toLowerCase();
        const current = await this.redis.hget(`${this.redisPrefix}autocomplete:${prefix}`, 'suggestions');
        const suggestions = current ? JSON.parse(current) : [];
        if (!suggestions.includes(query)) {
          suggestions.push(query);
          await this.redis.hset(
            `${this.redisPrefix}autocomplete:${prefix}`,
            'suggestions',
            JSON.stringify(suggestions.slice(0, 10)),
          );
          await this.redis.expire(`${this.redisPrefix}autocomplete:${prefix}`, 7 * 24 * 3600);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to log search: ${error.message}`);
    }
  }

  /**
   * Get search analytics for admin dashboard
   */
  async getSearchAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    avgResultsPerSearch: number;
    topQueries: Array<{ query: string; count: number }>;
    zeroResultQueries: string[];
    avgLatency: number;
  }> {
    try {
      const now = Date.now();
      const periodMs =
        period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000;

      const history = await this.redis.lrange(`${this.redisPrefix}history`, 0, -1);
      const periodLogs = history
        .map((h) => JSON.parse(h))
        .filter((l: SearchLog) => now - new Date(l.timestamp).getTime() < periodMs);

      const queryCounts: Record<string, number> = {};
      let totalResults = 0;
      let totalLatency = 0;
      const zeroResultQueries: string[] = [];

      for (const log of periodLogs) {
        queryCounts[log.query] = (queryCounts[log.query] || 0) + 1;
        totalResults += log.results || 0;
        totalLatency += log.latency || 0;
        if (log.results === 0) {
          zeroResultQueries.push(log.query);
        }
      }

      const topQueries = Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      return {
        totalSearches: periodLogs.length,
        uniqueQueries: Object.keys(queryCounts).length,
        avgResultsPerSearch: periodLogs.length > 0 ? Math.round(totalResults / periodLogs.length) : 0,
        topQueries,
        zeroResultQueries: [...new Set(zeroResultQueries)].slice(0, 20),
        avgLatency: periodLogs.length > 0 ? Math.round(totalLatency / periodLogs.length) : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get search analytics: ${error.message}`);
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

  // Private helper methods

  private async keywordSearch(
    query: string,
    options?: {
      limit?: number;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<SemanticSearchResult[]> {
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const scores: Record<string, { score: number; product: any }> = {};

    // Search across product names, descriptions, and tags
    const productKeys = await this.redis.keys('product:*');
    for (const key of productKeys.slice(0, 200)) {
      const product = await this.redis.hgetall(key);
      if (!product.name) continue;

      let score = 0;
      const nameLower = product.name.toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const tags = JSON.parse(product.tags || '[]').map((t: string) => t.toLowerCase());

      for (const word of words) {
        if (nameLower.includes(word)) score += 3;
        if (descLower.includes(word)) score += 1;
        if (tags.some((t: string) => t.includes(word))) score += 2;
      }

      // Exact match bonus
      if (nameLower.includes(query.toLowerCase())) score += 5;

      if (score > 0) {
        const pid = key.replace('product:', '');

        // Apply filters
        if (options?.category && product.category !== options.category) continue;
        if (options?.minPrice && parseFloat(product.price) < options.minPrice) continue;
        if (options?.maxPrice && parseFloat(product.price) > options.maxPrice) continue;

        scores[pid] = {
          score,
          product: {
            productId: pid,
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price || '0'),
            currency: product.currency || 'OMR',
            imageUrl: product.imageUrl,
            category: product.category || 'general',
            store: product.store || 'BHD Marketplace',
          },
        };
      }
    }

    return Object.values(scores)
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.limit || 20)
      .map((s) => ({
        ...s.product,
        relevanceScore: Math.min(s.score / 10, 1),
        matchedTerms: words,
      }));
  }

  private async findSimilarEmbeddings(
    queryEmbedding: number[],
    limit: number,
  ): Promise<Array<{ productId: string; score: number }>> {
    try {
      // Get all product embeddings from Redis
      const embeddingKeys = await this.redis.keys(`${this.embeddingPrefix}*`);
      const similarities: Array<{ productId: string; score: number }> = [];

      for (const key of embeddingKeys) {
        const productEmbedding = await this.redis.get(key);
        if (!productEmbedding) continue;

        const productId = key.replace(this.embeddingPrefix, '');
        const parsed = JSON.parse(productEmbedding);
        const score = this.cosineSimilarity(queryEmbedding, parsed);

        if (score > 0.7) {
          similarities.push({ productId, score });
        }
      }

      return similarities.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to find similar embeddings: ${error.message}`);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateLevenshteinSimilarity(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  private async getProductDetails(productId: string): Promise<any> {
    const product = await this.redis.hgetall(`product:${productId}`);
    if (!product || Object.keys(product).length === 0) return null;

    return {
      productId,
      name: product.name,
      description: product.description || '',
      price: parseFloat(product.price || '0'),
      currency: product.currency || 'OMR',
      imageUrl: product.imageUrl,
      category: product.category || 'general',
      store: product.store || 'BHD Marketplace',
    };
  }

  private extractMatchedTerms(query: string, product: any): string[] {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const matched: string[] = [];

    for (const term of terms) {
      if (
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
      ) {
        matched.push(term);
      }
    }

    return matched;
  }
}
