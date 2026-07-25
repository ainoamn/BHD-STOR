import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

export type WhatsAppWebhookProvider = 'meta' | 'twilio' | 'unknown';

export function detectWhatsAppProvider(
  payload: Record<string, any> | undefined,
): WhatsAppWebhookProvider {
  if (payload?.object === 'whatsapp_business_account') return 'meta';
  if (payload?.From || payload?.MessageSid || payload?.SmsMessageSid) {
    return 'twilio';
  }
  return 'unknown';
}

/** Meta Cloud API: `X-Hub-Signature-256: sha256=<hmac>` over raw body. */
export function verifyMetaSignature(
  rawBody: string | Buffer | undefined,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!rawBody || !signatureHeader || !appSecret) return false;
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');
  return timingSafeEqualString(expected, signatureHeader.trim());
}

/**
 * Twilio request validation:
 * HMAC-SHA1(authToken, url + sorted(key+value…)) → base64.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, any>,
  signatureHeader: string | undefined,
  authToken: string,
): boolean {
  if (!url || !signatureHeader || !authToken) return false;
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k] ?? ''}`)
      .join('');
  const expected = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
  return timingSafeEqualString(expected, signatureHeader.trim());
}

export interface AssertWhatsAppWebhookOptions {
  isProduction: boolean;
  provider: WhatsAppWebhookProvider;
  rawBody?: string | Buffer;
  metaSignature?: string;
  twilioSignature?: string;
  /** Full public URL Twilio used (incl. query). */
  twilioUrl?: string;
  twilioParams?: Record<string, any>;
  metaAppSecret?: string;
  twilioAuthToken?: string;
  /** When true (non-prod), missing secrets skip verification with warn path. */
  allowUnsignedInDev?: boolean;
}

/**
 * Fail-closed in production: require configured secret + valid signature.
 * In development: if secrets unset and allowUnsignedInDev, skip; else verify.
 */
export function assertWhatsAppWebhookSignature(
  opts: AssertWhatsAppWebhookOptions,
): void {
  const allowDevSkip =
    !opts.isProduction && opts.allowUnsignedInDev !== false;

  if (opts.provider === 'meta') {
    const secret = (opts.metaAppSecret || '').trim();
    if (!secret) {
      if (opts.isProduction) {
        throw new UnauthorizedException(
          'WhatsApp Meta app secret is not configured',
        );
      }
      if (allowDevSkip) return;
      throw new UnauthorizedException(
        'WhatsApp Meta app secret is not configured',
      );
    }
    if (
      !verifyMetaSignature(opts.rawBody, opts.metaSignature, secret)
    ) {
      throw new UnauthorizedException('Invalid Meta webhook signature');
    }
    return;
  }

  if (opts.provider === 'twilio') {
    const token = (opts.twilioAuthToken || '').trim();
    if (!token) {
      if (opts.isProduction) {
        throw new UnauthorizedException(
          'Twilio auth token is not configured',
        );
      }
      if (allowDevSkip) return;
      throw new UnauthorizedException(
        'Twilio auth token is not configured',
      );
    }
    if (
      !verifyTwilioSignature(
        opts.twilioUrl || '',
        opts.twilioParams || {},
        opts.twilioSignature,
        token,
      )
    ) {
      throw new UnauthorizedException('Invalid Twilio webhook signature');
    }
    return;
  }

  // Unknown payload shape
  if (opts.isProduction) {
    throw new UnauthorizedException('Unrecognized WhatsApp webhook payload');
  }
  if (allowDevSkip) return;
  throw new UnauthorizedException('Unrecognized WhatsApp webhook payload');
}

function timingSafeEqualString(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
