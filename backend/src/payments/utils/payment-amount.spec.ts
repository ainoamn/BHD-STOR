import { BadRequestException } from '@nestjs/common';
import {
  resolveChargeAmount,
  webhookAmountMatchesOrder,
} from './payment-amount';

describe('payment-amount', () => {
  it('resolveChargeAmount uses order total and rejects mismatch', () => {
    expect(resolveChargeAmount(12.5)).toBe(12.5);
    expect(resolveChargeAmount(12.5, 12.5)).toBe(12.5);
    expect(() => resolveChargeAmount(12.5, 1)).toThrow(BadRequestException);
    expect(() => resolveChargeAmount(0)).toThrow(BadRequestException);
  });

  it('webhookAmountMatchesOrder', () => {
    expect(webhookAmountMatchesOrder(10, 10)).toBe(true);
    expect(webhookAmountMatchesOrder(10, 9)).toBe(false);
    expect(webhookAmountMatchesOrder(10, undefined)).toBe(true);
    expect(
      webhookAmountMatchesOrder(10, undefined, { requireAmount: true }),
    ).toBe(false);
  });
});
