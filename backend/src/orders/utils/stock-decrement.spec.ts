import { canDecrementStock } from './stock-decrement';

describe('canDecrementStock (conditional stock rule)', () => {
  it('allows exact match (last unit)', () => {
    expect(canDecrementStock(3, 3)).toBe(true);
    expect(canDecrementStock(1, 1)).toBe(true);
  });

  it('allows when available exceeds qty', () => {
    expect(canDecrementStock(10, 2)).toBe(true);
  });

  it('rejects insufficient stock (oversell / race drain)', () => {
    expect(canDecrementStock(2, 3)).toBe(false);
    expect(canDecrementStock(0, 1)).toBe(false);
    expect(canDecrementStock(5, 6)).toBe(false);
  });

  it('rejects non-positive qty', () => {
    expect(canDecrementStock(5, 0)).toBe(false);
    expect(canDecrementStock(5, -1)).toBe(false);
  });

  it('truncates fractional values like order qty handling', () => {
    expect(canDecrementStock(2.9, 2.1)).toBe(true); // 2 >= 2
    expect(canDecrementStock(2.9, 2.9)).toBe(true); // 2 >= 2
    expect(canDecrementStock(1.9, 2.1)).toBe(false); // 1 >= 2
  });

  it('rejects non-finite inputs', () => {
    expect(canDecrementStock(NaN, 1)).toBe(false);
    expect(canDecrementStock(5, NaN)).toBe(false);
    expect(canDecrementStock(Infinity, 1)).toBe(false);
  });
});
