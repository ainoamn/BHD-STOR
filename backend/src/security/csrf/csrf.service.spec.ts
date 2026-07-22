import { CsrfService } from './csrf.service';

describe('CsrfService.isExemptPath', () => {
  const service = {
    isExemptPath: CsrfService.prototype.isExemptPath,
  } as CsrfService;

  it('exempts payment webhooks with and without /api prefix', () => {
    expect(service.isExemptPath('/api/v1/payments/webhook/stripe')).toBe(true);
    expect(service.isExemptPath('/v1/payments/webhook/telr')).toBe(true);
    expect(service.isExemptPath('/payments/webhook/thawani')).toBe(true);
  });

  it('exempts whatsapp webhooks', () => {
    expect(service.isExemptPath('/api/v1/whatsapp/webhook')).toBe(true);
    expect(service.isExemptPath('/whatsapp/webhook')).toBe(true);
  });

  it('does not exempt cart mutations', () => {
    expect(service.isExemptPath('/api/v1/cart/items')).toBe(false);
    expect(service.isExemptPath('/api/v1/auth/login')).toBe(false);
  });
});
