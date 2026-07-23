import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ThrottleLevel, THROTTLE_KEY } from '@common/decorators/throttle.decorator';

interface ThrottleConfig {
  windowMs: number;
  maxRequests: number;
}

interface ThrottleHit {
  count: number;
  resetTime: number;
  store: 'redis' | 'memory';
}

const THROTTLE_CONFIGS: Record<ThrottleLevel, ThrottleConfig> = {
  [ThrottleLevel.DEFAULT]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
  [ThrottleLevel.STRICT]: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5,
  },
  [ThrottleLevel.LENIENT]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
  },
  [ThrottleLevel.LOGIN]: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5,
  },
  [ThrottleLevel.REGISTER]: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  },
  [ThrottleLevel.WEBHOOK]: {
    windowMs: 60 * 1000,
    maxRequests: 120,
  },
};

/** Process-local fallback when Redis is down or unavailable. */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(ThrottlerGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Optional() @InjectRedis() private readonly redis?: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const throttleLevel = this.reflector.getAllAndOverride<ThrottleLevel>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const level = throttleLevel || ThrottleLevel.DEFAULT;
    const config = THROTTLE_CONFIGS[level];

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const key = this.generateKey(request, level);
    const now = Date.now();
    const entry = await this.hit(key, config);

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTimeSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));

    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTimeSeconds);
    response.setHeader('X-RateLimit-Store', entry.store);

    if (entry.count > config.maxRequests) {
      response.setHeader('Retry-After', resetTimeSeconds);

      this.logger.warn(
        `Rate limit exceeded for key: ${key}, level: ${level}`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again after ${resetTimeSeconds} seconds.`,
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetTimeSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private async hit(key: string, config: ThrottleConfig): Promise<ThrottleHit> {
    if (this.redis) {
      try {
        const hit = await this.hitRedis(key, config);
        return { ...hit, store: 'redis' };
      } catch (err) {
        this.logger.warn(
          `Redis throttle failed; using in-memory store: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    const hit = this.hitMemory(key, config);
    return { ...hit, store: 'memory' };
  }

  private async hitRedis(
    key: string,
    config: ThrottleConfig,
  ): Promise<Omit<ThrottleHit, 'store'>> {
    const redisKey = `bhd:rl:${key}`;
    const count = await this.redis!.incr(redisKey);
    if (count === 1) {
      await this.redis!.pexpire(redisKey, config.windowMs);
    }

    let ttl = await this.redis!.pttl(redisKey);
    if (ttl < 0) {
      await this.redis!.pexpire(redisKey, config.windowMs);
      ttl = config.windowMs;
    }

    return {
      count,
      resetTime: Date.now() + ttl,
    };
  }

  private hitMemory(
    key: string,
    config: ThrottleConfig,
  ): Omit<ThrottleHit, 'store'> {
    const now = Date.now();
    let entry = memoryStore.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }
    entry.count++;
    memoryStore.set(key, entry);
    return { count: entry.count, resetTime: entry.resetTime };
  }

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
