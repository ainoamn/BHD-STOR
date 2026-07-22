import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * Logs all incoming requests and their responses.
 * Excludes sensitive data from logs (passwords, tokens, etc.).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly loggerService?: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const requestId = headers['x-request-id'] as string || 'no-id';

    // Log request (excluding sensitive data)
    const sanitizedBody = this.sanitizeBody(request.body);

    const logMessage = `[${requestId}] ${method} ${url} - Request`;
    const logData = {
      requestId,
      method,
      url,
      ip,
      userAgent,
      body: sanitizedBody,
      query: request.query,
      params: request.params,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(logMessage, 'LoggingInterceptor');

    if (this.loggerService) {
      this.loggerService.debug(logMessage, logData);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const responseLog = `[${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms`;

          if (statusCode >= 500) {
            this.logger.error(responseLog, 'LoggingInterceptor');
          } else if (statusCode >= 400) {
            this.logger.warn(responseLog, 'LoggingInterceptor');
          } else {
            this.logger.log(responseLog, 'LoggingInterceptor');
          }

          if (this.loggerService) {
            this.loggerService.log('Response', {
              ...logData,
              statusCode,
              duration,
              responseSize: this.getResponseSize(data),
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `[${requestId}] ${method} ${url} - ${statusCode} - ${duration}ms - Error: ${error.message}`,
            error.stack,
            'LoggingInterceptor',
          );

          if (this.loggerService) {
            this.loggerService.error('Response Error', {
              ...logData,
              statusCode,
              duration,
              error: error.message,
              stack: error.stack,
            });
          }
        },
      }),
    );
  }

  /**
   * Sanitize request body by removing sensitive fields
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'newPassword',
      'currentPassword',
      'confirmPassword',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'apiKey',
      'creditCard',
      'cvv',
      'cardNumber',
    ];

    const sanitized = { ...body };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Get approximate response size
   */
  private getResponseSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
