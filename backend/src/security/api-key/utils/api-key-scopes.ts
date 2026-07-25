import { ForbiddenException } from '@nestjs/common';
import { ApiKeyScope } from '../entities/api-key.entity';
import { isStaffRole } from '../../../auth/utils/roles';

/** Scopes any authenticated user (seller/customer integrations) may mint. */
export const USER_SAFE_API_KEY_SCOPES: readonly ApiKeyScope[] = [
  ApiKeyScope.READ,
  ApiKeyScope.PRODUCTS_READ,
  ApiKeyScope.PRODUCTS_WRITE,
  ApiKeyScope.ORDERS_READ,
  ApiKeyScope.ORDERS_WRITE,
  ApiKeyScope.INVENTORY_READ,
  ApiKeyScope.INVENTORY_WRITE,
  ApiKeyScope.ANALYTICS_READ,
  ApiKeyScope.WEBHOOK_MANAGE,
  ApiKeyScope.PAYMENTS_READ,
  ApiKeyScope.SHIPPING_READ,
  ApiKeyScope.SHIPPING_MANAGE,
  ApiKeyScope.AI_GENERATE,
];

/** Privileged scopes — staff only. */
export const STAFF_ONLY_API_KEY_SCOPES: readonly ApiKeyScope[] = [
  ApiKeyScope.WRITE,
  ApiKeyScope.DELETE,
  ApiKeyScope.ADMIN,
  ApiKeyScope.FULL_ACCESS,
  ApiKeyScope.CUSTOMERS_READ,
  ApiKeyScope.CUSTOMERS_WRITE,
  ApiKeyScope.PAYMENTS_PROCESS,
];

export function scopesAllowedForRole(role?: string): ApiKeyScope[] {
  if (isStaffRole(role)) {
    return Object.values(ApiKeyScope);
  }
  return [...USER_SAFE_API_KEY_SCOPES];
}

/**
 * Reject client-chosen privileged scopes unless requester is staff.
 */
export function assertApiKeyScopesAllowed(
  scopes: ApiKeyScope[] | undefined,
  role?: string,
): void {
  const requested = Array.isArray(scopes) ? scopes : [];
  if (requested.length === 0) {
    throw new ForbiddenException('At least one API key scope is required');
  }

  if (isStaffRole(role)) return;

  const allowed = new Set(USER_SAFE_API_KEY_SCOPES);
  const forbidden = requested.filter((s) => !allowed.has(s));
  if (forbidden.length > 0) {
    throw new ForbiddenException(
      `API key scopes not allowed for your role: ${forbidden.join(', ')}`,
    );
  }
}
