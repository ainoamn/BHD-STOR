import { BadRequestException } from '@nestjs/common';
import { promises as dns } from 'dns';
import { isIP } from 'net';

const BLOCKED_METADATA_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.google.com',
  'metadata',
  'instance-data',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

/**
 * Returns true if the IPv4/IPv6 address is private, loopback, link-local,
 * cloud metadata, or otherwise unsafe for server-side egress (SSRF).
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b, c] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / AWS metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    // Unique local (fc00::/7), link-local (fe80::/10)
    if (
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }
    // IPv4-mapped / IPv4-compatible
    const v4Mapped = normalized.match(/:ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (v4Mapped) {
      return isPrivateOrReservedIp(v4Mapped[1]);
    }
    const last = normalized.split(':').pop();
    if (last && isIP(last) === 4) {
      return isPrivateOrReservedIp(last);
    }
    return false;
  }

  return true;
}

function isDevLocalhost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/**
 * Validate a customer webhook URL before storing or fetching it.
 * Blocks non-HTTPS (except localhost http in development), private/reserved
 * IPs, and well-known cloud metadata hosts.
 */
export async function assertSafeWebhookUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException('Invalid webhook URL');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const allowDevLocal =
    nodeEnv === 'development' && isDevLocalhost(parsed.hostname);

  if (parsed.protocol === 'http:') {
    if (!allowDevLocal) {
      throw new BadRequestException('Webhook URL must use HTTPS');
    }
  } else if (parsed.protocol !== 'https:') {
    throw new BadRequestException('Webhook URL must use HTTPS');
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException('Webhook URL must not include credentials');
  }

  const hostLower = parsed.hostname.toLowerCase();
  if (
    BLOCKED_METADATA_HOSTS.has(hostLower) ||
    hostLower.endsWith('.internal') ||
    hostLower.endsWith('.local')
  ) {
    throw new BadRequestException('Webhook URL host is not allowed');
  }

  if (isIP(parsed.hostname)) {
    if (isPrivateOrReservedIp(parsed.hostname) && !allowDevLocal) {
      throw new BadRequestException(
        'Webhook URL resolves to a private or reserved address',
      );
    }
    return;
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(parsed.hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new BadRequestException('Webhook URL hostname could not be resolved');
  }

  if (addresses.length === 0) {
    throw new BadRequestException('Webhook URL hostname could not be resolved');
  }

  for (const addr of addresses) {
    if (!isPrivateOrReservedIp(addr)) continue;
    if (
      nodeEnv === 'development' &&
      (addr === '127.0.0.1' || addr === '::1') &&
      isDevLocalhost(parsed.hostname)
    ) {
      continue;
    }
    throw new BadRequestException(
      'Webhook URL resolves to a private or reserved address',
    );
  }
}
