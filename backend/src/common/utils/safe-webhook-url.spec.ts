import { assertSafeWebhookUrl, isPrivateOrReservedIp } from './safe-webhook-url';

describe('isPrivateOrReservedIp', () => {
  it('blocks loopback and RFC1918', () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIp('::1')).toBe(true);
  });

  it('allows public addresses', () => {
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
    expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
  });
});

describe('assertSafeWebhookUrl', () => {
  const prev = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = prev;
  });

  it('rejects http in production', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      assertSafeWebhookUrl('http://example.com/hook'),
    ).rejects.toThrow(/HTTPS/);
  });

  it('rejects private IP literals', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      assertSafeWebhookUrl('https://127.0.0.1/hook'),
    ).rejects.toThrow(/private|reserved/i);
    await expect(
      assertSafeWebhookUrl('https://169.254.169.254/latest'),
    ).rejects.toThrow(/private|reserved|not allowed/i);
  });

  it('rejects metadata hostnames', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      assertSafeWebhookUrl('https://metadata.google.internal/'),
    ).rejects.toThrow(/not allowed/i);
  });

  it('allows https public host that resolves publicly', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      assertSafeWebhookUrl('https://example.com/webhook'),
    ).resolves.toBeUndefined();
  });
});
