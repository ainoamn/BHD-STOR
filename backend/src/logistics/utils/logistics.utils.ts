/**
 * Logistics helper utilities
 */

export function formatTrackingNumber(raw: string): string {
  return (raw || '').trim().toUpperCase();
}

export function generateTrackingNumber(prefix = 'BHD'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}-${year}-${random}`;
}

export function calculateShippingCost(params: {
  basePrice?: number;
  weightKg?: number;
  distanceKm?: number;
  ratePerKg?: number;
  ratePerKm?: number;
}): number {
  const base = params.basePrice ?? 0;
  const weight = (params.weightKg ?? 0) * (params.ratePerKg ?? 0);
  const distance = (params.distanceKm ?? 0) * (params.ratePerKm ?? 0);
  return Math.round((base + weight + distance) * 1000) / 1000;
}

export function estimateDeliveryDate(
  from: Date = new Date(),
  hours = 24,
): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
