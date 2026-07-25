import { BadRequestException } from '@nestjs/common';
import {
  isPaymentRefundableStatus,
  resolveRefundAmount,
} from './refund-amount';

describe('refund-amount', () => {
  it('caps and defaults to remaining', () => {
    expect(resolveRefundAmount(100, 0)).toBe(100);
    expect(resolveRefundAmount(100, 40, 30)).toBe(30);
    expect(resolveRefundAmount(100, 40)).toBe(60);
    expect(() => resolveRefundAmount(100, 40, 70)).toThrow(BadRequestException);
    expect(() => resolveRefundAmount(100, 100)).toThrow(BadRequestException);
  });

  it('isPaymentRefundableStatus', () => {
    expect(isPaymentRefundableStatus('completed')).toBe(true);
    expect(isPaymentRefundableStatus('pending')).toBe(false);
  });
});
