import { ForbiddenException } from '@nestjs/common';

/**
 * Plan productLimit semantics:
 * - undefined (missing plan) → Starter-like cap of 10
 * - 0 → unlimited (null)
 * - positive → hard cap
 */
export function resolveProductLimit(
  productLimit: number | null | undefined,
): number | null {
  if (productLimit === undefined) {
    return 10;
  }
  if (productLimit === null) {
    return 10;
  }
  const n = Number(productLimit);
  if (!Number.isFinite(n) || n < 0) {
    return 10;
  }
  if (n === 0) {
    return null; // unlimited
  }
  return Math.floor(n);
}

/**
 * Reject create when store already at/over plan product limit.
 * `limit === null` means unlimited. Staff should skip before calling.
 */
export function assertWithinProductLimit(
  currentCount: number,
  limit: number | null,
): void {
  if (limit === null) return;
  const count = Math.max(0, Number(currentCount) || 0);
  if (count >= limit) {
    throw new ForbiddenException(
      `Product limit reached for your plan (${limit}). Upgrade to add more products.`,
    );
  }
}
