import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

export interface PricedPlan {
  tier?: string;
  priceMonthly?: number | null;
  priceYearly?: number | null;
}

/** Free plans (zero monthly & yearly) can be self-activated. */
export function isFreePlan(plan: PricedPlan): boolean {
  const monthly = Number(plan.priceMonthly ?? 0);
  const yearly = Number(plan.priceYearly ?? 0);
  return monthly <= 0 && yearly <= 0;
}

/**
 * Sellers may only self-activate free plans.
 * Paid tiers need staff grant or a confirmed payment flag (future billing).
 */
export function assertSelfServicePlanActivation(
  plan: PricedPlan,
  role?: string,
  options?: { paymentConfirmed?: boolean },
): void {
  if (isStaffRole(role)) return;
  if (options?.paymentConfirmed) return;
  if (isFreePlan(plan)) return;
  throw new ForbiddenException(
    'Paid subscription plans require completed payment or admin activation',
  );
}

/** Platform floor for percentage monetization (prevents 0% fee mode). */
export const MIN_COMMISSION_PERCENT = 5;
export const MAX_COMMISSION_PERCENT = 50;

export function clampCommissionPercent(
  percent: number | null | undefined,
  fallback = 10,
): number {
  const raw =
    percent === undefined || percent === null ? fallback : Number(percent);
  if (!Number.isFinite(raw)) {
    throw new BadRequestException('Invalid commission percent');
  }
  if (raw < MIN_COMMISSION_PERCENT || raw > MAX_COMMISSION_PERCENT) {
    throw new BadRequestException(
      `Commission percent must be between ${MIN_COMMISSION_PERCENT} and ${MAX_COMMISSION_PERCENT}`,
    );
  }
  return Math.round(raw * 1000) / 1000;
}
