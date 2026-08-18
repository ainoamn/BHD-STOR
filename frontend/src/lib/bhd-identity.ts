import { createHash, randomBytes } from 'crypto';

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
  const tokenRes = await fetch(`${issuer}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: oauthClientId(),
      client_secret: oauthClientSecret(),
      code_verifier: input.codeVerifier,
    }),
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
