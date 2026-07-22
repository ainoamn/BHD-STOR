import { TelrService } from './telr.service';

describe('TelrService webhook hardening helpers', () => {
  it('checkPayment rejects empty order_ref without calling HTTP', async () => {
    const config = {
      get: (key: string) => {
        if (key === 'TELR_STORE_ID') return 'store';
        if (key === 'TELR_AUTH_KEY') return 'key';
        if (key === 'TELR_ENVIRONMENT') return 'sandbox';
        return undefined;
      },
    } as any;
    const svc = new TelrService(config);
    const result = await svc.checkPayment('');
    expect(result.success).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/order_ref/i);
  });

  it('processCallback requires order_ref and does not trust status alone', async () => {
    const config = {
      get: (key: string) => {
        if (key === 'TELR_STORE_ID') return 'store';
        if (key === 'TELR_AUTH_KEY') return 'key';
        if (key === 'TELR_ENVIRONMENT') return 'sandbox';
        return undefined;
      },
    } as any;
    const svc = new TelrService(config);
    const forged = await svc.processCallback({
      status: '3',
      tran_ref: 'only-tran',
      amount: '99.000',
    });
    expect(forged.success).toBe(false);
    expect(forged.verified).toBe(false);
    expect(forged.error).toMatch(/order_ref/i);
  });
});
