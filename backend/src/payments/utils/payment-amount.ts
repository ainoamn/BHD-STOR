import { BadRequestException } from '@nestjs/common';
import { moneyDiff, moneyEquals, roundMoney } from '../../common/utils/money.util';

/** Absolute tolerance: 1 baisa. */
export const PAYMENT_AMOUNT_TOLERANCE = 0.001;

/**
 * Charge amount must come from the order total.
 * If the client sends an amount, it must match within 1 baisa.
 */
export function resolveChargeAmount(
  orderTotal: number,
  clientAmount?: number | null,
  tolerance = PAYMENT_AMOUNT_TOLERANCE,
): number {
  const expected = roundMoney(Number(orderTotal));
  if (!Number.isFinite(expected) || expected <= 0) {
    throw new BadRequestException('Order has an invalid payable total');
  }

  if (clientAmount !== undefined && clientAmount !== null) {
    const client = Number(clientAmount);
    if (!Number.isFinite(client)) {
      throw new BadRequestException('Invalid payment amount');
    }
    if (moneyDiff(client, expected) > tolerance) {
      throw new BadRequestException('Payment amount does not match order total');
    }
  }

  return expected;
}

/**
 * Webhook paid amount must match order total within 1 baisa.
 * If amount is omitted: fail when requireAmount=true; otherwise allow.
 * (Removed previous 1%-of-total tolerance — unsuitable for settlement.)
 */
export function webhookAmountMatchesOrder(
  orderTotal: number,
  paidAmount: number | null | undefined,
  options?: { tolerance?: number; requireAmount?: boolean },
): boolean {
  const tolerance = options?.tolerance ?? PAYMENT_AMOUNT_TOLERANCE;
  const requireAmount = options?.requireAmount === true;

  if (paidAmount === undefined || paidAmount === null) {
    return !requireAmount;
  }

  const paid = Number(paidAmount);
  const expected = Number(orderTotal);
  if (!Number.isFinite(paid) || !Number.isFinite(expected)) {
    return false;
  }
  return moneyDiff(paid, expected) <= tolerance || moneyEquals(paid, expected);
}
