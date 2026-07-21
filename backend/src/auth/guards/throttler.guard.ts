import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottleLevel, THROTTLE_KEY } from '@common/decorators/throttle.decorator';

interface ThrottleConfig {
  windowMs: number;
  maxRequests: number;
}

const THROTTLE_CONFIGS: Record<ThrottleLevel, ThrottleConfig> = {
  // Default: 100 requests per 15 minutes
  [ThrottleLevel.DEFAULT]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
  // Strict: 5 requests per 5 minutes (for sensitive operations)
  [ThrottleLevel.STRICT]: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5,
  },
  // Lenient: 1000 requests per 15 minutes (for public/read operations)
  [ThrottleLevel.LENIENT]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
  },
  // Login: 5 login attempts per 5 minutes
  [ThrottleLevel.LOGIN]: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5,
  },
  // Registration: 3 registrations per hour
  [ThrottleLevel.REGISTER]: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  },
};

// In-memory store for rate limiting (use Redis in production)
const requestStore = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get throttle level from decorator
    const throttleLevel = this.reflector.getAllAndOverride<ThrottleLevel>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no throttle decorator, use default
    const level = throttleLevel || ThrottleLevel.DEFAULT;
    const config = THROTTLE_CONFIGS[level];

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate unique key (user ID if authenticated, otherwise IP + route)
    const key = this.generateKey(request, level);
    const now = Date.now();

    // Get or create entry
    let entry = requestStore.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    // Increment count
    entry.count++;
    requestStore.set(key, entry);

    // Calculate remaining requests
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTimeSeconds);

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      response.setHeader('Retry-After', retryAfter);

      this.logger.warn(
        `Rate limit exceeded for key: ${key}, level: ${level}`,
        'ThrottlerGuard',
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again after ${retryAfter} seconds.`,
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(request: any, level: ThrottleLevel): string {
    const userId = request.user?.sub;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const route = request.route?.path || request.path || '/';

    if (userId) {
      return `throttle:${level}:user:${userId}:${route}`;
    }

    return `throttle:${level}:ip:${ip}:${route}`;
  }
}
