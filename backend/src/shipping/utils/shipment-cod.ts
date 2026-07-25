import { BadRequestException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

export interface OrderCodSubject {
  total: number | string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}

/**
 * COD collect amount comes from the order — never trust client codAmount
 * (unless staff override).
 */
export function resolveShipmentCodAmount(
  order: OrderCodSubject,
  clientCodAmount?: number | null,
  role?: string,
): number {
  const method = String(order.paymentMethod || '')
    .toLowerCase()
    .trim();
  const isCod =
    method === 'cod' ||
    method === 'cash_on_delivery' ||
    method === 'cash';

  if (!isCod) {
    return 0;
  }

  const expected = Math.round(Number(order.total) * 1000) / 1000;
  if (!Number.isFinite(expected) || expected < 0) {
    throw new BadRequestException('Order has an invalid total for COD');
  }

  if (isStaffRole(role) && clientCodAmount !== undefined && clientCodAmount !== null) {
    const override = Number(clientCodAmount);
    if (!Number.isFinite(override) || override < 0) {
      throw new BadRequestException('Invalid COD amount');
    }
    return Math.round(override * 1000) / 1000;
  }

  return expected;
}
