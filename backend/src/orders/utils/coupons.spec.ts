import {
  ALLOWED_COUPONS,
  evaluateCoupon,
  isAllowedCouponCode,
  normalizeCouponCode,
} from './coupons';

describe('coupons', () => {
  it('whitelists only known codes', () => {
    expect(isAllowedCouponCode('WELCOME10')).toBe(true);
    expect(isAllowedCouponCode('welcome20')).toBe(true);
    expect(isAllowedCouponCode('FLAT5')).toBe(true);
    expect(isAllowedCouponCode('WELCOME100')).toBe(false);
    expect(isAllowedCouponCode('WELCOME999')).toBe(false);
    expect(Object.keys(ALLOWED_COUPONS)).toEqual(
      expect.arrayContaining(['WELCOME10', 'WELCOME20', 'FLAT5']),
    );
  });

  it('evaluates fixed percent and flat discounts', () => {
    expect(evaluateCoupon('WELCOME10', 100)).toEqual({
      valid: true,
      discountAmount: 10,
      code: 'WELCOME10',
    });
    expect(evaluateCoupon('WELCOME20', 50)).toEqual({
      valid: true,
      discountAmount: 10,
      code: 'WELCOME20',
    });
    expect(evaluateCoupon('FLAT5', 3)).toEqual({
      valid: true,
      discountAmount: 3,
      code: 'FLAT5',
    });
    expect(evaluateCoupon('WELCOME100', 100).valid).toBe(false);
  });

  it('normalizes codes', () => {
    expect(normalizeCouponCode('  welcome10 ')).toBe('WELCOME10');
  });
});
