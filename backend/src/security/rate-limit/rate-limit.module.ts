/**
 * @fileoverview Rate Limiting Module
 * @description NestJS module providing distributed rate limiting with Redis backing.
 * Exports the service and guard for application-wide use.
 */

import { Module, Global } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * Global Rate Limiting Module
 *
 * Import this module once in the root AppModule to make rate limiting
 * available throughout the application. Uses Redis when available,
 * falling back to in-memory storage.
 *
 * @example
 * // In app.module.ts
 * imports: [RateLimitModule, ...]
 *
 * // In controller
 * @Controller('auth')
 * export class AuthController {
 *   @RateLimit(RateLimitPresets.LOGIN)
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) { ... }
 * }
 */
@Global()
@Module({
  providers: [RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
