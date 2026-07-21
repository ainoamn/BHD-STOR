/**
 * @fileoverview Audit Interceptor
 * @description NestJS interceptor that automatically logs all HTTP requests
 * with timing, status, and contextual information.
 *
 * Attaches audit context to requests and logs response details.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AuditAction, RiskLevel } from './entities/audit-log.entity';

/** Request with audit context */
export interface RequestWithAudit extends Request {
  auditContext?: {
    requestId: string;
    startTime: number;
    userId?: string;
  };
}

/** Paths to exclude from automatic audit logging */
const EXCLUDED_PATHS = [
  '/health',
  '/metrics',
  '/favicon.ico',
  '/robots.txt',
  '/csrf-token',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithAudit>();
    const path = request.path;

    // Skip excluded paths
    if (EXCLUDED_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    // Initialize audit context
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    // @ts-expect-error user from auth
    const userId = request.user?.id || request.user?.sub;

    request.auditContext = {
      requestId,
      startTime,
      userId,
    };

    // Determine action type
    const action = this.determineAction(request);

    return next.handle().pipe(
      tap({
        next: async () => {
          await this.logSuccess(request, action, startTime, requestId);
        },
        error: async (error) => {
          await this.logError(request, action, startTime, requestId, error);
        },
      }),
    );
  }

  private async logSuccess(
    request: RequestWithAudit,
    action: AuditAction,
    startTime: number,
    requestId: string,
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    const response = request.res;
    const statusCode = response?.statusCode || 200;

    // Skip logging for successful non-mutating requests (reduce noise)
    if (request.method === 'GET' && statusCode < 400) {
      return;
    }

    await this.auditService.log({
      action,
      userId: request.auditContext?.userId,
      method: request.method,
      path: request.path,
      statusCode,
      ip: request.ip || undefined,
      userAgent: request.headers['user-agent'] || undefined,
      responseTime,
      requestId,
      riskLevel: statusCode >= 400 ? RiskLevel.LOW : RiskLevel.INFO,
      details: {
        query: request.query,
        params: request.params,
      },
    });
  }

  private async logError(
    request: RequestWithAudit,
    action: AuditAction,
    startTime: number,
    requestId: string,
    error: { status?: number; message?: string },
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    const statusCode = error.status || 500;

    await this.auditService.log({
      action,
      userId: request.auditContext?.userId,
      method: request.method,
      path: request.path,
      statusCode,
      ip: request.ip || undefined,
      userAgent: request.headers['user-agent'] || undefined,
      responseTime,
      requestId,
      riskLevel: statusCode >= 500 ? RiskLevel.MEDIUM : RiskLevel.LOW,
      errorMessage: error.message,
      details: {
        query: request.query,
        params: request.params,
      },
    });
  }

  /**
   * Determine the audit action based on request characteristics.
   */
  private determineAction(request: RequestWithAudit): AuditAction {
    const path = request.path;

    // Auth-related paths
    if (path.includes('/auth/login') || path.includes('/auth/signin')) {
      return AuditAction.LOGIN_SUCCESS;
    }
    if (path.includes('/auth/logout') || path.includes('/auth/signout')) {
      return AuditAction.LOGOUT;
    }
    if (path.includes('/auth/password')) {
      return AuditAction.PASSWORD_CHANGE;
    }

    // Payment paths
    if (path.includes('/payment') || path.includes('/checkout')) {
      return AuditAction.PAYMENT_INITIATED;
    }

    // Admin paths
    if (path.includes('/admin')) {
      return AuditAction.ADMIN_ACTION;
    }

    // User management
    if (path.includes('/users')) {
      return AuditAction.USER_UPDATED;
    }

    // Data access
    return AuditAction.DATA_ACCESSED;
  }

  /**
   * Generate a unique request ID.
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
