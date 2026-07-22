import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  path?: string;
  method?: string;
  executionTime?: number;
}

export interface TransformedResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/**
 * Transform Interceptor
 * Wraps all responses in a standardized { data, meta } format.
 * Adds timestamp and request ID to every response.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const executionTime = Date.now() - startTime;
        const requestId =
          (request.headers['x-request-id'] as string) ||
          `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Handle already-wrapped responses
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return data;
        }

        // Handle null/undefined
        if (data === null || data === undefined) {
          return {
            data: null,
            meta: this.buildMeta(request, requestId, executionTime),
          };
        }

        // Handle pagination responses (has data and meta properties)
        if (data && typeof data === 'object' && ('items' in data || 'results' in data)) {
          return {
            data,
            meta: this.buildMeta(request, requestId, executionTime),
          };
        }

        // Standard response wrapping
        return {
          data,
          meta: this.buildMeta(request, requestId, executionTime),
        };
      }),
    );
  }

  /**
   * Build response metadata
   */
  private buildMeta(
    request: Request,
    requestId: string,
    executionTime: number,
  ): ResponseMeta {
    return {
      timestamp: new Date().toISOString(),
      requestId,
      path: request.url,
      method: request.method,
      executionTime,
    };
  }
}
