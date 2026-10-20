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

async function clearNestSession(request: NextRequest) {
  try {
    await fetch(`${backendOrigin(request.url)}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
  } catch {
    // Product cookies are still cleared below.
  }
}

/**
 * - `?local=1` — clear product session only (JSON). Used when switching / signing out one of many.
 * - `?all=1` — clear product then identity end-session for every roster account.
 * - default — clear product then identity end-session for the active account path.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const localOnly = url.searchParams.get('local') === '1';
  const all = url.searchParams.get('all') === '1';

  await clearNestSession(request);

  if (localOnly) {
    const response = NextResponse.json({ ok: true });
    clearStoreCookies(response);
    return response;
  }

  const issuer = identityIssuer();
  const endSession = new URL('/oauth/end-session', issuer);
  endSession.searchParams.set('post_logout_redirect_uri', `${origin}/`);
  endSession.searchParams.set('client_id', oauthClientId());
  if (all) {
    endSession.searchParams.set('all', '1');
  }

  const response = NextResponse.redirect(endSession);
  clearStoreCookies(response);
  return response;
}
