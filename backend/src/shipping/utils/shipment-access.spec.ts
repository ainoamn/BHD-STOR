import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertShipmentTiedToOrder,
  rejectCustomerShipmentRole,
  requireOrderIdForSellerShipment,
  shipmentIdMatchesOrder,
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

  it('shipmentIdMatchesOrder ties AWB to order tracking', () => {
    expect(shipmentIdMatchesOrder('AWB-1', 'awb-1')).toBe(true);
    expect(shipmentIdMatchesOrder('AWB-1', 'other', ['awb-1'])).toBe(true);
    expect(shipmentIdMatchesOrder('AWB-9', 'awb-1')).toBe(false);
  });

  it('assertShipmentTiedToOrder rejects unbound ids', () => {
    expect(() =>
      assertShipmentTiedToOrder('AWB-9', 'awb-1'),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertShipmentTiedToOrder('AWB-1', 'awb-1'),
    ).not.toThrow();
  });
});
