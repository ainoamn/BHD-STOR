import {
  canRevealWhatsAppOrder,
  normalizePhoneDigits,
  phonesMatch,
} from './order-access';

describe('whatsapp order-access', () => {
  it('normalizePhoneDigits strips non-digits', () => {
    expect(normalizePhoneDigits('+968 9123-4567')).toBe('96891234567');
  });

  it('phonesMatch handles country code variants', () => {
    expect(phonesMatch('+96891234567', '91234567')).toBe(true);
    expect(phonesMatch('96891234567', '+96891234567')).toBe(true);
    expect(phonesMatch('91234567', '91239999')).toBe(false);
  });

  it('canRevealWhatsAppOrder by userId or phone', () => {
    expect(
      canRevealWhatsAppOrder({
        orderUserId: 'u1',
        sessionUserId: 'u1',
        sessionPhone: '+96890000000',
      }),
    ).toBe(true);

    expect(
      canRevealWhatsAppOrder({
        orderUserId: 'u1',
        shippingPhone: '+96891234567',
        sessionUserId: undefined,
        sessionPhone: '91234567',
      }),
    ).toBe(true);

    expect(
      canRevealWhatsAppOrder({
        orderUserId: 'u1',
        shippingPhone: '+96891234567',
        sessionUserId: 'other',
        sessionPhone: '+96890000000',
      }),
    ).toBe(false);
  });
});
