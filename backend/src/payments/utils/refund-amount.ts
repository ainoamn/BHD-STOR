import { BadRequestException } from '@nestjs/common';

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
  const total = Number(paymentAmount);
  const prior = Math.max(0, Number(alreadyRefunded || 0));
  if (!Number.isFinite(total) || total <= 0) {
    throw new BadRequestException('Payment has an invalid amount');
  }

  const remaining = Math.round((total - prior) * 1000) / 1000;
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

  return Math.round(Math.min(req, remaining) * 1000) / 1000;
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
