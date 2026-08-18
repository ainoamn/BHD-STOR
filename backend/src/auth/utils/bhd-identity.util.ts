const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const BHD_STORE_CLIENT_ID = 'bhd-store';
export const DEFAULT_BHD_IDENTITY_ISSUER = 'https://id.bhd-om.com';

export type LocalIdentityUser = {
  id: string;
  email: string;
  bhdSub: string | null;
  emailVerified: boolean;
};

export type BhdUserMatch =
  | { action: 'use'; userId: string }
  | { action: 'link'; userId: string }
  | { action: 'create' }
  | { action: 'reject'; reason: 'email-not-verified' | 'unverified-email-collision' | 'sub-mismatch' };

export type BhdOidcClaims = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  phone: string | null;
  nonce: string;
};

export function isBhdSub(value: string): boolean {
  return UUID_RE.test(value);
}

export function normalizeIssuer(value: string): string {
  return (value || '').trim().replace(/\/$/, '');
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

export function isEmailVerifiedClaim(value: unknown): boolean {
  return value === true || value === 'true';
}

export function assertOidcClaims(
  payload: Record<string, unknown> | null,
  input: { issuer: string; audience: string; nonce: string; nowSec?: number },
): BhdOidcClaims {
  if (!payload) {
    throw new Error('invalid_id_token');
  }
  const issuer = normalizeIssuer(input.issuer);
  const iss = typeof payload.iss === 'string' ? normalizeIssuer(payload.iss) : '';
  if (!iss || iss !== issuer) {
    throw new Error('invalid_issuer');
  }

  const aud = payload.aud;
  const audiences = Array.isArray(aud)
    ? aud.filter((item): item is string => typeof item === 'string')
    : typeof aud === 'string'
      ? [aud]
      : [];
  if (!audiences.includes(input.audience)) {
    throw new Error('invalid_audience');
  }

  const now = input.nowSec ?? Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;
  if (!exp || exp + 60 < now) {
    throw new Error('id_token_expired');
  }
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : null;
  if (nbf !== null && nbf - 60 > now) {
    throw new Error('id_token_not_yet_valid');
  }

  const nonce = typeof payload.nonce === 'string' ? payload.nonce : '';
  if (!nonce || nonce !== input.nonce) {
    throw new Error('invalid_nonce');
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  if (!isBhdSub(sub)) {
    throw new Error('invalid_sub');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    throw new Error('invalid_email');
  }

  if (!isEmailVerifiedClaim(payload.email_verified)) {
    throw new Error('email_not_verified');
  }

  return {
    sub,
    email,
    emailVerified: true,
    name: typeof payload.name === 'string' ? payload.name : email,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
    phone: typeof payload.phone_number === 'string' ? payload.phone_number : null,
    nonce,
  };
}

export function decideBhdUserMatch(input: {
  sub: string;
  emailVerified: boolean;
  bySub: LocalIdentityUser | null;
  byEmail: LocalIdentityUser | null;
}): BhdUserMatch {
  if (!input.emailVerified) {
    return { action: 'reject', reason: 'email-not-verified' };
  }
  if (input.bySub) {
    return { action: 'use', userId: input.bySub.id };
  }
  if (input.byEmail) {
    if (!input.byEmail.emailVerified) {
      return { action: 'reject', reason: 'unverified-email-collision' };
    }
    if (input.byEmail.bhdSub && input.byEmail.bhdSub !== input.sub) {
      return { action: 'reject', reason: 'sub-mismatch' };
    }
    return { action: 'link', userId: input.byEmail.id };
  }
  return { action: 'create' };
}

export function splitDisplayName(
  name: string,
  email: string,
): { firstName: string; lastName: string } {
  const cleaned = (name || '').trim();
  if (!cleaned) {
    const local = (email.split('@')[0] || 'User').slice(0, 100);
    return { firstName: local, lastName: 'BHD' };
  }
  const parts = cleaned.split(/\s+/);
  const firstName = parts[0].slice(0, 100);
  const lastName = (parts.slice(1).join(' ') || firstName).slice(0, 100);
  return { firstName, lastName };
}

export function isSafeNextPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//') || value.includes('\\')) return false;
  if (value.includes('://')) return false;
  return true;
}
