import { createHash } from 'crypto';

/**
 * Stable SHA-256 of the payment request identity used for idempotency checks.
 * Same logical request must always produce the same hash.
 */
export function hashPaymentRequest(input: {
  orderId: string;
  gateway: string;
  amount: number;
  currency: string;
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        orderId: input.orderId,
        gateway: String(input.gateway || '').toLowerCase(),
        amount: Number(input.amount),
        currency: String(input.currency || 'OMR').toUpperCase(),
      }),
    )
    .digest('hex');
}
