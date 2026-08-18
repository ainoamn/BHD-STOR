import { createHash, randomBytes } from 'crypto';

export const BHD_OAUTH_STATE_COOKIE = 'bhd_oauth_state';
export const DEFAULT_BHD_IDENTITY_ISSUER = 'https://id.bhd-om.com';
export const BHD_STORE_CLIENT_ID = 'bhd-store';

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

export function backendOrigin(): string {
  return (
    process.env.BACKEND_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
    'http://localhost:3001'
  );
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
