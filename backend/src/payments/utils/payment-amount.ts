import { BadRequestException } from '@nestjs/common';

/** Absolute tolerance in OMR (1 baisa = 0.001). */
export const PAYMENT_AMOUNT_TOLERANCE = 0.001;

/**
 * Charge amount must come from the order total.
 * If the client sends an amount, it must match within tolerance.
 */
export function resolveChargeAmount(
  orderTotal: number,
  clientAmount?: number | null,
  tolerance = PAYMENT_AMOUNT_TOLERANCE,
): number {
  const expected = Number(orderTotal);
  if (!Number.isFinite(expected) || expected <= 0) {
    throw new BadRequestException('Order has an invalid payable total');
  }

  if (clientAmount !== undefined && clientAmount !== null) {
    const client = Number(clientAmount);
    if (!Number.isFinite(client)) {
      throw new BadRequestException('Invalid payment amount');
    }
    if (Math.abs(client - expected) > tolerance) {
      throw new BadRequestException(
        'Payment amount does not match order total',
      );
    }
  }

  return Math.round(expected * 1000) / 1000;
}

/**
 * When a webhook includes a paid amount, it must match the order total.
 * Missing amount → fail-open only when `requireAmount` is false (default true = fail-closed if amount missing? No - many gateways omit amount in our result).
 *
 * Default: if paidAmount is provided, must match; if omitted, returns true
 * (order ownership already gated). Use requireAmount for stricter paths.
 */
export function webhookAmountMatchesOrder(
  orderTotal: number,
  paidAmount: number | null | undefined,
  options?: { tolerance?: number; requireAmount?: boolean },
): boolean {
  const tolerance = options?.tolerance ?? Math.max(
    PAYMENT_AMOUNT_TOLERANCE,
    Number(orderTotal) * 0.01,
  );
  const requireAmount = options?.requireAmount === true;

  if (paidAmount === undefined || paidAmount === null) {
    return !requireAmount;
  }

  const paid = Number(paidAmount);
  const expected = Number(orderTotal);
  if (!Number.isFinite(paid) || !Number.isFinite(expected)) {
    return false;
  }
  return Math.abs(paid - expected) <= tolerance;
}
