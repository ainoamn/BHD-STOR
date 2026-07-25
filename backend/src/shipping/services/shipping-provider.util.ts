import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';

/** Shared shipping provider env helpers */
export function isProductionEnv(config: ConfigService): boolean {
  return (config.get<string>('NODE_ENV') || 'development') === 'production';
}

/**
 * Mock rates/shipments/tracking are allowed when:
 * - SHIPPING_ALLOW_MOCK=true, or
 * - not in production
 */
export function shippingMockAllowed(config: ConfigService): boolean {
  if (config.get<string>('SHIPPING_ALLOW_MOCK') === 'true') {
    return true;
  }
  return !isProductionEnv(config);
}

/**
 * When carrier is unconfigured or live tracking fails:
 * - allow mock if shippingMockAllowed
 * - otherwise fail-closed (no fabricated in_transit events in production)
 */
export function trackingMockOrThrow<T>(
  config: ConfigService,
  providerLabel: string,
  mockFactory: () => T,
): T {
  if (!shippingMockAllowed(config)) {
    throw new ServiceUnavailableException(
      `${providerLabel} tracking is unavailable. Configure carrier credentials or set SHIPPING_ALLOW_MOCK=true outside production.`,
    );
  }
  return mockFactory();
}
