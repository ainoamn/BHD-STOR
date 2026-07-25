import {
  extractWsHandshakeToken,
  isWsStaffRole,
  resolveWsUserFromJwtPayload,
} from './ws-auth';

describe('ws-auth helpers', () => {
  it('extracts token from auth, bearer, query, and cookie', () => {
    expect(
      extractWsHandshakeToken({ auth: { token: ' a.b.c ' } }),
    ).toBe('a.b.c');
    expect(
      extractWsHandshakeToken({
        headers: { authorization: 'Bearer tok123' },
      }),
    ).toBe('tok123');
    expect(
      extractWsHandshakeToken({ query: { token: 'qtok' } }),
    ).toBe('qtok');
    expect(
      extractWsHandshakeToken({
        headers: { cookie: 'foo=1; accessToken=cookie%2Dtok; bar=2' },
      }),
    ).toBe('cookie-tok');
    expect(extractWsHandshakeToken({})).toBeNull();
  });

  it('resolveWsUserFromJwtPayload rejects refresh and missing sub', () => {
    expect(
      resolveWsUserFromJwtPayload({
        type: 'refresh',
        sub: 'u1',
      }),
    ).toBeNull();
    expect(resolveWsUserFromJwtPayload({ type: 'access' })).toBeNull();
    expect(
      resolveWsUserFromJwtPayload({
        type: 'access',
        sub: 'u1',
        email: 'a@b.c',
        role: 'customer',
      }),
    ).toEqual({ userId: 'u1', email: 'a@b.c', role: 'customer' });
  });

  it('isWsStaffRole matches staff helpers', () => {
    expect(isWsStaffRole('admin')).toBe(true);
    expect(isWsStaffRole('super_admin')).toBe(true);
    expect(isWsStaffRole('moderator')).toBe(true);
    expect(isWsStaffRole('seller')).toBe(false);
    expect(isWsStaffRole('customer')).toBe(false);
  });
});
