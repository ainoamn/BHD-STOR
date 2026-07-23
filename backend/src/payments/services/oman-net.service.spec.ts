import { OmanNetService } from './oman-net.service';
import * as crypto from 'crypto';

describe('OmanNetService callback hardening', () => {
  const apiKey = 'test-api-key';

  function makeService() {
    const config = {
      get: (key: string) => {
        if (key === 'OMAN_NET_MERCHANT_ID') return 'merchant';
        if (key === 'OMAN_NET_API_KEY') return apiKey;
        if (key === 'OMAN_NET_ENVIRONMENT') return 'sandbox';
        if (key === 'APP_URL') return 'http://localhost:3000';
        return undefined;
      },
    } as any;
    return new OmanNetService(config);
  }

  function sign(payload: Record<string, unknown>): string {
    const { hash: _h, ...dataWithoutHash } = payload as any;
    void _h;
    const orderedKeys = Object.keys(dataWithoutHash).sort();
    const hashString = orderedKeys.map((k) => `${k}=${dataWithoutHash[k]}`).join('&');
    return crypto.createHmac('sha256', apiKey).update(hashString).digest('hex');
  }

  it('rejects callback when hash is missing', async () => {
    const svc = makeService();
    const result = await svc.processCallback({
      transaction_id: 'tx1',
      order_id: 'ord1',
      status: 'completed',
      amount: '10.000',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing callback hash/i);
  });

  it('rejects callback when hash mismatches', async () => {
    const svc = makeService();
    const result = await svc.processCallback({
      transaction_id: 'tx1',
      order_id: 'ord1',
      status: 'completed',
      amount: '10.000',
      hash: 'deadbeef',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/hash verification failed/i);
  });

  it('accepts non-success status with valid hash without re-verify', async () => {
    const svc = makeService();
    const payload = {
      transaction_id: 'tx1',
      order_id: 'ord1',
      status: 'failed',
      amount: '10.000',
      card_number: '****',
    };
    const result = await svc.processCallback({
      ...payload,
      hash: sign(payload),
    });
    expect(result.success).toBe(false);
    expect(result.transactionId).toBe('tx1');
    expect(result.status).toBe('failed');
    expect(result.error).toBeUndefined();
  });
});
