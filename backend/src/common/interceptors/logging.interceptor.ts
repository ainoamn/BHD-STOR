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
import { redactSensitive } from '../utils/redact.util';

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
    const requestId = (headers['x-request-id'] as string) || 'no-id';

    // Log request (excluding sensitive data)
    const sanitizedBody = redactSensitive(request.body);
    const sanitizedQuery = redactSensitive(request.query);
    const sanitizedParams = redactSensitive(request.params);
    const sanitizedUrl = redactSensitive(url) as string;

    const logMessage = `[${requestId}] ${method} ${sanitizedUrl} - Request`;
    const logData = {
      requestId,
      method,
      url: sanitizedUrl,
      ip,
      userAgent,
      body: sanitizedBody,
      query: sanitizedQuery,
      params: sanitizedParams,
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

          const responseLog = `[${requestId}] ${method} ${sanitizedUrl} - ${statusCode} - ${duration}ms`;

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
            `[${requestId}] ${method} ${sanitizedUrl} - ${statusCode} - ${duration}ms - Error: ${error.message}`,
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
