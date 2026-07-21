import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { OpenAIService } from './openai.service';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  store: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
}

export interface SmartSuggestion {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  reason: string;
  discount?: number;
}

export interface DeliveryEstimate {
  method: string;
  cost: number;
  currency: string;
  estimatedDays: { min: number; max: number };
  estimatedDate: { from: string; to: string };
}

export interface CouponSuggestion {
  code: string;
  discount: string;
  savings: number;
  reason: string;
}

export interface CartAbandonmentPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: string[];
  recommendedActions: string[];
}

@Injectable()
export class SmartCartService {
  private readonly logger = new Logger(SmartCartService.name);
  private readonly redisPrefix = 'cart:';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Get smart complementary product suggestions for cart items
   */
  async getSmartSuggestions(cartItems: CartItem[]): Promise<SmartSuggestion[]> {
    if (!cartItems || cartItems.length === 0) return [];

    try {
      const suggestions: SmartSuggestion[] = [];
      const cartProductIds = cartItems.map((i) => i.productId);

      // Get complementary products for each cart item
      for (const item of cartItems) {
        const complementary = await this.redis.smembers(
          `${this.redisPrefix}complementary:${item.category}`,
        );

        for (const pid of complementary.slice(0, 3)) {
          if (cartProductIds.includes(pid)) continue;

          const productData = await this.redis.hgetall(`product:${pid}`);
          if (Object.keys(productData).length === 0) continue;

          const price = parseFloat(productData.price || '0');
          const existing = suggestions.find((s) => s.productId === pid);

          if (!existing) {
            suggestions.push({
              productId: pid,
              name: productData.name || 'Unknown',
              price,
              imageUrl: productData.imageUrl,
              reason: `Complements ${item.name}`,
              discount: productData.discount ? parseFloat(productData.discount) : undefined,
            });
          }
        }
      }

      // Get AI-powered cross-sell suggestions
      try {
        const cartSummary = cartItems
          .map((i) => `${i.name} (${i.category})`)
          .join(', ');

        const { content } = await this.openaiService.chatCompletion(
          [
            {
              role: 'system',
              content:
                'You are a cross-sell recommendation engine. Given cart items, suggest complementary products. Return ONLY a JSON array.',
            },
            {
              role: 'user',
              content: `Cart items: ${cartSummary}. Suggest up to 3 complementary products with reasons. Return JSON: [{"category": "...", "productType": "...", "reason": "..."}]`,
            },
          ],
          { temperature: 0.5, maxTokens: 500 },
        );

        const aiSuggestions = JSON.parse(content);
        // In production, resolve these categories to actual products
        this.logger.debug(`AI suggestions: ${JSON.stringify(aiSuggestions)}`);
      } catch (aiError) {
        this.logger.warn(`AI cross-sell failed: ${aiError.message}`);
      }

      return suggestions.slice(0, 6);
    } catch (error) {
      this.logger.error(`Failed to get smart suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Alert user when a product's price drops
   */
  async alertPriceDrops(userId: string, productId: string): Promise<boolean> {
    try {
      const alertKey = `${this.redisPrefix}price_alert:${userId}:${productId}`;
      const existing = await this.redis.exists(alertKey);

      if (existing) {
        this.logger.debug(`Price alert already exists for user ${userId}, product ${productId}`);
        return false;
      }

      const product = await this.redis.hgetall(`product:${productId}`);
      if (!product.price) return false;

      await this.redis.hset(alertKey, {
        userId,
        productId,
        originalPrice: product.price,
        targetPrice: parseFloat(product.price) * 0.9, // 10% drop target
        createdAt: new Date().toISOString(),
      });
      await this.redis.expire(alertKey, 30 * 24 * 3600); // 30 days expiry

      this.logger.log(`Price alert set for user ${userId} on product ${productId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set price alert: ${error.message}`);
      return false;
    }
  }

  /**
   * Check and notify price drops (called by cron job)
   */
  async checkPriceDrops(): Promise<Array<{ userId: string; productId: string; oldPrice: number; newPrice: number }>> {
    try {
      const alerts = await this.redis.keys(`${this.redisPrefix}price_alert:*`);
      const notifications: Array<{ userId: string; productId: string; oldPrice: number; newPrice: number }> = [];

      for (const alertKey of alerts) {
        const alert = await this.redis.hgetall(alertKey);
        const product = await this.redis.hgetall(`product:${alert.productId}`);

        if (product.price && parseFloat(product.price) <= parseFloat(alert.targetPrice)) {
          notifications.push({
            userId: alert.userId,
            productId: alert.productId,
            oldPrice: parseFloat(alert.originalPrice),
            newPrice: parseFloat(product.price),
          });

          // Remove alert after notification
          await this.redis.del(alertKey);
        }
      }

      return notifications;
    } catch (error) {
      this.logger.error(`Failed to check price drops: ${error.message}`);
      return [];
    }
  }

  /**
   * Compare multiple products with AI analysis
   */
  async compareProducts(productIds: string[]): Promise<{
    products: Array<{
      id: string;
      name: string;
      price: number;
      rating: number;
      specs: Record<string, string>;
    }>;
    comparison: string;
    winner: string;
    prosCons: Array<{
      productId: string;
      pros: string[];
      cons: string[];
    }>;
  }> {
    try {
      const products: any[] = [];
      for (const pid of productIds) {
        const product = await this.redis.hgetall(`product:${pid}`);
        if (Object.keys(product).length > 0) {
          products.push({
            id: pid,
            name: product.name || 'Unknown',
            price: parseFloat(product.price || '0'),
            rating: parseFloat(product.rating || '0'),
            specs: JSON.parse(product.specifications || '{}'),
          });
        }
      }

      if (products.length < 2) {
        return { products, comparison: 'Need at least 2 products to compare', winner: '', prosCons: [] };
      }

      // Use OpenAI for intelligent comparison
      const aiComparison = await this.openaiService.compareProducts(products);

      return {
        products,
        comparison: aiComparison.comparison,
        winner: aiComparison.winner,
        prosCons: aiComparison.prosCons,
      };
    } catch (error) {
      this.logger.error(`Failed to compare products: ${error.message}`);
      return { products: [], comparison: 'Comparison failed', winner: '', prosCons: [] };
    }
  }

  /**
   * Estimate delivery for cart items to a given address
   */
  async estimateDelivery(
    cartItems: CartItem[],
    address: {
      city: string;
      governorate: string;
      postalCode?: string;
      coordinates?: { lat: number; lng: number };
    },
  ): Promise<DeliveryEstimate[]> {
    try {
      const estimates: DeliveryEstimate[] = [];

      // Calculate total weight and dimensions
      const totalWeight = cartItems.reduce((sum, i) => sum + (i.weight || 1) * i.quantity, 0);
      const totalValue = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      // Standard delivery - Oman-wide
      const isMuscat = address.governorate.toLowerCase().includes('muscat');
      const isRemote = ['dhofar', 'musandam', 'al-wusta'].some((r) =>
        address.governorate.toLowerCase().includes(r),
      );

      // Standard delivery
      const standardDays = isMuscat ? { min: 1, max: 2 } : isRemote ? { min: 5, max: 7 } : { min: 2, max: 4 };
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() + standardDays.min);
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + standardDays.max);

      estimates.push({
        method: 'Standard Delivery',
        cost: totalValue > 50 ? 0 : isMuscat ? 2.0 : 3.5,
        currency: 'OMR',
        estimatedDays: standardDays,
        estimatedDate: {
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0],
        },
      });

      // Express delivery
      const expressDays = isMuscat ? { min: 0, max: 1 } : isRemote ? { min: 3, max: 4 } : { min: 1, max: 2 };
      const expressFromDate = new Date();
      expressFromDate.setDate(expressFromDate.getDate() + expressDays.min);
      const expressToDate = new Date();
      expressToDate.setDate(expressToDate.getDate() + expressDays.max);

      estimates.push({
        method: 'Express Delivery',
        cost: isMuscat ? 4.0 : 6.0,
        currency: 'OMR',
        estimatedDays: expressDays,
        estimatedDate: {
          from: expressFromDate.toISOString().split('T')[0],
          to: expressToDate.toISOString().split('T')[0],
        },
      });

      // Same day (Muscat only)
      if (isMuscat) {
        const sameDayDate = new Date();
        sameDayDate.setHours(20, 0, 0, 0);

        estimates.push({
          method: 'Same Day Delivery',
          cost: 7.0,
          currency: 'OMR',
          estimatedDays: { min: 0, max: 0 },
          estimatedDate: {
            from: sameDayDate.toISOString().split('T')[0],
            to: sameDayDate.toISOString().split('T')[0],
          },
        });
      }

      // Store pickup (if items from same store)
      const stores = [...new Set(cartItems.map((i) => i.store))];
      if (stores.length === 1) {
        const pickupDate = new Date();
        pickupDate.setDate(pickupDate.getDate() + 1);

        estimates.push({
          method: 'Store Pickup',
          cost: 0,
          currency: 'OMR',
          estimatedDays: { min: 0, max: 1 },
          estimatedDate: {
            from: new Date().toISOString().split('T')[0],
            to: pickupDate.toISOString().split('T')[0],
          },
        });
      }

      return estimates.sort((a, b) => a.cost - b.cost);
    } catch (error) {
      this.logger.error(`Failed to estimate delivery: ${error.message}`);
      return [
        {
          method: 'Standard Delivery',
          cost: 2.0,
          currency: 'OMR',
          estimatedDays: { min: 2, max: 4 },
          estimatedDate: {
            from: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            to: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          },
        },
      ];
    }
  }

  /**
   * Suggest the best available coupon for the cart
   */
  async suggestCoupon(cartItems: CartItem[], userId?: string): Promise<CouponSuggestion | null> {
    try {
      const cartValue = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const categories = [...new Set(cartItems.map((i) => i.category))];

      // Get available coupons from Redis
      const couponKeys = await this.redis.keys('coupon:*');
      let bestCoupon: CouponSuggestion | null = null;
      let maxSavings = 0;

      for (const key of couponKeys) {
        const coupon = await this.redis.hgetall(key);
        if (!coupon.code) continue;

        // Check minimum cart value
        if (coupon.minCartValue && cartValue < parseFloat(coupon.minCartValue)) continue;

        // Check category restrictions
        if (coupon.categories) {
          const allowedCategories = JSON.parse(coupon.categories);
          if (!categories.some((c) => allowedCategories.includes(c))) continue;
        }

        // Check user-specific
        if (coupon.userId && coupon.userId !== userId) continue;

        // Check expiry
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) continue;

        // Calculate savings
        let savings = 0;
        if (coupon.discountType === 'percentage') {
          savings = cartValue * (parseFloat(coupon.discountValue) / 100);
          if (coupon.maxDiscount) {
            savings = Math.min(savings, parseFloat(coupon.maxDiscount));
          }
        } else if (coupon.discountType === 'fixed') {
          savings = parseFloat(coupon.discountValue);
        } else if (coupon.discountType === 'free_shipping') {
          savings = 2.0; // Standard shipping cost
        }

        if (savings > maxSavings) {
          maxSavings = savings;
          bestCoupon = {
            code: coupon.code,
            discount: this.formatDiscount(coupon),
            savings: Math.round(savings * 1000) / 1000,
            reason: coupon.description || `Save OMR ${savings.toFixed(3)} on this order`,
          };
        }
      }

      // Fallback: suggest first-order discount for new users
      if (!bestCoupon && userId) {
        const orderCount = await this.redis.scard(`user_orders:${userId}`);
        if (orderCount === 0) {
          const firstOrderDiscount = cartValue * 0.15;
          bestCoupon = {
            code: 'WELCOME15',
            discount: '15% off',
            savings: Math.round(firstOrderDiscount * 1000) / 1000,
            reason: 'Welcome discount for your first order!',
          };
        }
      }

      return bestCoupon;
    } catch (error) {
      this.logger.error(`Failed to suggest coupon: ${error.message}`);
      return null;
    }
  }

  /**
   * Predict if a user is likely to abandon their cart
   */
  async predictCartAbandonment(userId: string): Promise<CartAbandonmentPrediction> {
    try {
      const cartKey = `${this.redisPrefix}active:${userId}`;
      const cartData = await this.redis.hgetall(cartKey);

      if (!cartData || Object.keys(cartData).length === 0) {
        return { riskLevel: 'low', riskScore: 0, factors: ['No active cart'], recommendedActions: [] };
      }

      const factors: string[] = [];
      let riskScore = 0;

      // Check cart age
      const cartAge = Date.now() - parseInt(cartData.lastUpdated || Date.now().toString());
      const hoursSinceUpdate = cartAge / (1000 * 3600);

      if (hoursSinceUpdate > 24) {
        riskScore += 30;
        factors.push(`Cart idle for ${Math.floor(hoursSinceUpdate)} hours`);
      } else if (hoursSinceUpdate > 4) {
        riskScore += 15;
        factors.push('Cart idle for several hours');
      }

      // Check cart value
      const cartValue = parseFloat(cartData.totalValue || '0');
      if (cartValue > 200) {
        riskScore += 10;
        factors.push('High-value cart - decision hesitation');
      } else if (cartValue < 10) {
        riskScore += 5;
        factors.push('Low cart value - may not be motivated');
      }

      // Check user history
      const orderCount = await this.redis.scard(`user_orders:${userId}`);
      if (orderCount === 0) {
        riskScore += 20;
        factors.push('New user - no purchase history');
      }

      // Check previous abandonment
      const previousAbandonments = await this.redis.get(`${this.redisPrefix}abandoned_count:${userId}`);
      if (previousAbandonments && parseInt(previousAbandonments) > 2) {
        riskScore += 15;
        factors.push('History of cart abandonment');
      }

      // Check if user visited checkout
      const visitedCheckout = await this.redis.exists(`checkout:visited:${userId}`);
      if (!visitedCheckout) {
        riskScore += 10;
        factors.push('Hesitated at checkout');
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 60) riskLevel = 'critical';
      else if (riskScore >= 40) riskLevel = 'high';
      else if (riskScore >= 20) riskLevel = 'medium';
      else riskLevel = 'low';

      // Recommended actions based on risk
      const recommendedActions: string[] = [];
      if (riskLevel === 'critical' || riskLevel === 'high') {
        recommendedActions.push('Send personalized discount offer');
        recommendedActions.push('Send reminder via WhatsApp/SMS');
        recommendedActions.push('Offer free shipping');
      }
      if (riskLevel === 'medium') {
        recommendedActions.push('Send gentle email reminder');
        recommendedActions.push('Show limited stock warning');
      }

      return {
        riskLevel,
        riskScore: Math.min(riskScore, 100),
        factors,
        recommendedActions,
      };
    } catch (error) {
      this.logger.error(`Failed to predict cart abandonment: ${error.message}`);
      return { riskLevel: 'low', riskScore: 0, factors: [], recommendedActions: [] };
    }
  }

  /**
   * Send cart recovery communication to user
   */
  async sendRecoveryEmail(userId: string): Promise<{
    sent: boolean;
    channel: 'email' | 'whatsapp' | 'sms';
    template: string;
  }> {
    try {
      const cartKey = `${this.redisPrefix}active:${userId}`;
      const cartData = await this.redis.hgetall(cartKey);

      if (!cartData.items) {
        return { sent: false, channel: 'email', template: '' };
      }

      const items = JSON.parse(cartData.items);
      const cartValue = parseFloat(cartData.totalValue || '0');

      // Generate recovery message using AI
      const template = await this.openaiService.generateResponseTemplate('abandoned_cart', {
        userId,
        items: items.map((i: any) => i.name),
        cartValue,
        currency: 'OMR',
      });

      // Log recovery attempt
      await this.redis.incr(`${this.redisPrefix}recovery_sent:${userId}`);

      // Track the abandoned cart for analytics
      await this.redis.incr(`${this.redisPrefix}abandoned_count:${userId}`);

      this.logger.log(`Recovery email prepared for user ${userId}, cart value: OMR ${cartValue}`);

      return {
        sent: true,
        channel: 'email',
        template: template.body,
      };
    } catch (error) {
      this.logger.error(`Failed to send recovery: ${error.message}`);
      return { sent: false, channel: 'email', template: '' };
    }
  }

  /**
   * Get abandoned carts for recovery batch processing
   */
  async getAbandonedCarts(olderThanHours: number = 4): Promise<
    Array<{
      userId: string;
      cartValue: number;
      items: CartItem[];
      abandonedSince: Date;
    }>
  > {
    try {
      const keys = await this.redis.keys(`${this.redisPrefix}active:*`);
      const abandoned: Array<any> = [];
      const cutoff = Date.now() - olderThanHours * 3600 * 1000;

      for (const key of keys) {
        const userId = key.replace(`${this.redisPrefix}active:`, '');
        const cartData = await this.redis.hgetall(key);
        const lastUpdated = parseInt(cartData.lastUpdated || '0');

        if (lastUpdated < cutoff && cartData.items) {
          abandoned.push({
            userId,
            cartValue: parseFloat(cartData.totalValue || '0'),
            items: JSON.parse(cartData.items),
            abandonedSince: new Date(lastUpdated),
          });
        }
      }

      return abandoned;
    } catch (error) {
      this.logger.error(`Failed to get abandoned carts: ${error.message}`);
      return [];
    }
  }

  private formatDiscount(coupon: Record<string, string>): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% off`;
    } else if (coupon.discountType === 'fixed') {
      return `OMR ${coupon.discountValue} off`;
    } else if (coupon.discountType === 'free_shipping') {
      return 'Free shipping';
    }
    return coupon.discountValue || '';
  }
}
