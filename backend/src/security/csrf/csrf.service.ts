/**
 * @fileoverview CSRF Protection Service
 * @description Implements double-submit cookie pattern for CSRF protection.
 * Follows OWASP CSRF Prevention Cheat Sheet recommendations.
 *
 * Key Features:
 * - Double-submit cookie pattern (stateless, no server storage needed)
 * - Cryptographically secure token generation
 * - Token rotation on sensitive actions
 * - Secure cookie attributes (HttpOnly, Secure, SameSite)
 * - Custom token header extraction
 *
 * OWASP: A01:2021 – Broken Access Control prevention.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual, createHash } from 'crypto';

/** Token cookie name */
export const CSRF_TOKEN_COOKIE = 'XSRF-TOKEN';

/** Token header name (Angular/Axios convention) */
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/** Token TTL in seconds (24 hours) */
const TOKEN_TTL_SECONDS = 86400;

/** Token length in bytes */
const TOKEN_LENGTH = 32;

/** Cookie options interface */
export interface CsrfCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
}

/** Generated CSRF token pair */
export interface CsrfToken {
  token: string;
  cookieToken: string;
  expiresAt: Date;
}

@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);

  /** Secret key for token signing/validation */
  private readonly secret: string;

  /** Cookie configuration */
  private readonly cookieOptions: CsrfCookieOptions;

  /** Whether CSRF protection is enabled */
  readonly isEnabled: boolean;

  /** Trusted origins for CORS/CSRF validation */
  private readonly trustedOrigins: Set<string>;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>(
      'CSRF_SECRET',
      this.generateFallbackSecret(),
    );

    this.isEnabled = this.configService.get<boolean>('CSRF_ENABLED', true);

    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';

    this.cookieOptions = {
      httpOnly: false, // Must be accessible by JavaScript for double-submit
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: TOKEN_TTL_SECONDS * 1000,
      path: '/',
      domain: this.configService.get<string>('CSRF_COOKIE_DOMAIN'),
    };

    // Load trusted origins
    this.trustedOrigins = new Set();
    const origins = this.configService.get<string>('TRUSTED_ORIGINS', '');
    if (origins) {
      origins.split(',').forEach((o) => this.trustedOrigins.add(o.trim()));
    }
    // Always trust the app origin
    const appOrigin = this.configService.get<string>('APP_ORIGIN');
    if (appOrigin) {
      this.trustedOrigins.add(appOrigin);
    }
  }

  /**
   * Generate a fallback secret from environment or random bytes.
   * This is only used when CSRF_SECRET is not configured.
   */
  private generateFallbackSecret(): string {
    const secret = randomBytes(64).toString('hex');
    this.logger.warn('CSRF_SECRET not configured, using generated secret. Set CSRF_SECRET in production!');
    return secret;
  }

  /**
   * Generate a new CSRF token pair.
   *
   * The double-submit cookie pattern:
   * 1. Server generates a random token
   * 2. Token is sent to client as a cookie (readable by JS)
   * 3. Client reads cookie and sends token in header
   * 4. Server compares cookie token with header token
   * 5. They must match for the request to proceed
   */
  generateToken(): CsrfToken {
    const rawToken = randomBytes(TOKEN_LENGTH);
    const token = rawToken.toString('base64url');

    // Create a derived cookie token using HMAC
    const cookieToken = this.deriveCookieToken(token);

    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    return {
      token,
      cookieToken,
      expiresAt,
    };
  }

  /**
   * Derive the cookie token from the main token using HMAC.
   * This binds the cookie value to our server secret.
   */
  private deriveCookieToken(token: string): string {
    return createHash('sha256')
      .update(this.secret + token)
      .digest('base64url');
  }

  /**
   * Validate that the submitted token matches the cookie token.
   *
   * @param cookieToken - Token from the cookie
   * @param submittedToken - Token from the request header/body
   * @returns True if tokens match
   */
  validateToken(cookieToken: string, submittedToken: string): boolean {
    if (!cookieToken || !submittedToken) {
      return false;
    }

    try {
      // Re-derive the expected cookie token from the submitted token
      const expectedCookieToken = this.deriveCookieToken(submittedToken);

      // Constant-time comparison to prevent timing attacks
      const cookieBuf = Buffer.from(cookieToken);
      const expectedBuf = Buffer.from(expectedCookieToken);

      if (cookieBuf.length !== expectedBuf.length) {
        return false;
      }

      return timingSafeEqual(cookieBuf, expectedBuf);
    } catch (error) {
      this.logger.error(`Token validation error: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Check if a token has expired.
   */
  isTokenExpired(token: CsrfToken): boolean {
    return new Date() > token.expiresAt;
  }

  /**
   * Get the configured cookie options for setting the CSRF cookie.
   */
  getCookieOptions(): CsrfCookieOptions {
    return { ...this.cookieOptions };
  }

  /**
   * Get the CSRF cookie name.
   */
  getCookieName(): string {
    return CSRF_TOKEN_COOKIE;
  }

  /**
   * Get the CSRF header name.
   */
  getHeaderName(): string {
    return CSRF_HEADER_NAME;
  }

  /**
   * Validate the Origin/Referer header against trusted origins.
   * Additional layer of CSRF protection.
   */
  validateOrigin(origin: string | undefined): boolean {
    if (!origin) {
      // Allow requests without Origin header (some legitimate clients)
      return true;
    }

    // Extract origin from URL
    let originHost: string;
    try {
      const url = new URL(origin);
      originHost = url.origin;
    } catch {
      originHost = origin;
    }

    // Check against trusted origins
    for (const trusted of this.trustedOrigins) {
      if (originHost === trusted || originHost.endsWith(trusted)) {
        return true;
      }
    }

    this.logger.warn(`Untrusted origin rejected: ${origin}`);
    return false;
  }

  /**
   * Validate the Referer header.
   */
  validateReferer(referer: string | undefined): boolean {
    if (!referer) {
      // Referer may be missing for legitimate reasons (privacy settings)
      return true;
    }

    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;

      for (const trusted of this.trustedOrigins) {
        if (refererOrigin === trusted) {
          return true;
        }
      }

      this.logger.warn(`Untrusted referer rejected: ${referer}`);
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get trusted origins list.
   */
  getTrustedOrigins(): string[] {
    return Array.from(this.trustedOrigins);
  }

  /**
   * Check if the request method requires CSRF validation.
   * Safe methods (GET, HEAD, OPTIONS, TRACE) don't modify state.
   */
  isSafeMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());
  }

  /**
   * Check if the request path should be exempt from CSRF protection.
   * Webhooks, API key endpoints, and OAuth callbacks may need exemptions.
   */
  isExemptPath(path: string): boolean {
    const exemptPatterns = [
      /^\/webhooks\//,
      /^\/api\/v\d+\/auth\/callback/,
      /^\/api\/v\d+\/oauth/,
      /^\/health/,
      /^\/metrics/,
      /^\/api\/v\d+\/public\//,
      /^\/graphql$/, // If using API key auth for GraphQL
      /^\/api\/v\d+\/payments\/webhook/,
      /^\/api\/v\d+\/s\/webhook/, // Short webhook URLs
    ];

    return exemptPatterns.some((pattern) => pattern.test(path));
  }
}
