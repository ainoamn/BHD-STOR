import { NextRequest, NextResponse } from 'next/server';
import {
  mintStoreSessionTokens,
  productSessionCookieOptions,
  readStoreAccessProfile,
} from '@/lib/bhd-identity';
import { SESSION_IDLE_MAX_AGE_SEC } from '@/lib/bhd/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    return new NextResponse(null, { status: 204 });
  }

  const profile = readStoreAccessProfile(token);
  if (!profile) {
    return new NextResponse(null, { status: 204 });
  }

  const tokens = mintStoreSessionTokens(profile);
  const response = NextResponse.json({ ok: true, idleSec: SESSION_IDLE_MAX_AGE_SEC });
  response.cookies.set('accessToken', tokens.accessToken, productSessionCookieOptions(SESSION_IDLE_MAX_AGE_SEC));
  response.cookies.set(
    'refreshToken',
    tokens.refreshToken,
    productSessionCookieOptions(SESSION_IDLE_MAX_AGE_SEC),
  );
  response.cookies.set('bhd_session', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_IDLE_MAX_AGE_SEC,
  });
  return response;
}
