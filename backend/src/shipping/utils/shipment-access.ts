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
