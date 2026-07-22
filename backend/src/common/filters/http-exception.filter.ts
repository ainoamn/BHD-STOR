import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  code?: string;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: Record<string, any>;
}

/**
 * Global HTTP Exception Filter
 * Catches and formats all HTTP exceptions and database errors.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly loggerService?: any) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.headers['x-request-id'] as string || this.generateRequestId();

    let status: number;
    let message: string | string[];
    let error: string;
    let code: string | undefined;
    let details: Record<string, any> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || exception.message;
      error = exceptionResponse.error || exception.name;
      code = exceptionResponse.code;
      details = exceptionResponse.details;
    } else if (exception instanceof QueryFailedError) {
      // Handle PostgreSQL errors
      const pgError = this.handlePostgresError(exception);
      status = pgError.status;
      message = pgError.message;
      error = pgError.error;
      code = pgError.code;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
      code = 'INTERNAL_ERROR';
    }

    // Log error
    this.logError(exception, request, status, requestId);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Handle PostgreSQL specific errors
   */
  private handlePostgresError(error: QueryFailedError): {
    status: number;
    message: string;
    error: string;
    code?: string;
  } {
    const pgError = error as any;

    // Unique constraint violation
    if (pgError.code === '23505') {
      const match = pgError.detail?.match(/\((.*?)\)/);
      const field = match ? match[1] : 'field';
      return {
        status: HttpStatus.CONFLICT,
        message: `A record with this ${field} already exists`,
        error: 'Conflict',
        code: 'DUPLICATE_ENTRY',
      };
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Referenced record does not exist',
        error: 'Bad Request',
        code: 'FOREIGN_KEY_VIOLATION',
      };
    }

    // Not null violation
    if (pgError.code === '23502') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `Required field is missing: ${pgError.column}`,
        error: 'Bad Request',
        code: 'NOT_NULL_VIOLATION',
      };
    }

    // Check constraint violation
    if (pgError.code === '23514') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Data validation failed',
        error: 'Bad Request',
        code: 'CHECK_CONSTRAINT_VIOLATION',
      };
    }

    // Default
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      error: 'Internal Server Error',
      code: `PG_${pgError.code || 'UNKNOWN'}`,
    };
  }

  /**
   * Log error with appropriate level
   */
  private logError(
    exception: any,
    request: Request,
    status: number,
    requestId: string,
  ): void {
    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      status,
      timestamp: new Date().toISOString(),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      error: exception.message,
      stack: exception.stack,
    };

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} - ${status}: ${exception.message}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} - ${status}: ${exception.message}`,
        'HttpExceptionFilter',
      );
    }

    // Also log to Winston if available
    if (this.loggerService) {
      this.loggerService.error('HTTP Exception', logData);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
