import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  shippingMockAllowed,
  trackingMockOrThrow,
} from './shipping-provider.util';

describe('shipping-provider.util', () => {
  function config(env: Record<string, string | undefined>): ConfigService {
    return {
      get: (key: string) => env[key],
    } as unknown as ConfigService;
  }

  it('allows mock outside production', () => {
    expect(shippingMockAllowed(config({ NODE_ENV: 'development' }))).toBe(true);
  });

  it('blocks mock in production unless SHIPPING_ALLOW_MOCK', () => {
    expect(shippingMockAllowed(config({ NODE_ENV: 'production' }))).toBe(false);
    expect(
      shippingMockAllowed(
        config({ NODE_ENV: 'production', SHIPPING_ALLOW_MOCK: 'true' }),
      ),
    ).toBe(true);
  });

  it('trackingMockOrThrow fails closed in production', () => {
    expect(() =>
      trackingMockOrThrow(config({ NODE_ENV: 'production' }), 'DHL', () => ({
        ok: true,
      })),
    ).toThrow(ServiceUnavailableException);
  });

  it('trackingMockOrThrow returns mock when allowed', () => {
    const result = trackingMockOrThrow(
      config({ NODE_ENV: 'development' }),
      'DHL',
      () => ({ ok: true }),
    );
    expect(result).toEqual({ ok: true });
  });
});
