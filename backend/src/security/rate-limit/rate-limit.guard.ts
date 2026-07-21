/**
 * @fileoverview Rate Limit Guard
 * @description NestJS guard that enforces rate limits on API endpoints.
 * Uses the @RateLimit decorator configuration and returns 429 when exceeded.
 *
 * OWASP: Implements API4:2023 - Unrestricted Resource Consumption protection.
 * Follows RFC 6585 for 429 Too Many Requests responses with Retry-After header.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

/**
 * Extract client IP from request, handling proxies and load balancers.
 * Follows OWASP guidance for IP extraction behind proxies.
 */
function extractClientIp(req: Request): string {
  // Check X-Forwarded-For header (common behind load balancers)
  // OWASP: Validate/trust only from known proxies to prevent IP spoofing
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    // Take the first IP in the chain (closest to the client)
    // Only trust if behind a known proxy (should be validated in production)
    const ips = forwarded.split(',').map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0];
    }
  }

  // Check X-Real-IP header (Nginx, etc.)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Fall back to direct connection IP
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Build the rate limit identifier from request context.
 * Combines IP address with authenticated user ID for per-user limiting.
 */
function buildIdentifier(req: Request): string {
  const ip = extractClientIp(req);
  // @ts-expect-error user may be attached by auth middleware
  const userId = req.user?.id || req.user?.sub;

  // Combine IP and user ID for dual-key rate limiting
  // This prevents: shared IP bypass and per-user tracking
  if (userId) {
    return `${ip}:${userId}`;
  }

  return ip;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  /**
   * Determine if the request is allowed based on rate limit configuration.
   *
   * @param context - Execution context
   * @returns true if request is allowed, throws HttpException otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract rate limit configuration from decorator metadata
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @RateLimit decorator, apply a default limit
    // OWASP: Defense in depth - always have some rate limiting
    const options: RateLimitOptions = rateLimitOptions || {
      limit: 100,
      window: 60,
      keyPrefix: 'api:default',
    };

    // Skip rate limiting if explicitly disabled
    if (options.skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const identifier = buildIdentifier(request);

    // Perform rate limit check
    const result = await this.rateLimitService.check(
      identifier,
      options.limit,
      options.window,
      options.keyPrefix || 'api:default',
    );

    // Set rate limit headers on every response (RFC 6585 compliant)
    response.setHeader('X-RateLimit-Limit', String(result.limit));
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
    response.setHeader('X-RateLimit-Reset', String(result.resetTime));

    // If rate limit exceeded, return 429 Too Many Requests
    if (!result.allowed) {
      // Set Retry-After header as per RFC 6585
      response.setHeader('Retry-After', String(result.retryAfter));

      // Log the rate limit hit for security monitoring
      this.logger.warn(
        `Rate limit exceeded: ${identifier} ` +
          `on ${request.method} ${request.path} ` +
          `(${options.keyPrefix}, limit: ${options.limit}/${options.window}s, ` +
          `retryAfter: ${result.retryAfter}s)`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
          limit: result.limit,
          window: options.window,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
