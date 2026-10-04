import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PRODUCT_SESSION_MAX_AGE_MS } from './session-policy';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';
export const SESSION_FLAG_COOKIE = 'bhd_session';

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  config: ConfigService,
): void {
  const isProd = config.get<string>('NODE_ENV') === 'production';

  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: PRODUCT_SESSION_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: PRODUCT_SESSION_MAX_AGE_MS,
  });
  // Non-HttpOnly UX flag only — Next.js middleware requires accessToken/refreshToken.
  res.cookie(SESSION_FLAG_COOKIE, '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: PRODUCT_SESSION_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response, config: ConfigService): void {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
  res.clearCookie(SESSION_FLAG_COOKIE, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
}
