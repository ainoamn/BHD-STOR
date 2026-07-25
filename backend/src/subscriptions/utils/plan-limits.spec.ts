import { ForbiddenException } from '@nestjs/common';
import {
  assertWithinProductLimit,
  resolveProductLimit,
} from './plan-limits';

describe('plan-limits', () => {
  it('resolveProductLimit', () => {
    expect(resolveProductLimit(10)).toBe(10);
    expect(resolveProductLimit(0)).toBeNull();
    expect(resolveProductLimit(undefined)).toBe(10);
  });

  it('assertWithinProductLimit', () => {
    expect(() => assertWithinProductLimit(9, 10)).not.toThrow();
    expect(() => assertWithinProductLimit(10, 10)).toThrow(ForbiddenException);
    expect(() => assertWithinProductLimit(1000, null)).not.toThrow();
  });
});
