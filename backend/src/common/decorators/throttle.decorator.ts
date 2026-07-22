import { SetMetadata } from '@nestjs/common';

export enum ThrottleLevel {
  DEFAULT = 'default',
  STRICT = 'strict',
  LENIENT = 'lenient',
  LOGIN = 'login',
  REGISTER = 'register',
  /** Public webhooks (Stripe bursts) — higher ceiling than STRICT */
  WEBHOOK = 'webhook',
}

export const THROTTLE_KEY = 'throttle';

/**
 * Decorator to apply rate limiting to a specific route.
 *
 * @example
 * @Throttle(ThrottleLevel.STRICT)
 * @Post('login')
 * async login() { ... }
 */
export const Throttle = (level: ThrottleLevel) => SetMetadata(THROTTLE_KEY, level);
