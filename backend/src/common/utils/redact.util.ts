const MAX_DEPTH = 8;
const REDACTED = '[REDACTED]';

/** Normalized (lowercase, no `_`/`-`) sensitive key names */
const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'refreshtoken',
  'accesstoken',
  'resettoken',
  'cvv',
  'cvc',
  'cardnumber',
  'pan',
  'privatekey',
  'clientsecret',
  'webhooksecret',
  'verifytoken',
  'xapikey',
  'setcookie',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, '');
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(normalizeKey(key));
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.includes('://');
}

function stripUrlQuery(value: string): string {
  if (looksLikeUrl(value)) {
    try {
      if (/^https?:\/\//i.test(value)) {
        const url = new URL(value);
        url.search = '';
        url.hash = '';
        return url.toString();
      }
    } catch {
      // fall through
    }
    const q = value.indexOf('?');
    return q >= 0 ? value.slice(0, q) : value;
  }

  // Express-style path + query (e.g. /webhook?hub.verify_token=...)
  if (value.startsWith('/') && value.includes('?')) {
    return value.slice(0, value.indexOf('?'));
  }

  return value;
}

/**
 * Recursively redact sensitive fields from arbitrary values for safe logging.
 */
export function redactSensitive(value: unknown, depth: number = MAX_DEPTH): unknown {
  if (depth < 0) {
    return REDACTED;
  }

  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return stripUrlQuery(value);
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date || value instanceof RegExp) {
    return value;
  }

  if (value instanceof Error) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const nested = (value as unknown as Record<string, unknown>)[key];
      out[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(nested, depth - 1);
    }
    return out;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth - 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(nested, depth - 1);
  }
  return out;
}
