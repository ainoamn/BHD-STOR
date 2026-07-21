/**
 * @fileoverview Rate Limit Decorator
 * @description Custom decorator to configure rate limiting per endpoint.
 * Follows OWASP API Security best practices for rate limiting.
 *
 * @example
 * @RateLimit({ limit: 20, window: 60, keyPrefix: 'auth:login' })
 * @Post('login')
 * async login(@Body() dto: LoginDto) { ... }
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;

  /** Time window in seconds */
  window: number;

  /** Key prefix for Redis storage (e.g., 'auth:login', 'api:search') */
  keyPrefix?: string;

  /** Whether to skip rate limiting for this endpoint */
  skip?: boolean;
}

/** Metadata key used by the RateLimitGuard to extract configuration */
export const RATE_LIMIT_KEY = 'rate_limit_options';

/**
 * Predefined rate limit configurations for common endpoint categories.
 * Aligned with OWASP recommendations for e-commerce platforms.
 */
export const RateLimitPresets = {
  /** Authentication endpoints - very strict to prevent brute force */
  AUTH: { limit: 5, window: 60, keyPrefix: 'auth' } as RateLimitOptions,

  /** Login-specific endpoint - extra strict */
  LOGIN: { limit: 5, window: 60, keyPrefix: 'auth:login' } as RateLimitOptions,

  /** Password reset endpoints */
  PASSWORD_RESET: { limit: 3, window: 3600, keyPrefix: 'auth:password-reset' } as RateLimitOptions,

  /** Registration endpoints - prevent mass account creation */
  REGISTER: { limit: 3, window: 3600, keyPrefix: 'auth:register' } as RateLimitOptions,

  /** OTP/2FA verification endpoints */
  OTP: { limit: 3, window: 300, keyPrefix: 'auth:otp' } as RateLimitOptions,

  /** General API endpoints - standard limit */
  API_GENERAL: { limit: 100, window: 60, keyPrefix: 'api:general' } as RateLimitOptions,

  /** Strict API endpoints - for sensitive operations */
  API_STRICT: { limit: 20, window: 60, keyPrefix: 'api:strict' } as RateLimitOptions,

  /** File upload endpoints - prevent abuse */
  UPLOAD: { limit: 10, window: 60, keyPrefix: 'api:upload' } as RateLimitOptions,

  /** AI/ML service endpoints - resource intensive */
  AI: { limit: 10, window: 60, keyPrefix: 'api:ai' } as RateLimitOptions,

  /** Search endpoints - prevent scraping */
  SEARCH: { limit: 30, window: 60, keyPrefix: 'api:search' } as RateLimitOptions,

  /** Checkout/payment endpoints - critical path */
  CHECKOUT: { limit: 10, window: 60, keyPrefix: 'api:checkout' } as RateLimitOptions,

  /** Webhook endpoints - per-integration limit */
  WEBHOOK: { limit: 50, window: 60, keyPrefix: 'api:webhook' } as RateLimitOptions,

  /** Admin endpoints - privileged access */
  ADMIN: { limit: 200, window: 60, keyPrefix: 'api:admin' } as RateLimitOptions,

  /** Public catalog endpoints - generous for browsing */
  CATALOG: { limit: 200, window: 60, keyPrefix: 'api:catalog' } as RateLimitOptions,
} as const;

/**
 * RateLimit decorator - Apply rate limiting to a controller method.
 *
 * Uses a sliding window algorithm backed by Redis for distributed rate limiting.
 * The limit key combines IP address and user ID (when authenticated) for accurate tracking.
 *
 * @param options - Rate limit configuration or a preset key from RateLimitPresets
 *
 * @example
 * // Using a preset
 * @RateLimit(RateLimitPresets.AUTH)
 * @Post('login')
 * async login(@Body() dto: LoginDto) { ... }
 *
 * // Custom configuration
 * @RateLimit({ limit: 50, window: 60, keyPrefix: 'custom:endpoint' })
 * @Get('custom')
 * async customEndpoint() { ... }
 */
export const RateLimit = (options: RateLimitOptions): MethodDecorator & ClassDecorator => {
  return SetMetadata(RATE_LIMIT_KEY, options);
};
