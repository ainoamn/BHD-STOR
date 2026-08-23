import { NextRequest, NextResponse } from 'next/server';
import {
  backendOrigin,
  identityIssuer,
  oauthClientId,
  oauthStateCookieOptions,
} from '@/lib/bhd-identity';

export const runtime = 'nodejs';

function clearStoreCookies(response: NextResponse) {
  const base = oauthStateCookieOptions(0);
  for (const name of [
    'accessToken',
    'refreshToken',
    'bhd_session',
    'bhd_oauth_state',
    'bhd_sso_profile',
  ]) {
    response.cookies.set(name, '', { ...base, maxAge: 0 });
  }
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  try {
    await fetch(`${backendOrigin(request.url)}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
  } catch {
    // Store cookies are still cleared below.
  }

  const issuer = identityIssuer();
  const postLogout = `${origin}/`;
  const endSession = new URL('/oauth/end-session', issuer);
  endSession.searchParams.set('post_logout_redirect_uri', postLogout);
  endSession.searchParams.set('client_id', oauthClientId());

  const response = NextResponse.redirect(endSession);
  clearStoreCookies(response);
  return response;
}
