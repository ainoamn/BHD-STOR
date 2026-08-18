import { NextRequest, NextResponse } from 'next/server';
import {
  BHD_OAUTH_STATE_COOKIE,
  backendOrigin,
  isSafeNextPath,
  oauthStateCookieOptions,
  parseOAuthState,
} from '@/lib/bhd-identity';

export const runtime = 'nodejs';

function loginError(origin: string) {
  const response = NextResponse.redirect(new URL('/auth/login?error=sso', origin));
  response.cookies.set(BHD_OAUTH_STATE_COOKIE, '', { ...oauthStateCookieOptions(), maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const saved = parseOAuthState(request.cookies.get(BHD_OAUTH_STATE_COOKIE)?.value);

  if (error || !saved || saved.state !== state || !code) {
    return loginError(origin);
  }

  const completeRes = await fetch(`${backendOrigin()}/api/v1/auth/bhd/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      redirectUri: saved.redirectUri,
      codeVerifier: saved.verifier,
      nonce: saved.nonce,
    }),
  });

  if (!completeRes.ok) {
    return loginError(origin);
  }

  const dest = isSafeNextPath(saved.returnTo) ? saved.returnTo : '/';
  const response = NextResponse.redirect(new URL(dest, origin));
  const setCookies =
    typeof completeRes.headers.getSetCookie === 'function'
      ? completeRes.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie);
  }
  response.cookies.set(BHD_OAUTH_STATE_COOKIE, '', { ...oauthStateCookieOptions(), maxAge: 0 });
  return response;
}
