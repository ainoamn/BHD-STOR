import { BadRequestException } from '@nestjs/common';
import { roundMoney, toMinorUnits, fromMinorUnits } from '../../common/utils/money.util';

const TOLERANCE = 0.001;

/**
 * Cap refund to remaining refundable balance.
 * Omitting requested amount = full remaining refund.
 */
export function resolveRefundAmount(
  paymentAmount: number,
  alreadyRefunded: number | null | undefined,
  requested?: number | null,
): number {
  const total = roundMoney(Number(paymentAmount));
  const prior = Math.max(0, toMinorUnits(Number(alreadyRefunded || 0)));
  if (!Number.isFinite(total) || total <= 0) {
    throw new BadRequestException('Payment has an invalid amount');
  }

  const remaining = fromMinorUnits(toMinorUnits(total) - prior);
  if (remaining <= TOLERANCE) {
    throw new BadRequestException('Nothing left to refund on this payment');
  }

  if (requested === undefined || requested === null) {
    return remaining;
  }

  const req = Number(requested);
  if (!Number.isFinite(req) || req <= 0) {
    throw new BadRequestException('Invalid refund amount');
  }

  if (req > remaining + TOLERANCE) {
    throw new BadRequestException(
      `Refund amount exceeds refundable balance (${remaining})`,
    );
  }

  return roundMoney(Math.min(req, remaining));
}

export function isPaymentRefundableStatus(status: string | null | undefined): boolean {
  const s = String(status || '').toLowerCase();
  return (
    s === 'completed' ||
    s === 'paid' ||
    s === 'partially_refunded' ||
    s === 'succeeded'
  );
}
