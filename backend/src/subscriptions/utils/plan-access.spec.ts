import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertSelfServicePlanActivation,
  clampCommissionPercent,
  isFreePlan,
  MIN_COMMISSION_PERCENT,
} from './plan-access';

describe('plan-access', () => {
  it('isFreePlan', () => {
    expect(isFreePlan({ priceMonthly: 0, priceYearly: 0 })).toBe(true);
    expect(isFreePlan({ priceMonthly: 9.9, priceYearly: 99 })).toBe(false);
  });

  it('assertSelfServicePlanActivation', () => {
    expect(() =>
      assertSelfServicePlanActivation(
        { priceMonthly: 0, priceYearly: 0 },
        'seller',
      ),
    ).not.toThrow();
    expect(() =>
      assertSelfServicePlanActivation(
        { priceMonthly: 99, priceYearly: 999 },
        'seller',
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertSelfServicePlanActivation(
        { priceMonthly: 99, priceYearly: 999 },
        'admin',
      ),
    ).not.toThrow();
    expect(() =>
      assertSelfServicePlanActivation(
        { priceMonthly: 99, priceYearly: 999 },
        'seller',
        { paymentConfirmed: true },
      ),
    ).not.toThrow();
  });

  it('clampCommissionPercent enforces floor', () => {
    expect(clampCommissionPercent(10)).toBe(10);
    expect(() => clampCommissionPercent(0)).toThrow(BadRequestException);
    expect(() => clampCommissionPercent(MIN_COMMISSION_PERCENT - 1)).toThrow(
      BadRequestException,
    );
  });
});
