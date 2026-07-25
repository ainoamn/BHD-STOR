/**
 * Canonical demo/catalog coupons — no open-ended WELCOME* percent parsing.
 */
export const ALLOWED_COUPONS: Readonly<
  Record<string, { type: 'percent' | 'flat'; value: number }>
> = {
  WELCOME10: { type: 'percent', value: 10 },
  WELCOME20: { type: 'percent', value: 20 },
  FLAT5: { type: 'flat', value: 5 },
};

export function normalizeCouponCode(code: string | null | undefined): string {
  return String(code || '')
    .trim()
    .toUpperCase();
}

export function isAllowedCouponCode(code: string | null | undefined): boolean {
  const normalized = normalizeCouponCode(code);
  return Boolean(normalized && ALLOWED_COUPONS[normalized]);
}

/**
 * Evaluate a whitelist coupon against subtotal (OMR, 3 decimal places).
 */
export function evaluateCoupon(
  code: string,
  subtotal: number,
): { valid: boolean; discountAmount: number; code?: string } {
  const normalized = normalizeCouponCode(code);
  const rule = ALLOWED_COUPONS[normalized];
  if (!rule) {
    return { valid: false, discountAmount: 0 };
  }

  const base = Math.max(0, Number(subtotal) || 0);
  let discount = 0;
  if (rule.type === 'flat') {
    discount = rule.value;
  } else {
    discount = (base * rule.value) / 100;
  }
  discount = Math.min(discount, base);
  discount = Math.round(discount * 1000) / 1000;

  return { valid: true, discountAmount: discount, code: normalized };
}
