/**
 * OMR / marketplace money helpers (3 decimal places = baisa).
 * Prefer these over raw IEEE Math for charge/tax/total paths.
 */

export const MONEY_SCALE = 3;
export const MONEY_FACTOR = 1000;

/** Round to 3 decimal places (OMR baisa). */
export function roundMoney(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * MONEY_FACTOR) / MONEY_FACTOR;
}

/** Convert major units to integer minor units (baisa). */
export function toMinorUnits(value: number): number {
  return Math.round(roundMoney(value) * MONEY_FACTOR);
}

/** Convert minor units back to major. */
export function fromMinorUnits(minor: number): number {
  return roundMoney(Number(minor) / MONEY_FACTOR);
}

/** Exact equality in minor units (avoids float drift). */
export function moneyEquals(a: number, b: number): boolean {
  return toMinorUnits(a) === toMinorUnits(b);
}

/** Absolute difference in major units. */
export function moneyDiff(a: number, b: number): number {
  return Math.abs(fromMinorUnits(toMinorUnits(a) - toMinorUnits(b)));
}

export function addMoney(...parts: number[]): number {
  return fromMinorUnits(parts.reduce((sum, p) => sum + toMinorUnits(p), 0));
}

export function mulMoney(amount: number, qty: number): number {
  return fromMinorUnits(toMinorUnits(amount) * Math.trunc(Number(qty) || 0));
}
