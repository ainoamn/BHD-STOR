import { createHash, createHmac, randomBytes } from 'crypto';

export const BHD_OAUTH_STATE_COOKIE = 'bhd_oauth_state';
export const DEFAULT_BHD_IDENTITY_ISSUER = 'https://id.bhd-om.com';
export const BHD_STORE_CLIENT_ID = 'bhd-store';
export const IDENTITY_ISSUER_ALIASES = [
  'https://id.bhd-om.com',
  'https://one-bhd.vercel.app',
];

export type BhdOAuthState = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  redirectUri: string;
};

export function identityIssuer(): string {
  const configured = process.env.BHD_IDENTITY_ISSUER?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return DEFAULT_BHD_IDENTITY_ISSUER;
}

export function oauthClientId(): string {
  return process.env.BHD_OAUTH_CLIENT_ID?.trim() || BHD_STORE_CLIENT_ID;
}

export function oauthClientSecret(): string {
  return process.env.BHD_OAUTH_CLIENT_SECRET?.trim() || '';
}

function isLoopback(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function backendOrigin(requestUrl: string): string {
  const fromEnv = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ''
  ).replace(/\/$/, '');
  const fromApi = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const production = process.env.NODE_ENV === 'production';

  if (fromEnv && !(production && isLoopback(fromEnv))) {
    return fromEnv;
  }
  if (fromApi.startsWith('http') && !(production && isLoopback(fromApi))) {
    return fromApi.replace(/\/api\/v1$/i, '');
  }
  return new URL(requestUrl).origin;
}

export function randomUrlToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256Base64Url(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

export function isSafeNextPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//') || value.includes('\\')) return false;
  if (value.includes('://')) return false;
  return true;
}

export function oauthStateCookieOptions(maxAge = 5 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function parseOAuthState(raw: string | undefined): BhdOAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BhdOAuthState;
    if (!parsed?.state || !parsed?.nonce || !parsed?.verifier || !parsed?.redirectUri) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ idToken: string; accessToken: string }> {
  const issuer = identityIssuer();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: oauthClientId(),
    code_verifier: input.codeVerifier,
  });
  const secret = oauthClientSecret();
  if (secret) {
    body.set('client_secret', secret);
  }
  const tokenRes = await fetch(`${issuer}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error(`token_exchange_${tokenRes.status}`);
  }
  const tokens = (await tokenRes.json()) as { id_token?: string; access_token?: string };
  if (!tokens.id_token || !tokens.access_token) {
    throw new Error('token_exchange_empty');
  }
  return { idToken: tokens.id_token, accessToken: tokens.access_token };
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = (token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function allowedIssuers(): string[] {
  return [...new Set([identityIssuer(), ...IDENTITY_ISSUER_ALIASES.map((v) => v.replace(/\/$/, ''))])];
}

export type IdentityProfile = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
};

export function readVerifiedIdentityProfile(
  idToken: string,
  nonce: string,
): IdentityProfile {
  const payload = decodeJwtPayload(idToken);
  if (!payload) throw new Error('invalid_id_token');
  const iss = typeof payload.iss === 'string' ? payload.iss.replace(/\/$/, '') : '';
  if (!allowedIssuers().includes(iss)) throw new Error('invalid_issuer');
  const aud = payload.aud;
  const audiences = Array.isArray(aud) ? aud : [aud];
  if (!audiences.includes(oauthClientId())) throw new Error('invalid_audience');
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;
  if (exp + 60 < Math.floor(Date.now() / 1000)) throw new Error('id_token_expired');
  if (payload.nonce !== nonce) throw new Error('invalid_nonce');
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new Error('email_not_verified');
  }
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!sub || !email) throw new Error('invalid_claims');
  return {
    sub,
    email,
    name: typeof payload.name === 'string' ? payload.name : email,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
  };
}

function signHs256(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function sessionSigningSecret(): string | null {
  return (
    process.env.JWT_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    null
  );
}

export function mintStoreSessionTokens(profile: IdentityProfile): {
  accessToken: string;
  refreshToken: string;
} {
  const secret = sessionSigningSecret();
  const now = Math.floor(Date.now() / 1000);
  const base = {
    sub: profile.sub,
    email: profile.email,
    role: 'customer',
    iss: process.env.JWT_ISSUER || 'bhd-oman-marketplace',
    aud: process.env.JWT_AUDIENCE || 'bhd-oman-api',
    iat: now,
  };
  if (!secret) {
    throw new Error('missing_session_secret');
  }
  return {
    accessToken: signHs256({ ...base, type: 'access', exp: now + 60 * 60 * 8 }, secret),
    refreshToken: signHs256({ ...base, type: 'refresh', exp: now + 60 * 60 * 24 * 7 }, secret),
  };
}

export function productSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
