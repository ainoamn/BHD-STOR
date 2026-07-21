/**
 * @fileoverview XSS Guard
 * @description NestJS guard that validates all inputs for XSS patterns.
 * Returns 400 Bad Request when malicious input is detected.
 *
 * OWASP: A03:2021 – Injection prevention.
 * Provides early rejection of XSS payloads before they reach controllers.
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
import { XssSanitizerService, XssSeverity } from './xss-sanitizer.service';

/**
 * Recursively collect all string values from an object.
 */
function collectStrings(obj: unknown, strings: string[] = []): string[] {
  if (obj === null || obj === undefined) {
    return strings;
  }

  if (typeof obj === 'string') {
    strings.push(obj);
    return strings;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item) => collectStrings(item, strings));
    return strings;
  }

  if (typeof obj === 'object') {
    Object.values(obj).forEach((value) => collectStrings(value, strings));
  }

  return strings;
}

/**
 * Recursively scan all values in an object for XSS patterns.
 */
function scanObjectForXss(
  obj: unknown,
  sanitizer: XssSanitizerService,
  results: Array<{ path: string; result: ReturnType<XssSanitizerService['detectXss']> }> = [],
  path = '',
): Array<{ path: string; result: ReturnType<XssSanitizerService['detectXss']> }> {
  if (obj === null || obj === undefined) {
    return results;
  }

  if (typeof obj === 'string') {
    const result = sanitizer.detectXss(obj);
    if (result.isMalicious) {
      results.push({ path, result });
    }
    return results;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      scanObjectForXss(item, sanitizer, results, `${path}[${index}]`);
    });
    return results;
  }

  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      scanObjectForXss(value, sanitizer, results, path ? `${path}.${key}` : key);
    });
  }

  return results;
}

@Injectable()
export class XssGuard implements CanActivate {
  private readonly logger = new Logger(XssGuard.name);

  constructor(private readonly xssSanitizer: XssSanitizerService) {}

  /**
   * Validate request data for XSS patterns.
   * Blocks the request if any malicious patterns are detected.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip for GET, HEAD, OPTIONS (no body)
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Still check query parameters
      return this.checkQueryParams(request);
    }

    // Check request body
    const bodyAllowed = await this.checkRequestBody(request);
    if (!bodyAllowed) {
      return false;
    }

    // Check query parameters
    return this.checkQueryParams(request);
  }

  /**
   * Check request body for XSS patterns.
   */
  private async checkRequestBody(request: Request): Promise<boolean> {
    if (!request.body || typeof request.body !== 'object') {
      return true;
    }

    const xssResults = scanObjectForXss(request.body, this.xssSanitizer);

    if (xssResults.length > 0) {
      const criticalOrHigh = xssResults.filter(
        (r) => r.result.severity === XssSeverity.CRITICAL || r.result.severity === XssSeverity.HIGH,
      );

      if (criticalOrHigh.length > 0) {
        this.logger.warn(
          `XSS Guard blocked request: ${request.method} ${request.path} ` +
            `- Patterns: [${criticalOrHigh.map((r) => r.result.detectedPatterns.join(', ')).join('; ')}]`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Potentially malicious content detected in request body.',
            code: 'XSS_PAYLOAD_DETECTED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return true;
  }

  /**
   * Check query parameters for XSS patterns.
   */
  private checkQueryParams(request: Request): boolean {
    if (!request.query || typeof request.query !== 'object') {
      return true;
    }

    for (const [key, value] of Object.entries(request.query)) {
      const valuesToCheck = Array.isArray(value) ? value : [value];

      for (const val of valuesToCheck) {
        if (typeof val === 'string') {
          const result = this.xssSanitizer.detectXss(val);
          if (result.isMalicious && (result.severity === XssSeverity.CRITICAL || result.severity === XssSeverity.HIGH)) {
            this.logger.warn(
              `XSS Guard blocked query param: ${request.method} ${request.path} ` +
                `param=${key}, patterns=[${result.detectedPatterns.join(', ')}]`,
            );

            throw new HttpException(
              {
                statusCode: HttpStatus.BAD_REQUEST,
                error: 'Bad Request',
                message: `Potentially malicious content detected in query parameter: ${key}`,
                code: 'XSS_PAYLOAD_DETECTED',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }
    }

    return true;
  }
}
