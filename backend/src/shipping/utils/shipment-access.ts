import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

/**
 * Pure rules for seller label/cancel: staff free; sellers need orderId.
 * Ownership of that order is checked separately via OrdersService.
 */
export function requireOrderIdForSellerShipment(
  role: string | undefined,
  orderId: string | undefined,
): void {
  if (isStaffRole(role)) return;
  if (!orderId) {
    throw new BadRequestException(
      'orderId query parameter is required for sellers',
    );
  }
}

export function rejectCustomerShipmentRole(role: string | undefined): void {
  const r = String(role || '').toLowerCase();
  if (isStaffRole(r) || r === 'seller' || r === 'vendor') return;
  throw new ForbiddenException(
    'Only sellers or staff can manage carrier shipments',
  );
}

function normalizeShipmentRef(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

/**
 * Whether a carrier shipment/AWB id is one of the known refs for an order.
 */
export function shipmentIdMatchesOrder(
  carrierShipmentId: string,
  orderTrackingNumber?: string | null,
  extraRefs: Array<string | null | undefined> = [],
): boolean {
  const needle = normalizeShipmentRef(carrierShipmentId);
  if (!needle) return false;

  const pool = [orderTrackingNumber, ...extraRefs]
    .map(normalizeShipmentRef)
    .filter(Boolean);

  return pool.includes(needle);
}

/**
 * Sellers (and staff when orderId is supplied) must only act on the
 * carrier id that belongs to that order (tracking / local shipment refs).
 */
export function assertShipmentTiedToOrder(
  carrierShipmentId: string,
  orderTrackingNumber?: string | null,
  extraRefs: Array<string | null | undefined> = [],
): void {
  if (
    shipmentIdMatchesOrder(carrierShipmentId, orderTrackingNumber, extraRefs)
  ) {
    return;
  }
  throw new ForbiddenException(
    'Shipment id does not belong to the specified order',
  );
}
