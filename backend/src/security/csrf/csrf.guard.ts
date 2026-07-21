/**
 * @fileoverview CSRF Guard
 * @description NestJS guard implementing double-submit cookie CSRF protection.
 * Validates CSRF tokens on all state-changing requests.
 *
 * OWASP: A01:2021 – Broken Access Control (CSRF prevention).
 * Flow:
 * 1. Client requests CSRF token via GET /csrf-token
 * 2. Server sets XSRF-TOKEN cookie and returns token in response body
 * 3. Client reads cookie and sends token in X-XSRF-TOKEN header
 * 4. Guard validates that header token matches cookie token
 * 5. Also validates Origin/Referer headers
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CsrfService,
  CSRF_TOKEN_COOKIE,
  CSRF_HEADER_NAME,
} from './csrf.service';

/** Request with CSRF token attached */
export interface RequestWithCsrf extends Request {
  csrfToken?: string;
}

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(private readonly csrfService: CsrfService) {}

  /**
   * Validate CSRF protection for the request.
   *
   * @param context - Execution context
   * @returns true if CSRF validation passes
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if CSRF is disabled
    if (!this.csrfService.isEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithCsrf>();
    const method = request.method;
    const path = request.path;

    // Safe methods don't require CSRF validation
    if (this.csrfService.isSafeMethod(method)) {
      return true;
    }

    // Check exempt paths
    if (this.csrfService.isExemptPath(path)) {
      this.logger.debug(`CSRF exempt path: ${path}`);
      return true;
    }

    // Check if request uses API key authentication (bypasses CSRF)
    if (this.hasApiKeyAuth(request)) {
      this.logger.debug(`API key auth detected, skipping CSRF check: ${path}`);
      return true;
    }

    // Check if request uses JWT Bearer auth (bypasses CSRF for stateless APIs)
    if (this.hasBearerToken(request)) {
      this.logger.debug(`Bearer token auth detected, skipping CSRF check: ${path}`);
      return true;
    }

    // Validate Origin/Referer headers
    const originValid = this.csrfService.validateOrigin(
      request.headers.origin as string | undefined,
    );
    const refererValid = this.csrfService.validateReferer(
      request.headers.referer as string | undefined,
    );

    if (!originValid && !refererValid) {
      this.logger.warn(`CSRF Origin/Referer validation failed: ${method} ${path}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: 'CSRF validation failed: untrusted origin.',
          code: 'CSRF_ORIGIN_INVALID',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Extract tokens for double-submit validation
    const cookieToken = this.extractCookieToken(request);
    const submittedToken = this.extractSubmittedToken(request);

    // If no cookie token exists, client needs to get one first
    if (!cookieToken) {
      this.logger.warn(`CSRF cookie missing: ${method} ${path}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: 'CSRF token cookie is missing. Request a new token from GET /csrf-token.',
          code: 'CSRF_COOKIE_MISSING',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // If no submitted token in header
    if (!submittedToken) {
      this.logger.warn(`CSRF header missing: ${method} ${path}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: `CSRF token header (${CSRF_HEADER_NAME}) is missing.`,
          code: 'CSRF_HEADER_MISSING',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Validate the double-submit tokens
    const isValid = this.csrfService.validateToken(cookieToken, submittedToken);

    if (!isValid) {
      this.logger.warn(`CSRF token mismatch: ${method} ${path}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: 'CSRF token validation failed. The token may be expired or tampered with.',
          code: 'CSRF_TOKEN_INVALID',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Attach validated token to request for potential rotation
    request.csrfToken = submittedToken;

    return true;
  }

  /**
   * Extract CSRF token from cookie.
   */
  private extractCookieToken(request: RequestWithCsrf): string | undefined {
    const cookies = request.headers.cookie;
    if (!cookies) {
      // Check signed cookies if using cookie-parser
      // @ts-expect-error signedCookies from cookie-parser
      if (request.signedCookies?.[CSRF_TOKEN_COOKIE]) {
        // @ts-expect-error
        return request.signedCookies[CSRF_TOKEN_COOKIE] as string;
      }
      // @ts-expect-error cookies from cookie-parser
      if (request.cookies?.[CSRF_TOKEN_COOKIE]) {
        // @ts-expect-error
        return request.cookies[CSRF_TOKEN_COOKIE] as string;
      }
      return undefined;
    }

    // Parse cookie manually
    const match = cookies.match(new RegExp(`${CSRF_TOKEN_COOKIE}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  /**
   * Extract submitted CSRF token from request header.
   * Supports multiple header names for compatibility.
   */
  private extractSubmittedToken(request: RequestWithCsrf): string | undefined {
    // Primary header (Angular/Axios convention)
    const xsrfHeader = request.headers[CSRF_HEADER_NAME.toLowerCase()];
    if (xsrfHeader) {
      return Array.isArray(xsrfHeader) ? xsrfHeader[0] : xsrfHeader;
    }

    // Alternative header names
    const altHeaders = ['x-csrf-token', 'csrf-token', 'xsrf-token'];
    for (const header of altHeaders) {
      const value = request.headers[header];
      if (value) {
        return Array.isArray(value) ? value[0] : value;
      }
    }

    // Check request body for csrfToken field
    if (request.body?.csrfToken) {
      return String(request.body.csrfToken);
    }

    return undefined;
  }

  /**
   * Check if request has API key authentication.
   */
  private hasApiKeyAuth(request: RequestWithCsrf): boolean {
    const apiKey = request.headers['x-api-key'];
    return !!apiKey;
  }

  /**
   * Check if request has Bearer token authentication.
   */
  private hasBearerToken(request: RequestWithCsrf): boolean {
    const auth = request.headers.authorization;
    return !!auth && auth.startsWith('Bearer ');
  }
}
