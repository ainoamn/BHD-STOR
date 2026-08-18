import { NextRequest, NextResponse } from 'next/server';
import {
  BHD_OAUTH_STATE_COOKIE,
  backendOrigin,
  exchangeAuthorizationCode,
  isSafeNextPath,
  mintStoreSessionTokens,
  oauthStateCookieOptions,
  parseOAuthState,
  productSessionCookieOptions,
  readVerifiedIdentityProfile,
  sessionSigningSecret,
} from '@/lib/bhd-identity';

export const runtime = 'nodejs';

function loginError(origin: string, reason: string) {
  const response = NextResponse.redirect(
    new URL(`/auth/login?error=sso&reason=${encodeURIComponent(reason)}`, origin),
  );
  response.cookies.set(BHD_OAUTH_STATE_COOKIE, '', { ...oauthStateCookieOptions(), maxAge: 0 });
  return response;
}

function applyProductCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  response.cookies.set('accessToken', tokens.accessToken, productSessionCookieOptions(60 * 60 * 8));
  response.cookies.set(
    'refreshToken',
    tokens.refreshToken,
    productSessionCookieOptions(60 * 60 * 24 * 7),
  );
  response.cookies.set('bhd_session', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
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

  let profile;
  try {
    profile = readVerifiedIdentityProfile(idToken, saved.nonce);
  } catch {
    return loginError(origin, 'claims');
  }

  const dest = isSafeNextPath(saved.returnTo) ? saved.returnTo : '/';
  const finish = (response: NextResponse) => {
    response.cookies.set(BHD_OAUTH_STATE_COOKIE, '', { ...oauthStateCookieOptions(), maxAge: 0 });
    const [firstName, ...rest] = profile.name.trim().split(/\s+/);
    const user = {
      id: profile.sub,
      email: profile.email,
      firstName: firstName || profile.email,
      lastName: rest.join(' ') || firstName || 'BHD',
      fullName: profile.name,
      avatar: profile.picture || undefined,
      role: 'customer',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: false,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    response.cookies.set('bhd_sso_profile', JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 120,
    });
    return response;
  };

  try {
    const completeRes = await fetch(`${backendOrigin(request.url)}/api/v1/auth/bhd/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        accessToken,
        nonce: saved.nonce,
      }),
    });
    if (completeRes.ok) {
      const response = NextResponse.redirect(new URL(dest, origin));
      const setCookies =
        typeof completeRes.headers.getSetCookie === 'function'
          ? completeRes.headers.getSetCookie()
          : [];
      for (const cookie of setCookies) {
        response.headers.append('set-cookie', cookie);
      }
      return finish(response);
    }
  } catch {
    // Fall through to product session issued on Next, same as other BHD relying parties.
  }

  const response = NextResponse.redirect(new URL(dest, origin));
  if (sessionSigningSecret()) {
    applyProductCookies(response, mintStoreSessionTokens(profile));
  } else {
    applyProductCookies(response, { accessToken: idToken, refreshToken: accessToken });
  }
  return finish(response);
}
