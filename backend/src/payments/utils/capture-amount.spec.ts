import { BadRequestException } from '@nestjs/common';
import { resolveCaptureAmount } from './capture-amount';

describe('capture-amount', () => {
  it('defaults to full authorized and caps client amount', () => {
    expect(resolveCaptureAmount(25.5)).toBe(25.5);
    expect(resolveCaptureAmount(25.5, 10)).toBe(10);
    expect(resolveCaptureAmount(25.5, 25.5)).toBe(25.5);
    expect(() => resolveCaptureAmount(25.5, 30)).toThrow(BadRequestException);
    expect(() => resolveCaptureAmount(25.5, 0)).toThrow(BadRequestException);
    expect(() => resolveCaptureAmount(0)).toThrow(BadRequestException);
  });
});
