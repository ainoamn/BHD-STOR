import * as crypto from 'crypto';
import {
  assertWhatsAppWebhookSignature,
  detectWhatsAppProvider,
  verifyMetaSignature,
  verifyTwilioSignature,
} from './webhook-signature';

describe('whatsapp webhook-signature', () => {
  describe('detectWhatsAppProvider', () => {
    it('detects meta', () => {
      expect(
        detectWhatsAppProvider({ object: 'whatsapp_business_account' }),
      ).toBe('meta');
    });

    it('detects twilio', () => {
      expect(
        detectWhatsAppProvider({ From: 'whatsapp:+968', Body: 'hi' }),
      ).toBe('twilio');
    });
  });

  describe('verifyMetaSignature', () => {
    it('accepts valid hmac', () => {
      const secret = 'app-secret';
      const body = '{"object":"whatsapp_business_account"}';
      const sig =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(body).digest('hex');
      expect(verifyMetaSignature(body, sig, secret)).toBe(true);
    });

    it('rejects bad hmac', () => {
      expect(
        verifyMetaSignature('{}', 'sha256=deadbeef', 'app-secret'),
      ).toBe(false);
    });
  });

  describe('verifyTwilioSignature', () => {
    it('accepts valid signature', () => {
      const token = 'auth-token';
      const url = 'https://example.com/whatsapp/webhook';
      const params = { From: 'whatsapp:+968', Body: 'hi' };
      const data =
        url +
        Object.keys(params)
          .sort()
          .map((k) => `${k}${params[k]}`)
          .join('');
      const sig = crypto
        .createHmac('sha1', token)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64');
      expect(verifyTwilioSignature(url, params, sig, token)).toBe(true);
    });
  });

  describe('assertWhatsAppWebhookSignature', () => {
    it('rejects missing secret in production', () => {
      expect(() =>
        assertWhatsAppWebhookSignature({
          isProduction: true,
          provider: 'meta',
          rawBody: '{}',
          metaSignature: 'sha256=x',
          metaAppSecret: '',
        }),
      ).toThrow(/not configured/i);
    });

    it('allows unsigned in non-prod when secret unset', () => {
      expect(() =>
        assertWhatsAppWebhookSignature({
          isProduction: false,
          provider: 'meta',
          rawBody: '{}',
          metaAppSecret: '',
          allowUnsignedInDev: true,
        }),
      ).not.toThrow();
    });

    it('verifies when secret set', () => {
      const secret = 's';
      const body = '{}';
      const sig =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(body).digest('hex');
      expect(() =>
        assertWhatsAppWebhookSignature({
          isProduction: true,
          provider: 'meta',
          rawBody: body,
          metaSignature: sig,
          metaAppSecret: secret,
        }),
      ).not.toThrow();
    });
  });
});
