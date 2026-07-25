import { BadRequestException } from '@nestjs/common';
import { resolveShipmentCodAmount } from './shipment-cod';

describe('resolveShipmentCodAmount', () => {
  it('returns 0 for non-COD orders', () => {
    expect(
      resolveShipmentCodAmount(
        { total: 20, paymentMethod: 'stripe' },
        0,
        'seller',
      ),
    ).toBe(0);
  });

  it('uses order total for COD and ignores client amount', () => {
    expect(
      resolveShipmentCodAmount(
        { total: 15.5, paymentMethod: 'cod' },
        0,
        'seller',
      ),
    ).toBe(15.5);
    expect(
      resolveShipmentCodAmount(
        { total: 15.5, paymentMethod: 'cash_on_delivery' },
        999,
        'seller',
      ),
    ).toBe(15.5);
  });

  it('allows staff override', () => {
    expect(
      resolveShipmentCodAmount(
        { total: 15.5, paymentMethod: 'cod' },
        10,
        'admin',
      ),
    ).toBe(10);
  });

  it('rejects invalid totals', () => {
    expect(() =>
      resolveShipmentCodAmount(
        { total: Number.NaN, paymentMethod: 'cod' },
        null,
        'seller',
      ),
    ).toThrow(BadRequestException);
  });
});
