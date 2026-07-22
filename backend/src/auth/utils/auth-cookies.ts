import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';
export const SESSION_FLAG_COOKIE = 'bhd_session';

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  config: ConfigService,
): void {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const accessMaxAgeMs = parseDurationMs(config.get<string>('JWT_EXPIRES_IN', '15m'), 15 * 60 * 1000);
  const refreshMaxAgeMs = parseDurationMs(
    config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    7 * 24 * 60 * 60 * 1000,
  );

  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };

  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: accessMaxAgeMs,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: refreshMaxAgeMs,
  });
  // Non-HttpOnly flag so Next.js middleware can detect a session without reading JWTs
  res.cookie(SESSION_FLAG_COOKIE, '1', {
    httpOnly: false,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: refreshMaxAgeMs,
  });
}

export function clearAuthCookies(res: Response, config: ConfigService): void {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
  res.clearCookie(SESSION_FLAG_COOKIE, {
    httpOnly: false,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  });
}

function parseDurationMs(value: string, fallback: number): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) return fallback;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return amount * mult;
}
