import { createHash } from 'crypto';
import { hashPaymentRequest } from './payment-request-hash';

describe('hashPaymentRequest (idempotent request hash)', () => {
  it('is stable for identical logical requests', () => {
    const a = hashPaymentRequest({
      orderId: 'ord-1',
      gateway: 'stripe',
      amount: 12.5,
      currency: 'OMR',
    });
    const b = hashPaymentRequest({
      orderId: 'ord-1',
      gateway: 'stripe',
      amount: 12.5,
      currency: 'OMR',
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalizes gateway case and currency case', () => {
    const lower = hashPaymentRequest({
      orderId: 'ord-1',
      gateway: 'Stripe',
      amount: 10,
      currency: 'omr',
    });
    const upper = hashPaymentRequest({
      orderId: 'ord-1',
      gateway: 'stripe',
      amount: 10,
      currency: 'OMR',
    });
    expect(lower).toBe(upper);
  });

  it('defaults missing currency to OMR', () => {
    const withDefault = hashPaymentRequest({
      orderId: 'ord-1',
      gateway: 'cod',
      amount: 5,
      currency: '',
    });
    const explicit = hashPaymentRequest({
      orderId: 'ord-1',
      gateway: 'cod',
      amount: 5,
      currency: 'OMR',
    });
    expect(withDefault).toBe(explicit);
  });

  it('changes when orderId, gateway, amount, or currency changes', () => {
    const base = {
      orderId: 'ord-1',
      gateway: 'stripe',
      amount: 10,
      currency: 'OMR',
    };
    const baseHash = hashPaymentRequest(base);
    expect(hashPaymentRequest({ ...base, orderId: 'ord-2' })).not.toBe(baseHash);
    expect(hashPaymentRequest({ ...base, gateway: 'paypal' })).not.toBe(baseHash);
    expect(hashPaymentRequest({ ...base, amount: 11 })).not.toBe(baseHash);
    expect(hashPaymentRequest({ ...base, currency: 'USD' })).not.toBe(baseHash);
  });

  it('matches the SHA-256 JSON pattern used by payments.service', () => {
    const input = {
      orderId: 'ord-42',
      gateway: 'thawani',
      amount: 99.9,
      currency: 'OMR',
    };
    const expected = createHash('sha256')
      .update(
        JSON.stringify({
          orderId: input.orderId,
          gateway: String(input.gateway || '').toLowerCase(),
          amount: Number(input.amount),
          currency: String(input.currency || 'OMR').toUpperCase(),
        }),
      )
      .digest('hex');
    expect(hashPaymentRequest(input)).toBe(expected);
  });
});
