/**
 * @fileoverview Content Security Policy Middleware
 * @description Express middleware that sets CSP headers with nonce support.
 * Implements OWASP Content Security Policy Cheat Sheet recommendations.
 *
 * Features:
 * - Dynamic nonce generation for inline scripts/styles
 * - Environment-specific CSP policies
 * - CSP violation reporting
 * - Payment page extra-strict policy
 * - Report-Only mode support
 *
 * OWASP: Defense in depth against XSS and data injection attacks.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import {
  CspConfig,
  getCspConfig,
  buildCspString,
  getPaymentCspConfig,
} from './csp.config';

/** Request with CSP nonce attached */
export interface RequestWithCspNonce extends Request {
  cspNonce?: string;
}

/**
 * Generate a cryptographically secure nonce.
 * Used for inline script and style validation.
 */
function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

@Injectable()
export class CspMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CspMiddleware.name);

  /** CSP configuration for current environment */
  private readonly cspConfig: CspConfig;

  /** CSP header name (Content-Security-Policy or Report-Only) */
  private readonly headerName: string;

  constructor(private readonly configService: ConfigService) {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const forceReportOnly = this.configService.get<boolean>('CSP_REPORT_ONLY', false);

    // Check if this is a payment/checkout route
    this.cspConfig = getCspConfig(environment);

    if (forceReportOnly) {
      this.cspConfig.reportOnly = true;
    }

    this.headerName = this.cspConfig.reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
  }

  /**
   * Apply CSP headers to the response.
   */
  use(request: RequestWithCspNonce, response: Response, next: NextFunction): void {
    try {
      // Determine which CSP config to use
      let config = this.cspConfig;

      // Use extra-strict policy for payment/checkout routes
      if (this.isPaymentRoute(request.path)) {
        config = getPaymentCspConfig();
        this.logger.debug(`Applying payment CSP for ${request.path}`);
      }

      // Generate nonce if enabled
      let nonce: string | undefined;
      if (config.useNonce) {
        nonce = generateNonce();
        request.cspNonce = nonce;

        // Make nonce available to response locals for template engines
        response.locals.cspNonce = nonce;
      }

      // Build directives with nonce values
      const directives = this.buildDirectives(config, nonce);

      // Build CSP header value
      const cspString = buildCspString(directives);

      // Set the CSP header
      response.setHeader(this.headerName, cspString);

      // Set Report-To header for modern browsers
      if (config.reportTo) {
        response.setHeader(
          'Report-To',
          JSON.stringify({
            group: config.reportTo,
            max_age: 31536000,
            endpoints: [{ url: config.reportUri }],
          }),
        );
      }

      // Set nonce in a custom header for client-side use
      if (nonce) {
        response.setHeader('X-CSP-Nonce', nonce);
      }

      next();
    } catch (error) {
      this.logger.error(`CSP middleware error: ${(error as Error).message}`);
      next();
    }
  }

  /**
   * Build CSP directives with nonce substitution.
   */
  private buildDirectives(config: CspConfig, nonce?: string): Record<string, string[]> {
    const directives: Record<string, string[]> = {};

    for (const [directive, sources] of Object.entries(config.directives)) {
      // Substitute nonce placeholder with actual nonce value
      const processedSources = sources.map((source) => {
        if (source === "'nonce'") {
          return nonce ? `'nonce-${nonce}'` : "'self'";
        }
        return source;
      });

      directives[directive] = processedSources;
    }

    // Add nonce to script-src and style-src if not already present
    if (nonce && config.useNonce) {
      // For script-src, add nonce
      if (directives['script-src']) {
        const hasNonce = directives['script-src'].some((s) => s.startsWith("'nonce-"));
        if (!hasNonce) {
          directives['script-src'].push(`'nonce-${nonce}'`);
        }
        // Remove unsafe-inline when nonce is present (browsers prefer nonce)
        directives['script-src'] = directives['script-src'].filter(
          (s) => s !== "'unsafe-inline'",
        );
      }

      // For style-src, add nonce
      if (directives['style-src']) {
        const hasNonce = directives['style-src'].some((s) => s.startsWith("'nonce-"));
        if (!hasNonce) {
          directives['style-src'].push(`'nonce-${nonce}'`);
        }
      }
    }

    // Add report-uri if configured
    if (config.reportUri && !config.reportOnly) {
      directives['report-uri'] = [config.reportUri];
    }

    return directives;
  }

  /**
   * Check if the request path is a payment/checkout route.
   */
  private isPaymentRoute(path: string): boolean {
    const paymentPatterns = [
      /\/checkout/,
      /\/payment/,
      /\/pay/,
      /\/billing/,
      /\/subscribe/,
      /\/order\/confirm/,
      /\/cart\/checkout/,
    ];

    return paymentPatterns.some((pattern) => pattern.test(path));
  }
}

/**
 * Factory function to create CSP middleware with custom config.
 */
export function createCspMiddleware(config: CspConfig): NestMiddleware {
  return {
    use(request: RequestWithCspNonce, response: Response, next: NextFunction): void {
      try {
        let nonce: string | undefined;
        if (config.useNonce) {
          nonce = generateNonce();
          request.cspNonce = nonce;
          response.locals.cspNonce = nonce;
        }

        const directives: Record<string, string[]> = {};
        for (const [directive, sources] of Object.entries(config.directives)) {
          directives[directive] = sources.map((source) => {
            if (source === "'nonce'") {
              return nonce ? `'nonce-${nonce}'` : "'self'";
            }
            return source;
          });
        }

        if (nonce && config.useNonce) {
          if (directives['script-src'] && !directives['script-src'].some((s) => s.startsWith("'nonce-"))) {
            directives['script-src'].push(`'nonce-${nonce}'`);
            directives['script-src'] = directives['script-src'].filter((s) => s !== "'unsafe-inline'");
          }
          if (directives['style-src'] && !directives['style-src'].some((s) => s.startsWith("'nonce-"))) {
            directives['style-src'].push(`'nonce-${nonce}'`);
          }
        }

        const cspString = buildCspString(directives);
        const headerName = config.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';

        response.setHeader(headerName, cspString);

        if (nonce) {
          response.setHeader('X-CSP-Nonce', nonce);
        }

        next();
      } catch (error) {
        Logger.error(`CSP middleware error: ${(error as Error).message}`);
        next();
      }
    },
  };
}
