import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  rejectCustomerShipmentRole,
  requireOrderIdForSellerShipment,
} from './shipment-access';

describe('shipment-access helpers', () => {
  it('requireOrderIdForSellerShipment', () => {
    expect(() =>
      requireOrderIdForSellerShipment('admin', undefined),
    ).not.toThrow();
    expect(() =>
      requireOrderIdForSellerShipment('seller', 'ord-1'),
    ).not.toThrow();
    expect(() =>
      requireOrderIdForSellerShipment('seller', undefined),
    ).toThrow(BadRequestException);
  });

  it('rejectCustomerShipmentRole', () => {
    expect(() => rejectCustomerShipmentRole('seller')).not.toThrow();
    expect(() => rejectCustomerShipmentRole('admin')).not.toThrow();
    expect(() => rejectCustomerShipmentRole('customer')).toThrow(
      ForbiddenException,
    );
  });
});
