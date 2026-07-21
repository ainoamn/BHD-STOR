/**
 * @fileoverview XSS Interceptor
 * @description NestJS interceptor that sanitizes request bodies, query parameters,
 * and response data to prevent XSS attacks at the middleware layer.
 *
 * OWASP: Defense in depth - sanitize both input and output.
 * A03:2021 – Injection prevention for Cross-Site Scripting.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { XssSanitizerService } from './xss-sanitizer.service';

/** Configuration for the XSS interceptor */
export interface XssInterceptorConfig {
  /** Sanitize request body */
  sanitizeBody?: boolean;
  /** Sanitize query parameters */
  sanitizeQuery?: boolean;
  /** Sanitize response data */
  sanitizeResponse?: boolean;
  /** Fields to exclude from sanitization */
  excludeFields?: string[];
  /** Maximum allowed depth for nested objects */
  maxDepth?: number;
}

@Injectable()
export class XssInterceptor implements NestInterceptor {
  private readonly logger = new Logger(XssInterceptor.name);

  /** Default configuration */
  private readonly defaultConfig: XssInterceptorConfig = {
    sanitizeBody: true,
    sanitizeQuery: true,
    sanitizeResponse: true,
    excludeFields: ['password', 'token', 'apiKey', 'secret', 'authorization'],
    maxDepth: 10,
  };

  constructor(
    private readonly xssSanitizer: XssSanitizerService,
    private readonly config?: XssInterceptorConfig,
  ) {}

  /**
   * Intercept and sanitize both request and response data.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const mergedConfig = { ...this.defaultConfig, ...this.config };
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.path;

    // Sanitize request body for state-changing methods
    if (mergedConfig.sanitizeBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      this.sanitizeRequestBody(request, mergedConfig);
    }

    // Sanitize query parameters for all methods
    if (mergedConfig.sanitizeQuery) {
      this.sanitizeQueryParams(request, mergedConfig);
    }

    // Sanitize response data
    if (mergedConfig.sanitizeResponse) {
      return next.handle().pipe(
        map((data) => this.sanitizeResponseData(data, mergedConfig)),
      );
    }

    return next.handle();
  }

  /**
   * Sanitize the request body by recursively processing all string values.
   */
  private sanitizeRequestBody(
    request: Request,
    config: XssInterceptorConfig,
  ): void {
    if (!request.body || typeof request.body !== 'object') {
      return;
    }

    try {
      request.body = this.sanitizeObject(
        request.body,
        config.excludeFields || [],
        0,
        config.maxDepth || 10,
      );
    } catch (error) {
      this.logger.error(`Request body sanitization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sanitize query parameters to prevent XSS in search and filter operations.
   */
  private sanitizeQueryParams(
    request: Request,
    _config: XssInterceptorConfig,
  ): void {
    if (!request.query || typeof request.query !== 'object') {
      return;
    }

    try {
      const sanitizedQuery: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string') {
          // Use search query sanitization for 'q', 'query', 'search' parameters
          if (['q', 'query', 'search', 'keyword', 'term'].includes(key)) {
            sanitizedQuery[key] = this.xssSanitizer.sanitizeSearchQuery(value);
          } else {
            sanitizedQuery[key] = this.xssSanitizer.sanitize(value);
          }
        } else if (Array.isArray(value)) {
          sanitizedQuery[key] = value.map((v) =>
            typeof v === 'string' ? this.xssSanitizer.sanitize(v) : v,
          );
        } else {
          sanitizedQuery[key] = value;
        }
      }
      request.query = sanitizedQuery as Record<string, string | string[]>;
    } catch (error) {
      this.logger.error(`Query sanitization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sanitize response data before sending to the client.
   * This prevents stored XSS from compromised database entries.
   */
  private sanitizeResponseData(
    data: unknown,
    config: XssInterceptorConfig,
  ): unknown {
    if (!data) {
      return data;
    }

    try {
      return this.sanitizeObject(
        data,
        config.excludeFields || [],
        0,
        config.maxDepth || 10,
      );
    } catch (error) {
      this.logger.error(`Response sanitization failed: ${(error as Error).message}`);
      return data;
    }
  }

  /**
   * Recursively sanitize an object, respecting exclude fields and depth limits.
   */
  private sanitizeObject(
    obj: unknown,
    excludeFields: string[],
    depth: number,
    maxDepth: number,
  ): unknown {
    // Prevent excessive recursion
    if (depth > maxDepth) {
      this.logger.warn(`Max sanitization depth (${maxDepth}) exceeded`);
      return obj;
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    // Sanitize strings
    if (typeof obj === 'string') {
      return this.xssSanitizer.sanitize(obj);
    }

    // Pass through primitives
    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.sanitizeObject(item, excludeFields, depth + 1, maxDepth),
      );
    }

    // Handle objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip excluded fields (passwords, tokens, etc.)
      if (excludeFields.includes(key)) {
        sanitized[key] = value;
        continue;
      }

      sanitized[key] = this.sanitizeObject(value, excludeFields, depth + 1, maxDepth);
    }

    return sanitized;
  }
}
