import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { OpenAIService } from './openai.service';

export interface ProductVector {
  productId: string;
  category: string;
  price: number;
  brand: string;
  tags: string[];
  rating: number;
  salesCount: number;
  viewCount: number;
  attributes: Record<string, number>;
}

export interface UserVector {
  userId: string;
  categoryPreferences: Record<string, number>;
  brandPreferences: Record<string, number>;
  priceRange: { min: number; max: number };
  tagPreferences: Record<string, number>;
  recentCategories: string[];
  recentBrands: string[];
  purchasePatterns: {
    avgOrderValue: number;
    frequency: number;
    preferredPayment: string;
  };
}

export interface Recommendation {
  productId: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  store: string;
  score: number;
  reason: string;
  algorithm: 'collaborative_filtering' | 'content_based' | 'trending' | 'personalized';
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly redisPrefix = 'rec:';
  private readonly cacheTtl: number;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
  ) {
    this.cacheTtl = parseInt(this.configService.get<string>('RECOMMENDATION_CACHE_TTL') || '3600', 10);
  }

  /**
   * Get personalized product recommendations for a user
   */
  async getRecommendationsForUser(
    userId: string,
    limit: number = 10,
    category?: string,
  ): Promise<Recommendation[]> {
    const cacheKey = `${this.redisPrefix}user:${userId}:${category || 'all'}`;

    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user recommendations: ${userId}`);
        return JSON.parse(cached);
      }

      // Build user preference vector
      const userVector = await this.buildUserVector(userId);

      // Get candidate products (from same categories of interest)
      const candidateProducts = await this.getCandidateProducts(userVector, category);

      // Calculate similarity scores
      const scoredProducts = candidateProducts.map((product) => ({
        ...product,
        score: this.calculateSimilarity(userVector, product),
      }));

      // Sort by score and take top N
      const recommendations = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((p) => ({
          productId: p.productId,
          name: p.name,
          price: p.price,
          currency: p.currency || 'OMR',
          imageUrl: p.imageUrl,
          category: p.category,
          store: p.store,
          score: Math.round(p.score * 100) / 100,
          reason: this.generateReason(userVector, p),
          algorithm: 'hybrid' as const,
        }));

      // Cache results
      await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(recommendations));

      // Also get AI-powered recommendations if available
      try {
        const aiRecommendations = await this.openaiService.getProductRecommendations(userId, {
          browsingHistory: userVector.recentCategories,
          preferences: userVector.categoryPreferences,
        });

        // Merge AI recommendations with scored ones
        for (const aiRec of aiRecommendations) {
          const existing = recommendations.find((r) => r.productId === aiRec.productId);
          if (existing) {
            existing.score = Math.max(existing.score, aiRec.score);
          } else if (recommendations.length < limit) {
            const product = candidateProducts.find((p) => p.productId === aiRec.productId);
            if (product) {
              recommendations.push({
                ...product,
                score: aiRec.score,
                reason: aiRec.reason,
                algorithm: 'personalized',
              });
            }
          }
        }
      } catch (aiError) {
        this.logger.warn(`AI recommendations unavailable: ${aiError.message}`);
      }

      return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get recommendations for user ${userId}: ${error.message}`);
      return this.getFallbackRecommendations(limit, category);
    }
  }

  /**
   * Get similar products based on content similarity
   */
  async getSimilarProducts(productId: string, limit: number = 8): Promise<Recommendation[]> {
    const cacheKey = `${this.redisPrefix}similar:${productId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Get product details
      const product = await this.getProductById(productId);
      if (!product) return [];

      // Get products in same category
      const candidates = await this.getCandidateProducts(
        {
          categoryPreferences: { [product.category]: 1 },
          brandPreferences: { [product.brand]: 0.5 },
        } as any,
        product.category,
      );

      // Filter out the product itself
      const similar = candidates
        .filter((p) => p.productId !== productId)
        .map((p) => ({
          ...p,
          score: this.calculateContentSimilarity(product, p),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((p) => ({
          productId: p.productId,
          name: p.name,
          price: p.price,
          currency: p.currency || 'OMR',
          imageUrl: p.imageUrl,
          category: p.category,
          store: p.store,
          score: Math.round(p.score * 100) / 100,
          reason: `Similar to ${product.name} - same ${p.category} category`,
          algorithm: 'content_based' as const,
        }));

      await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(similar));
      return similar;
    } catch (error) {
      this.logger.error(`Failed to get similar products for ${productId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get frequently bought together products
   */
  async getFrequentlyBoughtTogether(productId: string): Promise<Recommendation[]> {
    const cacheKey = `${this.redisPrefix}bought_together:${productId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Get from order analytics - products ordered together
      const frequentlyBought = await this.redis.zrevrange(
        `${this.redisPrefix}cooccurrence:${productId}`,
        0,
        5,
        'WITHSCORES',
      );

      if (frequentlyBought.length === 0) {
        // Fallback: get complementary category products
        const product = await this.getProductById(productId);
        if (!product) return [];

        const complementaryCategory = this.getComplementaryCategory(product.category);
        if (!complementaryCategory) return [];

        const complementary = await this.getCandidateProducts(
          { categoryPreferences: { [complementaryCategory]: 1 } } as any,
          complementaryCategory,
        );

        const result = complementary.slice(0, 5).map((p) => ({
          productId: p.productId,
          name: p.name,
          price: p.price,
          currency: p.currency || 'OMR',
          imageUrl: p.imageUrl,
          category: p.category,
          store: p.store,
          score: 0.75,
          reason: `Frequently bought with ${product.name}`,
          algorithm: 'collaborative_filtering' as const,
        }));

        await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(result));
        return result;
      }

      // Parse results from Redis
      const result: Recommendation[] = [];
      for (let i = 0; i < frequentlyBought.length; i += 2) {
        const pid = frequentlyBought[i];
        const score = parseFloat(frequentlyBought[i + 1]);
        const product = await this.getProductById(pid);
        if (product) {
          result.push({
            productId: product.productId,
            name: product.name,
            price: product.price,
            currency: product.currency || 'OMR',
            imageUrl: product.imageUrl,
            category: product.category,
            store: product.store,
            score: Math.round(score * 100) / 100,
            reason: `Customers also bought this`,
            algorithm: 'collaborative_filtering',
          });
        }
      }

      await this.redis.setex(cacheKey, this.cacheTtl, JSON.stringify(result));
      return result;
    } catch (error) {
      this.logger.error(`Failed to get frequently bought together for ${productId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(category?: string, limit: number = 10): Promise<Recommendation[]> {
    const cacheKey = `${this.redisPrefix}trending:${category || 'all'}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Get trending from Redis sorted set (score = trending score)
      const trendingIds = await this.redis.zrevrange(
        `${this.redisPrefix}trending:${category || 'all'}`,
        0,
        limit - 1,
        'WITHSCORES',
      );

      if (trendingIds.length === 0) {
        // Fallback: return popular products
        return this.getFallbackRecommendations(limit, category);
      }

      const result: Recommendation[] = [];
      for (let i = 0; i < trendingIds.length; i += 2) {
        const pid = trendingIds[i];
        const score = parseFloat(trendingIds[i + 1]);
        const product = await this.getProductById(pid);
        if (product) {
          result.push({
            productId: product.productId,
            name: product.name,
            price: product.price,
            currency: product.currency || 'OMR',
            imageUrl: product.imageUrl,
            category: product.category,
            store: product.store,
            score: Math.round(score * 100) / 100,
            reason: 'Trending now',
            algorithm: 'trending',
          });
        }
      }

      await this.redis.setex(cacheKey, 1800, JSON.stringify(result)); // Shorter TTL for trending
      return result;
    } catch (error) {
      this.logger.error(`Failed to get trending products: ${error.message}`);
      return this.getFallbackRecommendations(limit, category);
    }
  }

  /**
   * Get recently viewed products for a user
   */
  async getRecentlyViewed(userId: string): Promise<Recommendation[]> {
    try {
      const viewedIds = await this.redis.lrange(`${this.redisPrefix}viewed:${userId}`, 0, 9);
      if (!viewedIds.length) return [];

      const products: Recommendation[] = [];
      for (const pid of viewedIds) {
        const product = await this.getProductById(pid);
        if (product) {
          products.push({
            productId: product.productId,
            name: product.name,
            price: product.price,
            currency: product.currency || 'OMR',
            imageUrl: product.imageUrl,
            category: product.category,
            store: product.store,
            score: 1.0,
            reason: 'Recently viewed',
            algorithm: 'personalized',
          });
        }
      }

      return products;
    } catch (error) {
      this.logger.error(`Failed to get recently viewed for ${userId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Update user preferences from actions
   */
  async updateUserPreferences(
    userId: string,
    action: {
      type: 'view' | 'cart' | 'purchase' | 'wishlist' | 'search' | 'review';
      productId?: string;
      category?: string;
      brand?: string;
      price?: number;
      query?: string;
    },
  ): Promise<void> {
    try {
      const key = `${this.redisPrefix}user_vector:${userId}`;
      const vector = await this.buildUserVector(userId);

      // Update category preferences
      if (action.category) {
        vector.categoryPreferences[action.category] =
          (vector.categoryPreferences[action.category] || 0) + this.getActionWeight(action.type);
        vector.recentCategories = [action.category, ...vector.recentCategories.slice(0, 9)];
      }

      // Update brand preferences
      if (action.brand) {
        vector.brandPreferences[action.brand] =
          (vector.brandPreferences[action.brand] || 0) + this.getActionWeight(action.type);
        vector.recentBrands = [action.brand, ...vector.recentBrands.slice(0, 9)];
      }

      // Update price range
      if (action.price) {
        vector.priceRange.min = Math.min(vector.priceRange.min, action.price * 0.7);
        vector.priceRange.max = Math.max(vector.priceRange.max, action.price * 1.3);
      }

      // Track product views
      if (action.type === 'view' && action.productId) {
        await this.redis.lpush(`${this.redisPrefix}viewed:${userId}`, action.productId);
        await this.redis.ltrim(`${this.redisPrefix}viewed:${userId}`, 0, 49);
      }

      // Track co-occurrence for collaborative filtering
      if (action.type === 'purchase' && action.productId) {
        const cartItems = await this.redis.smembers(`${this.redisPrefix}cart:${userId}`);
        for (const item of cartItems) {
          if (item !== action.productId) {
            await this.redis.zincrby(`${this.redisPrefix}cooccurrence:${item}`, 1, action.productId);
          }
        }
        await this.redis.del(`${this.redisPrefix}cart:${userId}`);
      }

      if (action.type === 'cart' && action.productId) {
        await this.redis.sadd(`${this.redisPrefix}cart:${userId}`, action.productId);
      }

      // Save updated vector
      await this.redis.setex(key, this.cacheTtl * 24, JSON.stringify(vector));

      // Invalidate recommendation cache
      await this.redis.del(`${this.redisPrefix}user:${userId}:all`);
      if (action.category) {
        await this.redis.del(`${this.redisPrefix}user:${userId}:${action.category}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update preferences for ${userId}: ${error.message}`);
    }
  }

  /**
   * Build user preference vector from stored data
   */
  async buildUserVector(userId: string): Promise<UserVector> {
    try {
      const stored = await this.redis.get(`${this.redisPrefix}user_vector:${userId}`);
      if (stored) return JSON.parse(stored);

      // Default vector for new users
      return {
        userId,
        categoryPreferences: {},
        brandPreferences: {},
        priceRange: { min: 0, max: 1000 },
        tagPreferences: {},
        recentCategories: [],
        recentBrands: [],
        purchasePatterns: {
          avgOrderValue: 50,
          frequency: 0,
          preferredPayment: 'card',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to build user vector for ${userId}: ${error.message}`);
      return {
        userId,
        categoryPreferences: {},
        brandPreferences: {},
        priceRange: { min: 0, max: 1000 },
        tagPreferences: {},
        recentCategories: [],
        recentBrands: [],
        purchasePatterns: { avgOrderValue: 50, frequency: 0, preferredPayment: 'card' },
      };
    }
  }

  /**
   * Calculate cosine similarity between user and product vectors
   */
  calculateSimilarity(userVector: UserVector, productVector: ProductVector): number {
    let score = 0;
    let weightSum = 0;

    // Category match (weight: 0.35)
    if (productVector.category && userVector.categoryPreferences[productVector.category]) {
      score += 0.35 * Math.min(userVector.categoryPreferences[productVector.category] / 10, 1);
      weightSum += 0.35;
    }

    // Brand match (weight: 0.15)
    if (productVector.brand && userVector.brandPreferences[productVector.brand]) {
      score += 0.15 * Math.min(userVector.brandPreferences[productVector.brand] / 5, 1);
      weightSum += 0.15;
    }

    // Price match (weight: 0.20)
    if (productVector.price) {
      const priceCenter = (userVector.priceRange.min + userVector.priceRange.max) / 2;
      const priceDiff = Math.abs(productVector.price - priceCenter);
      const priceRange = userVector.priceRange.max - userVector.priceRange.min || 1;
      const priceScore = Math.max(0, 1 - priceDiff / priceRange);
      score += 0.20 * priceScore;
      weightSum += 0.20;
    }

    // Rating score (weight: 0.15)
    if (productVector.rating) {
      score += 0.15 * (productVector.rating / 5);
      weightSum += 0.15;
    }

    // Popularity score (weight: 0.15)
    if (productVector.salesCount) {
      const popularityScore = Math.min(productVector.salesCount / 100, 1);
      score += 0.15 * popularityScore;
      weightSum += 0.15;
    }

    return weightSum > 0 ? score / weightSum : 0;
  }

  // Private helper methods

  private async getProductById(productId: string): Promise<ProductVector & { name: string; currency: string; store: string; imageUrl?: string } | null> {
    // In production, this fetches from ProductService/DB
    // Simulated for completeness
    const productData = await this.redis.hgetall(`product:${productId}`);
    if (!productData || Object.keys(productData).length === 0) {
      return null;
    }
    return {
      productId,
      name: productData.name || 'Unknown Product',
      price: parseFloat(productData.price || '0'),
      currency: productData.currency || 'OMR',
      category: productData.category || 'general',
      brand: productData.brand || 'unknown',
      tags: JSON.parse(productData.tags || '[]'),
      rating: parseFloat(productData.rating || '0'),
      salesCount: parseInt(productData.salesCount || '0', 10),
      viewCount: parseInt(productData.viewCount || '0', 10),
      store: productData.store || 'BHD Marketplace',
      imageUrl: productData.imageUrl,
      attributes: JSON.parse(productData.attributes || '{}'),
    };
  }

  private async getCandidateProducts(
    userVector: Partial<UserVector>,
    category?: string,
  ): Promise<(ProductVector & { name: string; currency: string; store: string; imageUrl?: string })[]> {
    // In production, this queries the product database
    // Returns products filtered by user's preferred categories
    const categories = category
      ? [category]
      : Object.keys(userVector.categoryPreferences || {}).slice(0, 5);

    if (categories.length === 0) {
      categories.push('electronics', 'fashion', 'home', 'beauty');
    }

    const products: any[] = [];
    for (const cat of categories) {
      const catProducts = await this.redis.smembers(`category:${cat}`);
      for (const pid of catProducts.slice(0, 50)) {
        const product = await this.getProductById(pid);
        if (product) products.push(product);
      }
    }

    // Remove duplicates
    return products.filter((p, i, arr) => arr.findIndex((t) => t.productId === p.productId) === i);
  }

  private calculateContentSimilarity(productA: ProductVector, productB: ProductVector): number {
    let score = 0;

    // Same category
    if (productA.category === productB.category) score += 0.3;

    // Same brand
    if (productA.brand === productB.brand) score += 0.2;

    // Price similarity
    const priceDiff = Math.abs(productA.price - productB.price);
    const avgPrice = (productA.price + productB.price) / 2 || 1;
    score += 0.2 * Math.max(0, 1 - priceDiff / avgPrice);

    // Tag overlap
    const commonTags = productA.tags.filter((t) => productB.tags.includes(t));
    const allTags = [...new Set([...productA.tags, ...productB.tags])];
    score += 0.15 * (allTags.length > 0 ? commonTags.length / allTags.length : 0);

    // Rating similarity
    score += 0.15 * (1 - Math.abs(productA.rating - productB.rating) / 5);

    return score;
  }

  private getComplementaryCategory(category: string): string | null {
    const complements: Record<string, string> = {
      electronics: 'accessories',
      fashion: 'accessories',
      phones: 'accessories',
      laptops: 'accessories',
      home: 'kitchen',
      kitchen: 'home',
      beauty: 'personal_care',
      sports: 'fitness',
    };
    return complements[category] || null;
  }

  private getActionWeight(type: string): number {
    const weights: Record<string, number> = {
      view: 1,
      cart: 3,
      purchase: 5,
      wishlist: 4,
      search: 2,
      review: 3,
    };
    return weights[type] || 1;
  }

  private generateReason(userVector: UserVector, product: any): string {
    const reasons: string[] = [];

    if (userVector.categoryPreferences[product.category]) {
      reasons.push(`Based on your interest in ${product.category}`);
    }
    if (userVector.brandPreferences[product.brand]) {
      reasons.push(`You liked ${product.brand} products`);
    }
    if (reasons.length === 0) {
      reasons.push(`Popular in ${product.category}`);
    }

    return reasons.join('. ');
  }

  private async getFallbackRecommendations(limit: number, category?: string): Promise<Recommendation[]> {
    // Return popular products as fallback
    const popularIds = await this.redis.zrevrange('products:popular', 0, limit - 1);
    const recommendations: Recommendation[] = [];

    for (const pid of popularIds) {
      const product = await this.getProductById(pid);
      if (product && (!category || product.category === category)) {
        recommendations.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          currency: product.currency || 'OMR',
          imageUrl: product.imageUrl,
          category: product.category,
          store: product.store,
          score: 0.7,
          reason: 'Popular among customers',
          algorithm: 'trending',
        });
      }
    }

    return recommendations;
  }
}
