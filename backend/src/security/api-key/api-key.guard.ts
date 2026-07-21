/**
 * @fileoverview API Key Guard
 * @description NestJS guard that validates API keys from X-API-Key header.
 * Enforces scope-based access control and per-key rate limiting.
 *
 * OWASP: API2:2023 – Broken Authentication prevention.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKeyService } from './api-key.service';
import { ApiKey, ApiKeyScope } from './entities/api-key.entity';

export const API_KEY_REQUIRED = 'api_key_required';
export const API_KEY_SCOPES = 'api_key_scopes';

/**
 * Require API key authentication for an endpoint.
 */
export const RequireApiKey = (scopes?: ApiKeyScope[]) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ) => {
    SetMetadata(API_KEY_REQUIRED, true)(target, propertyKey as string, descriptor);
    if (scopes) {
      SetMetadata(API_KEY_SCOPES, scopes)(target, propertyKey as string, descriptor);
    }
  };
};

/** Request with API key attached */
export interface RequestWithApiKey extends Request {
  apiKey?: ApiKey;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();

    // Check if API key auth is required for this route
    const apiKeyRequired = this.reflector.getAllAndOverride<boolean>(
      API_KEY_REQUIRED,
      [context.getHandler(), context.getClass()],
    );

    // Get required scopes
    const requiredScopes = this.reflector.getAllAndOverride<ApiKeyScope[]>(
      API_KEY_SCOPES,
      [context.getHandler(), context.getClass()],
    );

    // Extract API key from header
    const rawKey = this.extractApiKey(request);

    if (!rawKey) {
      if (apiKeyRequired) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            error: 'Unauthorized',
            message: 'API key is required. Include X-API-Key header.',
            code: 'API_KEY_MISSING',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      // API key optional - allow through
      return true;
    }

    // Validate the API key
    const validation = await this.apiKeyService.validateKey(rawKey);

    if (!validation.valid) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: validation.error || 'Invalid API key',
          code: 'API_KEY_INVALID',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const apiKey = validation.apiKey!;

    // Check rate limit
    const rateLimit = this.apiKeyService.checkRateLimit(
      apiKey.id,
      apiKey.rateLimitPerMinute,
      apiKey.rateLimitPerDay,
    );

    if (!rateLimit.allowed) {
      this.logger.warn(`API key rate limit exceeded: ${apiKey.id}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'API key rate limit exceeded.',
          code: 'API_KEY_RATE_LIMITED',
          retryAfter: rateLimit.resetAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check required scopes
    if (requiredScopes && requiredScopes.length > 0) {
      const hasScope = requiredScopes.some((scope) =>
        this.apiKeyService.hasScope(apiKey, scope),
      );

      if (!hasScope) {
        this.logger.warn(
          `API key ${apiKey.id} missing required scopes: ${requiredScopes.join(', ')}`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message: `API key does not have required scope(s): ${requiredScopes.join(', ')}`,
            code: 'API_KEY_INSUFFICIENT_SCOPE',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // Attach API key info to request
    request.apiKey = apiKey;

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', String(apiKey.rateLimitPerMinute));
    response.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));

    return true;
  }

  /**
   * Extract API key from request headers.
   * Supports X-API-Key header.
   */
  private extractApiKey(request: RequestWithApiKey): string | undefined {
    // Primary header
    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      return Array.isArray(apiKey) ? apiKey[0] : apiKey;
    }

    // Alternative header names
    const altHeaders = ['x-apikey', 'api-key', 'apikey'];
    for (const header of altHeaders) {
      const value = request.headers[header];
      if (value) {
        return Array.isArray(value) ? value[0] : value;
      }
    }

    // Check query parameter (less secure, but supported for some use cases)
    const queryKey = request.query['api_key'];
    if (typeof queryKey === 'string') {
      return queryKey;
    }

    return undefined;
  }
}
