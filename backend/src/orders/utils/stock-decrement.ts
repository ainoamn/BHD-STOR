/**
 * Pure predicate mirroring the conditional stock decrement rule:
 * UPDATE ... SET stock = stock - qty WHERE id = :id AND stock >= :qty
 *
 * Used to document / unit-test race-style outcomes without hitting the DB.
 */
export function canDecrementStock(available: number, qty: number): boolean {
  const a = Math.trunc(Number(available));
  const q = Math.trunc(Number(qty));
  return Number.isFinite(a) && Number.isFinite(q) && q > 0 && a >= q;
}
