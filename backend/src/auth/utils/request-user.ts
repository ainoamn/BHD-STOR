import { UnauthorizedException } from '@nestjs/common';

/**
 * Normalize authenticated user id from JWT / passport payloads.
 * Strategy returns `userId`; some legacy code reads `id` or `sub`.
 */
export function getRequestUserId(user: any): string | null {
  if (!user) return null;
  return user.userId || user.id || user.sub || null;
}

export function requireRequestUserId(user: any): string {
  const id = getRequestUserId(user);
  if (!id) {
    throw new UnauthorizedException('Authenticated user id missing from request');
  }
  return id;
}
