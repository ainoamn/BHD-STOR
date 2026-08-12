import { BadRequestException } from '@nestjs/common';
import { roundMoney } from '../../common/utils/money.util';

const TOLERANCE = 0.001;

/**
 * Capture amount must not exceed the authorized payment amount.
 * Omitting requested amount = full authorized capture.
 */
export function resolveCaptureAmount(
  paymentAmount: number,
  requested?: number | null,
): number {
  const authorized = roundMoney(Number(paymentAmount));
  if (!Number.isFinite(authorized) || authorized <= 0) {
    throw new BadRequestException('Payment has an invalid authorized amount');
  }

  if (requested === undefined || requested === null) {
    return authorized;
  }

  const req = Number(requested);
  if (!Number.isFinite(req) || req <= 0) {
    throw new BadRequestException('Invalid capture amount');
  }

  if (req > authorized + TOLERANCE) {
    throw new BadRequestException(
      `Capture amount exceeds authorized payment (${authorized})`,
    );
  }

  return roundMoney(Math.min(req, authorized));
}
