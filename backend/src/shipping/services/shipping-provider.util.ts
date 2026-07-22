import { ConfigService } from '@nestjs/config';

/** Shared shipping provider env helpers */
export function isProductionEnv(config: ConfigService): boolean {
  return (config.get<string>('NODE_ENV') || 'development') === 'production';
}

/**
 * Mock rates/shipments are allowed when:
 * - SHIPPING_ALLOW_MOCK=true, or
 * - not in production
 */
export function shippingMockAllowed(config: ConfigService): boolean {
  if (config.get<string>('SHIPPING_ALLOW_MOCK') === 'true') {
    return true;
  }
  return !isProductionEnv(config);
}
