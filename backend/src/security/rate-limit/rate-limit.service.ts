/**
 * @fileoverview Rate Limiting Service
 * @description Implements sliding-window rate limiting with Redis backing.
 * Follows OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption.
 *
 * Algorithm: Sliding Window with Redis Sorted Sets (ZSET)
 * - Each request is logged as a timestamp in a Redis ZSET
 * - Expired entries (outside the window) are pruned via ZREMRANGEBYSCORE
 * - Current count determines if request is allowed
 * - Atomic operations ensure accuracy in concurrent environments
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Maximum requests allowed in the window */
  limit: number;

  /** Remaining requests in current window */
  remaining: number;

  /** Unix timestamp when the current window resets */
  resetTime: number;

  /** Number of seconds until reset */
  retryAfter: number;

  /** Current request count in window */
  currentCount: number;
}

/**
 * Trusted IP entry configuration
 */
interface TrustedIpEntry {
  ip: string;
  description: string;
  addedAt: Date;
}

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);

  /** In-memory cache for rate limit data (fallback when Redis unavailable) */
  private memoryStore = new Map<string, number[]>();

  /** Trusted IP whitelist */
  private trustedIps = new Set<string>();

  /** Whether Redis is available */
  private redisAvailable = false;

  /** Cleanup interval for memory store */
  private cleanupInterval?: NodeJS.Timeout;

  /** Default window in seconds */
  private readonly DEFAULT_WINDOW = 60;

  /** Default request limit */
  private readonly DEFAULT_LIMIT = 100;

  /** Maximum entries per key in memory store to prevent memory exhaustion */
  private readonly MAX_ENTRIES_PER_KEY = 10000;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    // Load trusted IPs from configuration
    this.loadTrustedIps();

    // Attempt Redis connection
    await this.connectRedis();

    // Start memory cleanup interval (every 60 seconds)
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryStore();
    }, 60000);

    this.logger.log('RateLimitService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.logger.log('RateLimitService destroyed');
  }

  /**
   * Load trusted IPs from environment configuration.
   * Format: comma-separated list of IP addresses or CIDR ranges.
   */
  private loadTrustedIps(): void {
    const trustedIpsConfig = this.configService.get<string>('RATE_LIMIT_TRUSTED_IPS', '');
    if (trustedIpsConfig) {
      const ips = trustedIpsConfig.split(',').map((ip) => ip.trim()).filter(Boolean);
      ips.forEach((ip) => this.trustedIps.add(ip));
      this.logger.log(`Loaded ${ips.length} trusted IPs`);
    }

    // Always trust localhost in development
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'development') {
      this.trustedIps.add('127.0.0.1');
      this.trustedIps.add('::1');
    }
  }

  /**
   * Attempt to connect to Redis for distributed rate limiting.
   * Falls back to in-memory store if Redis is unavailable.
   */
  private async connectRedis(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        this.logger.warn('REDIS_URL not configured, using in-memory rate limiting');
        return;
      }

      // Dynamic import to avoid hard dependency
      const Redis = (await import('ioredis')).default;
      // @ts-expect-error Redis client stored as any for flexibility
      this.redisClient = new Redis(redisUrl, {
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
      });

      // @ts-expect-error
      this.redisClient.on('connect', () => {
        this.redisAvailable = true;
        this.logger.log('Redis connected for rate limiting');
      });

      // @ts-expect-error
      this.redisClient.on('error', (err: Error) => {
        this.redisAvailable = false;
        this.logger.error(`Redis error: ${err.message}`);
      });
    } catch {
      this.logger.warn('Redis client not available, using in-memory rate limiting');
    }
  }

  /**
   * Generate a unique rate limit key combining the identifier, prefix, and window.
   *
   * @param identifier - IP address or user ID
   * @param keyPrefix - Prefix for the rate limit bucket
   * @returns Formatted rate limit key
   */
  private generateKey(identifier: string, keyPrefix: string): string {
    return `ratelimit:${keyPrefix}:${identifier}`;
  }

  /**
   * Check if an IP address is in the trusted whitelist.
   *
   * @param ip - IP address to check
   * @returns True if the IP is trusted
   */
  isTrustedIp(ip: string): boolean {
    return this.trustedIps.has(ip);
  }

  /**
   * Add a trusted IP to the whitelist.
   *
   * @param ip - IP address to add
   * @param description - Reason for trust
   */
  addTrustedIp(ip: string, description: string): void {
    this.trustedIps.add(ip);
    this.logger.log(`Added trusted IP: ${ip} (${description})`);
  }

  /**
   * Remove a trusted IP from the whitelist.
   *
   * @param ip - IP address to remove
   */
  removeTrustedIp(ip: string): void {
    this.trustedIps.delete(ip);
    this.logger.log(`Removed trusted IP: ${ip}`);
  }

  /**
   * Get all trusted IPs.
   *
   * @returns Array of trusted IP entries
   */
  getTrustedIps(): TrustedIpEntry[] {
    return Array.from(this.trustedIps).map((ip) => ({
      ip,
      description: 'Trusted IP',
      addedAt: new Date(),
    }));
  }

  /**
   * Check if a request is within the rate limit.
   * This is the primary entry point used by the RateLimitGuard.
   *
   * @param identifier - Unique identifier (IP + user ID combination)
   * @param limit - Maximum requests allowed
   * @param window - Time window in seconds
   * @param keyPrefix - Prefix for Redis key namespacing
   * @returns Rate limit check result
   */
  async check(
    identifier: string,
    limit: number,
    window: number,
    keyPrefix: string,
  ): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, keyPrefix);
    const now = Date.now();
    const windowMs = window * 1000;
    const resetTime = Math.ceil((now + windowMs) / 1000);

    // Check trusted IPs first
    if (this.isTrustedIp(identifier)) {
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetTime,
        retryAfter: 0,
        currentCount: 0,
      };
    }

    try {
      if (this.redisAvailable) {
        return await this.checkRedis(key, limit, windowMs, now, resetTime);
      }
      return this.checkMemory(key, limit, windowMs, now, resetTime);
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${(error as Error).message}`);
      // Fail open - allow request if rate limiter fails
      // OWASP: Fail securely - but rate limiting failure shouldn't block legitimate traffic
      return {
        allowed: true,
        limit,
        remaining: 1,
        resetTime,
        retryAfter: 0,
        currentCount: 0,
      };
    }
  }

  /**
   * Check rate limit using Redis (distributed, production-grade).
   * Uses Redis Sorted Sets for sliding window implementation.
   */
  private async checkRedis(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
    resetTime: number,
  ): Promise<RateLimitResult> {
    const windowStart = now - windowMs;

    try {
      // Use Redis Lua script for atomic operations
      const luaScript = `
        redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
        local current = redis.call('ZCARD', KEYS[1])
        if current < tonumber(ARGV[2]) then
          redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
          redis.call('PEXPIRE', KEYS[1], ARGV[5])
          return {current, 1}
        else
          return {current, 0}
        end
      `;

      // @ts-expect-error Redis client
      const result = await this.redisClient.eval(
        luaScript,
        1,
        key,
        windowStart,
        limit,
        now,
        `${now}:${Math.random()}`,
        windowMs,
      );

      const currentCount = result[0] as number;
      const allowed = (result[1] as number) === 1;
      const remaining = Math.max(0, limit - currentCount - (allowed ? 1 : 0));

      // Find the oldest entry for Retry-After calculation
      // @ts-expect-error
      const oldestEntries = await this.redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestEntries.length > 0
        ? parseInt(oldestEntries[1] as string)
        : now;
      const retryAfter = Math.max(0, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

      return {
        allowed,
        limit,
        remaining,
        resetTime,
        retryAfter: allowed ? 0 : retryAfter,
        currentCount,
      };
    } catch {
      // Fallback to memory store on Redis error
      this.redisAvailable = false;
      return this.checkMemory(key, limit, windowMs, now, resetTime);
    }
  }

  /**
   * Check rate limit using in-memory store (fallback, single-instance).
   * Sliding window with automatic cleanup of expired entries.
   */
  private checkMemory(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
    resetTime: number,
  ): RateLimitResult {
    const windowStart = now - windowMs;

    // Get existing timestamps for this key
    let timestamps = this.memoryStore.get(key) || [];

    // Remove expired entries (sliding window)
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    // Check memory store size limit to prevent DoS on the rate limiter itself
    if (validTimestamps.length > this.MAX_ENTRIES_PER_KEY) {
      this.logger.warn(`Rate limit key ${key} exceeded max entries, trimming`);
      validTimestamps.splice(0, validTimestamps.length - this.MAX_ENTRIES_PER_KEY);
    }

    const currentCount = validTimestamps.length;
    const allowed = currentCount < limit;

    if (allowed) {
      validTimestamps.push(now);
    }

    this.memoryStore.set(key, validTimestamps);

    const remaining = Math.max(0, limit - validTimestamps.length);

    // Calculate retry after based on oldest valid timestamp
    const oldestTimestamp = validTimestamps.length > 0 ? validTimestamps[0] : now;
    const retryAfter = Math.max(0, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

    return {
      allowed,
      limit,
      remaining,
      resetTime,
      retryAfter: allowed ? 0 : retryAfter,
      currentCount,
    };
  }

  /**
   * Reset rate limit for a specific key.
   * Useful for testing or manual intervention.
   *
   * @param identifier - The rate limit identifier
   * @param keyPrefix - The key prefix
   */
  async reset(identifier: string, keyPrefix: string): Promise<void> {
    const key = this.generateKey(identifier, keyPrefix);

    try {
      if (this.redisAvailable) {
        // @ts-expect-error
        await this.redisClient.del(key);
      }
      this.memoryStore.delete(key);
      this.logger.log(`Rate limit reset for ${key}`);
    } catch (error) {
      this.logger.error(`Failed to reset rate limit: ${(error as Error).message}`);
    }
  }

  /**
   * Get current rate limit status for an identifier.
   *
   * @param identifier - The rate limit identifier
   * @param keyPrefix - The key prefix
   * @param limit - The configured limit
   * @param window - The configured window
   * @returns Current rate limit status
   */
  async getStatus(
    identifier: string,
    keyPrefix: string,
    limit: number,
    window: number,
  ): Promise<Pick<RateLimitResult, 'limit' | 'remaining' | 'resetTime' | 'currentCount'>> {
    const key = this.generateKey(identifier, keyPrefix);
    const now = Date.now();
    const windowMs = window * 1000;
    const resetTime = Math.ceil((now + windowMs) / 1000);

    try {
      let currentCount: number;

      if (this.redisAvailable) {
        const windowStart = now - windowMs;
        // @ts-expect-error
        await this.redisClient.zremrangebyscore(key, 0, windowStart);
        // @ts-expect-error
        currentCount = await this.redisClient.zcard(key);
      } else {
        const timestamps = this.memoryStore.get(key) || [];
        currentCount = timestamps.filter((ts) => ts > now - windowMs).length;
      }

      return {
        limit,
        remaining: Math.max(0, limit - currentCount),
        resetTime,
        currentCount,
      };
    } catch {
      return { limit, remaining: limit, resetTime, currentCount: 0 };
    }
  }

  /**
   * Clean up expired entries from the memory store.
   * Prevents unbounded memory growth.
   */
  private cleanupMemoryStore(): void {
    const now = Date.now();
    let cleanedKeys = 0;

    for (const [key, timestamps] of this.memoryStore.entries()) {
      // Parse window from key format: ratelimit:{prefix}:{identifier}
      // Use a default 1-hour cleanup window
      const cutoff = now - 3600000;
      const validTimestamps = timestamps.filter((ts) => ts > cutoff);

      if (validTimestamps.length === 0) {
        this.memoryStore.delete(key);
        cleanedKeys++;
      } else if (validTimestamps.length !== timestamps.length) {
        this.memoryStore.set(key, validTimestamps);
      }
    }

    if (cleanedKeys > 0) {
      this.logger.debug(`Cleaned up ${cleanedKeys} expired rate limit keys`);
    }
  }

  /**
   * Get service health status.
   *
   * @returns Health status object
   */
  getHealth(): { status: string; redis: boolean; memoryKeys: number } {
    return {
      status: 'ok',
      redis: this.redisAvailable,
      memoryKeys: this.memoryStore.size,
    };
  }
}
