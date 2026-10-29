import { NextRequest, NextResponse } from 'next/server';
import {
  identityIssuer,
  isSafeNextPath,
  mintStoreSessionTokens,
  productSessionCookieOptions,
  readStoreAccessProfile,
  sessionSigningSecret,
  type IdentityProfile,
} from '@/lib/bhd-identity';
import { productSessionMaxAgeSec } from '@/lib/bhd/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function profileFromWindowToken(token: string): Promise<IdentityProfile> {
  const issuer = identityIssuer();
  const response = await fetch(`${issuer}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`me_${response.status}`);
  const body = (await response.json()) as {
    user?: { id?: string; email?: string; name?: string; picture?: string | null } | null;
  };
  const user = body.user;
  const email = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (!user?.id || !email) throw new Error('claims');
  return {
    sub: user.id,
    email,
    name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : email.split('@')[0],
    picture: typeof user.picture === 'string' && user.picture.startsWith('https://') ? user.picture : null,
  };
}

function clearProductSession(response: NextResponse) {
  response.cookies.set('accessToken', '', { ...productSessionCookieOptions(0), maxAge: 0 });
  response.cookies.set('refreshToken', '', { ...productSessionCookieOptions(0), maxAge: 0 });
  response.cookies.set('bhd_session', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set('bhd_sso_profile', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function applyProductCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  const maxAge = productSessionMaxAgeSec();
  clearProductSession(response);
  response.cookies.set('accessToken', tokens.accessToken, productSessionCookieOptions(maxAge));
  response.cookies.set('refreshToken', tokens.refreshToken, productSessionCookieOptions(maxAge));
  response.cookies.set('bhd_session', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

function safeReturnPath(value: string | null | undefined) {
  return isSafeNextPath(value) ? value : '/';
}

async function rebind(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;

  let token = '';
  let returnTo = '/';
  const contentType = request.headers.get('content-type') || '';
  if (request.method === 'POST' && contentType.includes('application/json')) {
    const json = (await request.json().catch(() => ({}))) as { token?: string; returnTo?: string };
    token = typeof json.token === 'string' ? json.token.trim() : '';
    returnTo = safeReturnPath(json.returnTo);
  } else if (request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    token = String(form?.get('token') || '').trim();
    returnTo = safeReturnPath(String(form?.get('returnTo') || ''));
  } else {
    returnTo = safeReturnPath(url.searchParams.get('returnTo'));
  }

  const header = request.headers.get('authorization');
  if (!token && header?.toLowerCase().startsWith('bearer ')) token = header.slice(7).trim();
  if (!token || token.length < 20) {
    return NextResponse.redirect(
      new URL(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`, origin),
      303,
    );
  }

  try {
    const profile = await profileFromWindowToken(token);
    const currentToken = request.cookies.get('accessToken')?.value || '';
    const current = readStoreAccessProfile(currentToken);
    if (current?.sub === profile.sub) {
      const response = NextResponse.redirect(new URL(returnTo, origin), 303);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    const response = NextResponse.redirect(new URL(returnTo, origin), 303);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');

    if (sessionSigningSecret()) {
      applyProductCookies(response, mintStoreSessionTokens(profile));
    } else {
      applyProductCookies(response, { accessToken: token, refreshToken: token });
    }

    const [firstName, ...rest] = profile.name.trim().split(/\s+/);
    response.cookies.set(
      'bhd_sso_profile',
      JSON.stringify({
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
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 120,
      },
    );

    return response;
  } catch {
    return NextResponse.redirect(
      new URL(
        `/api/auth/bhd/logout?continue=${encodeURIComponent(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`)}`,
        origin,
      ),
      303,
    );
  }
}

export const POST = rebind;
export const GET = rebind;
