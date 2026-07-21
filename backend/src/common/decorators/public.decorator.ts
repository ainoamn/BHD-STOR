import { SetMetadata } from '@nestjs/common';

/**
 * Key used to identify public routes that don't require authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route or controller as public (no authentication required).
 * Used for endpoints like login, register, health checks, etc.
 *
 * @example
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);\n