import { evaluateReturnEligibility } from './return-eligibility';

describe('evaluateReturnEligibility', () => {
  const baseOrder = {
    id: 'ord-1',
    userId: 'user-1',
    storeId: 'store-1',
    status: 'delivered',
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-10T00:00:00Z'),
    statusHistory: [{ status: 'delivered', timestamp: '2026-07-10T00:00:00Z' }],
    items: [
      {
        productId: 'prod-1',
        storeId: 'store-1',
        quantity: 2,
        unitPrice: 5,
        totalPrice: 10,
      },
    ],
  };

  it('rejects missing order and non-owners with same message', () => {
    const a = evaluateReturnEligibility({
      order: null,
      productId: 'prod-1',
      userId: 'user-1',
      existingOpenReturn: false,
      policy: { returnWindow: 14 },
    });
    const b = evaluateReturnEligibility({
      order: baseOrder,
      productId: 'prod-1',
      userId: 'other',
      existingOpenReturn: false,
      policy: { returnWindow: 14 },
    });
    expect(a.eligible).toBe(false);
    expect(b.eligible).toBe(false);
    expect(a.reason).toBe(b.reason);
  });

  it('requires delivered status and product on order', () => {
    expect(
      evaluateReturnEligibility({
        order: { ...baseOrder, status: 'shipped' },
        productId: 'prod-1',
        userId: 'user-1',
        existingOpenReturn: false,
        policy: { returnWindow: 14 },
      }).eligible,
    ).toBe(false);

    expect(
      evaluateReturnEligibility({
        order: baseOrder,
        productId: 'missing',
        userId: 'user-1',
        existingOpenReturn: false,
        policy: { returnWindow: 14 },
      }).eligible,
    ).toBe(false);
  });

  it('rejects open duplicate and expired window', () => {
    expect(
      evaluateReturnEligibility({
        order: baseOrder,
        productId: 'prod-1',
        userId: 'user-1',
        existingOpenReturn: true,
        policy: { returnWindow: 14 },
      }).eligible,
    ).toBe(false);

    expect(
      evaluateReturnEligibility({
        order: baseOrder,
        productId: 'prod-1',
        userId: 'user-1',
        existingOpenReturn: false,
        policy: { returnWindow: 7 },
        now: new Date('2026-07-25T00:00:00Z'),
      }).eligible,
    ).toBe(false);
  });

  it('allows eligible delivered order within window', () => {
    const result = evaluateReturnEligibility({
      order: baseOrder,
      productId: 'prod-1',
      userId: 'user-1',
      existingOpenReturn: false,
      policy: { returnWindow: 14 },
      now: new Date('2026-07-15T00:00:00Z'),
    });
    expect(result.eligible).toBe(true);
    expect(result.maxRefundAmount).toBe(10);
    expect(result.storeId).toBe('store-1');
  });
});
