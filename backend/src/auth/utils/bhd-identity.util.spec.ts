import {
  assertOidcClaims,
  decideBhdUserMatch,
  decodeJwtPayload,
  isSafeNextPath,
  splitDisplayName,
} from './bhd-identity.util';

describe('bhd-identity.util', () => {
  const sub = '550e8400-e29b-41d4-a716-446655440000';
  const issuer = 'https://one-bhd.vercel.app';
  const nonce = 'nonce-1';

  function payload(overrides: Record<string, unknown> = {}) {
    return {
      iss: issuer,
      aud: 'bhd-store',
      sub,
      email: 'ada@example.com',
      email_verified: true,
      name: 'Ada Lovelace',
      nonce,
      exp: Math.floor(Date.now() / 1000) + 600,
      ...overrides,
    };
  }

  it('decodes a JWT payload without verifying the signature', () => {
    const body = Buffer.from(JSON.stringify({ sub, email_verified: true }), 'utf8').toString(
      'base64url',
    );
    const token = `header.${body}.sig`;
    expect(decodeJwtPayload(token)).toEqual({ sub, email_verified: true });
  });

  it('accepts valid OIDC claims and rejects issuer/audience/nonce/email_verified failures', () => {
    const claims = assertOidcClaims(payload(), { issuer, audience: 'bhd-store', nonce });
    expect(claims.sub).toBe(sub);
    expect(claims.email).toBe('ada@example.com');

    expect(() =>
      assertOidcClaims(payload({ iss: 'https://evil.example' }), {
        issuer,
        audience: 'bhd-store',
        nonce,
      }),
    ).toThrow('invalid_issuer');

    expect(() =>
      assertOidcClaims(payload({ aud: 'bhd-portal' }), {
        issuer,
        audience: 'bhd-store',
        nonce,
      }),
    ).toThrow('invalid_audience');

    expect(() =>
      assertOidcClaims(payload({ nonce: 'other' }), {
        issuer,
        audience: 'bhd-store',
        nonce,
      }),
    ).toThrow('invalid_nonce');

    expect(() =>
      assertOidcClaims(payload({ email_verified: false }), {
        issuer,
        audience: 'bhd-store',
        nonce,
      }),
    ).toThrow('email_not_verified');
  });

  it('matches bhd_sub first, then verified email, then create', () => {
    expect(
      decideBhdUserMatch({
        sub,
        emailVerified: true,
        bySub: { id: 'u1', email: 'ada@example.com', bhdSub: sub, emailVerified: true },
        byEmail: { id: 'u2', email: 'ada@example.com', bhdSub: null, emailVerified: true },
      }),
    ).toEqual({ action: 'use', userId: 'u1' });

    expect(
      decideBhdUserMatch({
        sub,
        emailVerified: true,
        bySub: null,
        byEmail: { id: 'u2', email: 'ada@example.com', bhdSub: null, emailVerified: true },
      }),
    ).toEqual({ action: 'link', userId: 'u2' });

    expect(
      decideBhdUserMatch({
        sub,
        emailVerified: true,
        bySub: null,
        byEmail: null,
      }),
    ).toEqual({ action: 'create' });

    expect(
      decideBhdUserMatch({
        sub,
        emailVerified: true,
        bySub: null,
        byEmail: { id: 'u2', email: 'ada@example.com', bhdSub: null, emailVerified: false },
      }),
    ).toEqual({ action: 'reject', reason: 'unverified-email-collision' });
  });

  it('keeps returnTo relative and splits display names', () => {
    expect(isSafeNextPath('/ar/checkout')).toBe(true);
    expect(isSafeNextPath('https://evil.example/')).toBe(false);
    expect(isSafeNextPath('//evil.example')).toBe(false);
    expect(splitDisplayName('Ada Lovelace', 'ada@example.com')).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });
});
