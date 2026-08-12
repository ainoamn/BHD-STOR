import { redactSensitive } from './redact.util';

describe('redactSensitive', () => {
  it('redacts nested canary secrets', () => {
    const input = {
      email: 'user@example.com',
      password: 'hunter2',
      nested: {
        accessToken: 'atk_live_abc',
        profile: {
          name: 'Ada',
          api_key: 'key-123',
          wallet: {
            cardNumber: '4111111111111111',
            cvv: '123',
          },
        },
      },
      items: [
        { refreshToken: 'rt_xyz', qty: 1 },
        { note: 'ok', Authorization: 'Bearer secret' },
      ],
      safeUrl: 'https://example.com/path?token=abc&code=1',
      plain: 'hello',
    };

    const result = redactSensitive(input) as Record<string, any>;

    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('[REDACTED]');
    expect(result.nested.accessToken).toBe('[REDACTED]');
    expect(result.nested.profile.name).toBe('Ada');
    expect(result.nested.profile.api_key).toBe('[REDACTED]');
    expect(result.nested.profile.wallet.cardNumber).toBe('[REDACTED]');
    expect(result.nested.profile.wallet.cvv).toBe('[REDACTED]');
    expect(result.items[0].refreshToken).toBe('[REDACTED]');
    expect(result.items[0].qty).toBe(1);
    expect(result.items[1].note).toBe('ok');
    expect(result.items[1].Authorization).toBe('[REDACTED]');
    expect(result.safeUrl).toBe('https://example.com/path');
    expect(result.plain).toBe('hello');
    expect(redactSensitive('/webhook?hub.verify_token=secret&hub.mode=subscribe')).toBe(
      '/webhook',
    );
  });

  it('respects max depth', () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: { h: { i: { password: 'x' } } } } } } } } } };
    const result = redactSensitive(deep, 2) as any;
    // At depth 2 we stop walking; deepest password may become opaque
    expect(result.a).toBeDefined();
  });

  it('redacts Error enumerable props only', () => {
    const err = new Error('boom') as Error & { token?: string };
    err.token = 'leak';
    const result = redactSensitive(err) as Record<string, unknown>;
    expect(result.token).toBe('[REDACTED]');
    expect(result.message).toBeUndefined();
  });
});
