import { NextRequest, NextResponse } from 'next/server';
import {
  BHD_OAUTH_STATE_COOKIE,
  backendOrigin,
  exchangeAuthorizationCode,
  isSafeNextPath,
  oauthClientSecret,
  oauthStateCookieOptions,
  parseOAuthState,
} from '@/lib/bhd-identity';

export const runtime = 'nodejs';

function loginError(origin: string, reason: string) {
  const response = NextResponse.redirect(
    new URL(`/auth/login?error=sso&reason=${encodeURIComponent(reason)}`, origin),
  );
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

  if (error) {
    return loginError(origin, error);
  }
  if (!saved || saved.state !== state || !code) {
    return loginError(origin, 'state');
  }

  let idToken = '';
  let accessToken = '';
  if (oauthClientSecret()) {
    try {
      const tokens = await exchangeAuthorizationCode({
        code,
        redirectUri: saved.redirectUri,
        codeVerifier: saved.verifier,
      });
      idToken = tokens.idToken;
      accessToken = tokens.accessToken;
    } catch {
      return loginError(origin, 'identity');
    }
  }

  const completeUrl = `${backendOrigin(request.url)}/api/v1/auth/bhd/complete`;
  const body = idToken
    ? { idToken, accessToken, nonce: saved.nonce }
    : {
        code,
        redirectUri: saved.redirectUri,
        codeVerifier: saved.verifier,
        nonce: saved.nonce,
      };

  let completeRes: Response;
  try {
    completeRes = await fetch(completeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return loginError(origin, 'backend');
  }

  if (!completeRes.ok) {
    const reason = completeRes.status === 404 || completeRes.status >= 500 ? 'backend' : 'complete';
    return loginError(origin, reason);
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
