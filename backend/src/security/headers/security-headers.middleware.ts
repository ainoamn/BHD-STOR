/**
 * @fileoverview Security Headers Middleware
 * @description Sets comprehensive security headers on all HTTP responses.
 * Follows OWASP Secure Headers Project recommendations.
 *
 * Headers Set:
 * - Strict-Transport-Security: Force HTTPS
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-Frame-Options: Prevent clickjacking
 * - X-XSS-Protection: Legacy XSS filter (IE)
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Restrict browser features
 * - Cross-Origin-*: COOP/COEP/CORP for cross-origin isolation
 * - Remove X-Powered-By: Hide server technology
 *
 * OWASP: A05:2021 – Security Misconfiguration prevention.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/** Security headers configuration */
export interface SecurityHeadersConfig {
  /** Enable Strict-Transport-Security */
  hsts?: boolean;
  /** HSTS max-age in seconds */
  hstsMaxAge?: number;
  /** Include subdomains in HSTS */
  hstsIncludeSubdomains?: boolean;
  /** Enable X-Content-Type-Options */
  noSniff?: boolean;
  /** X-Frame-Options value */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  /** Enable X-XSS-Protection (legacy) */
  xssFilter?: boolean;
  /** Referrer-Policy value */
  referrerPolicy?: string;
  /** Permissions-Policy features */
  permissionsPolicy?: Record<string, string[]>;
  /** Cross-Origin-Embedder-Policy */
  coep?: 'require-corp' | 'credentialless' | false;
  /** Cross-Origin-Opener-Policy */
  coop?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  /** Cross-Origin-Resource-Policy */
  corp?: 'cross-origin' | 'same-origin' | 'same-site';
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);
  private readonly config: SecurityHeadersConfig;

  constructor(private readonly configService: ConfigService) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    this.config = {
      hsts: isProduction,
      hstsMaxAge: 63072000, // 2 years in seconds
      hstsIncludeSubdomains: true,
      noSniff: true,
      frameOptions: 'DENY',
      xssFilter: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        geolocation: [],
        microphone: [],
        camera: [],
        payment: ['self'],
        usb: [],
        magnetometer: [],
        gyroscope: [],
        accelerometer: [],
        autoplay: [],
        fullscreen: ['self'],
      },
      coep: isProduction ? 'require-corp' : false,
      coop: isProduction ? 'same-origin' : 'unsafe-none',
      corp: 'cross-origin',
    };

    this.logger.log('SecurityHeadersMiddleware initialized');
  }

  use(_request: Request, response: Response, next: NextFunction): void {
    // 1. Strict-Transport-Security (HSTS)
    // Forces browsers to always use HTTPS for this domain
    // OWASP: Protects against SSL stripping attacks
    if (this.config.hsts) {
      let hstsValue = `max-age=${this.config.hstsMaxAge}`;
      if (this.config.hstsIncludeSubdomains) {
        hstsValue += '; includeSubDomains';
      }
      // Enable preload for HSTS preload list
      hstsValue += '; preload';
      response.setHeader('Strict-Transport-Security', hstsValue);
    }

    // 2. X-Content-Type-Options
    // Prevents browsers from MIME-sniffing responses
    // OWASP: Protects against MIME confusion attacks
    if (this.config.noSniff) {
      response.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // 3. X-Frame-Options
    // Prevents clickjacking by controlling iframe embedding
    // OWASP: Clickjacking defense
    if (this.config.frameOptions) {
      response.setHeader('X-Frame-Options', this.config.frameOptions);
    }

    // 4. X-XSS-Protection (Legacy)
    // Enables browser XSS filter (primarily for older IE)
    // Modern browsers use CSP instead, but this provides defense in depth
    if (this.config.xssFilter) {
      response.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // 5. Referrer-Policy
    // Controls how much referrer information is sent with requests
    // OWASP: Privacy protection, prevents URL leakage
    if (this.config.referrerPolicy) {
      response.setHeader('Referrer-Policy', this.config.referrerPolicy);
    }

    // 6. Permissions-Policy (formerly Feature-Policy)
    // Restricts which browser features can be used
    // OWAPI: Prevents unauthorized use of sensitive APIs
    if (this.config.permissionsPolicy) {
      const policyString = Object.entries(this.config.permissionsPolicy)
        .map(([feature, allowlist]) => {
          if (allowlist.length === 0) {
            return `${feature}=()`;
          }
          const values = allowlist.map((v) => (v === 'self' ? 'self' : v));
          return `${feature}=(${values.join(' ')})`;
        })
        .join(', ');
      response.setHeader('Permissions-Policy', policyString);
    }

    // 7. Cross-Origin-Embedder-Policy (COEP)
    // Controls cross-origin resource embedding
    if (this.config.coep) {
      response.setHeader('Cross-Origin-Embedder-Policy', this.config.coep);
    }

    // 8. Cross-Origin-Opener-Policy (COOP)
    // Isolates the document from cross-origin windows
    if (this.config.coop) {
      response.setHeader('Cross-Origin-Opener-Policy', this.config.coop);
    }

    // 9. Cross-Origin-Resource-Policy (CORP)
    // Controls cross-origin resource sharing at the resource level
    if (this.config.corp) {
      response.setHeader('Cross-Origin-Resource-Policy', this.config.corp);
    }

    // 10. Remove X-Powered-By
    // Hide server technology to reduce attack surface
    response.removeHeader('X-Powered-By');

    // 11. Additional security headers
    // Expect-CT: Enforce Certificate Transparency
    response.setHeader(
      'Expect-CT',
      'max-age=86400, enforce',
    );

    // Cache-Control for sensitive routes
    // Prevent caching of sensitive data
    if (this.isSensitivePath(_request.path)) {
      response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
    }

    next();
  }

  /**
   * Check if a path is sensitive and should not be cached.
   */
  private isSensitivePath(path: string): boolean {
    const sensitivePatterns = [
      /\/auth/,
      /\/login/,
      /\/api-keys/,
      /\/checkout/,
      /\/payment/,
      /\/admin/,
      /\/user/,
      /\/account/,
      /\/settings/,
      /\/csrf-token/,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(path));
  }
}

/**
 * Factory function for creating the middleware with custom config.
 */
export function createSecurityHeadersMiddleware(
  config: SecurityHeadersConfig,
): NestMiddleware {
  return {
    use(_request: Request, response: Response, next: NextFunction): void {
      if (config.hsts) {
        let hstsValue = `max-age=${config.hstsMaxAge || 63072000}`;
        if (config.hstsIncludeSubdomains) {
          hstsValue += '; includeSubDomains';
        }
        hstsValue += '; preload';
        response.setHeader('Strict-Transport-Security', hstsValue);
      }

      if (config.noSniff !== false) {
        response.setHeader('X-Content-Type-Options', 'nosniff');
      }

      if (config.frameOptions) {
        response.setHeader('X-Frame-Options', config.frameOptions);
      }

      if (config.xssFilter) {
        response.setHeader('X-XSS-Protection', '1; mode=block');
      }

      if (config.referrerPolicy) {
        response.setHeader('Referrer-Policy', config.referrerPolicy);
      }

      if (config.permissionsPolicy) {
        const policyString = Object.entries(config.permissionsPolicy)
          .map(([feature, allowlist]) => {
            if (allowlist.length === 0) {
              return `${feature}=()`;
            }
            const values = allowlist.map((v) => (v === 'self' ? 'self' : v));
            return `${feature}=(${values.join(' ')})`;
          })
          .join(', ');
        response.setHeader('Permissions-Policy', policyString);
      }

      if (config.coep) {
        response.setHeader('Cross-Origin-Embedder-Policy', config.coep);
      }

      if (config.coop) {
        response.setHeader('Cross-Origin-Opener-Policy', config.coop);
      }

      if (config.corp) {
        response.setHeader('Cross-Origin-Resource-Policy', config.corp);
      }

      response.removeHeader('X-Powered-By');
      next();
    },
  };
}
