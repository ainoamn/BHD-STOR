/**
 * @fileoverview API Key Controller
 * @description REST endpoints for API key management.
 * Authenticated users can create, list, revoke, and regenerate their API keys.
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService, RawApiKey } from './api-key.service';
import { ApiKey, ApiKeyScope } from './entities/api-key.entity';
import { requireRequestUserId } from '../../auth/utils/request-user';

/** DTO for creating an API key */
class CreateApiKeyDto {
  name: string;
  scopes: ApiKeyScope[];
  expiresInDays?: number;
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}

/** Response without sensitive fields */
type ApiKeyResponse = Omit<ApiKey, 'keyHash'>;

@Controller('api-keys')
export class ApiKeyController {
  private readonly logger = new Logger(ApiKeyController.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  /**
   * POST /api-keys
   * Create a new API key.
   *
   * @param dto - Key creation parameters
   * @param req - Request with authenticated user
   * @returns New API key (raw key shown only once)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createKey(
    @Body() dto: CreateApiKeyDto,
    @Req() req: Request,
  ): Promise<RawApiKey> {
    // @ts-expect-error user from auth
    const userId = requireRequestUserId(req.user);

    const clientIp = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    this.logger.log(`API key creation requested by user ${userId}`);

    return this.apiKeyService.createKey(
      dto.name,
      dto.scopes,
      userId,
      dto.expiresInDays,
      {
        rateLimitPerMinute: dto.rateLimitPerMinute,
        rateLimitPerDay: dto.rateLimitPerDay,
        createdFromIp: clientIp,
        createdFromUserAgent: userAgent,
      },
    );
  }

  /**
   * GET /api-keys
   * List all API keys for the authenticated user.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listKeys(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<{
    data: ApiKeyResponse[];
    meta: { total: number; page: number; limit: number };
  }> {
    // @ts-expect-error user from auth
    const userId = requireRequestUserId(req.user);

    const keys = await this.apiKeyService.listKeys(userId);

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedKeys = keys.slice(start, start + limit);

    return {
      data: paginatedKeys,
      meta: {
        total: keys.length,
        page,
        limit,
      },
    };
  }

  /**
   * DELETE /api-keys/:id
   * Revoke an API key.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeKey(
    @Param('id') keyId: string,
    @Req() req: Request,
    @Body() body?: { reason?: string },
  ): Promise<void> {
    // @ts-expect-error user from auth
    const userId = requireRequestUserId(req.user);

    await this.apiKeyService.revokeKey(keyId, userId, body?.reason);
  }

  /**
   * POST /api-keys/:id/regenerate
   * Regenerate an API key (creates new, revokes old).
   */
  @Post(':id/regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerateKey(
    @Param('id') keyId: string,
    @Req() req: Request,
  ): Promise<RawApiKey> {
    // @ts-expect-error user from auth
    const userId = requireRequestUserId(req.user);

    this.logger.log(`API key regeneration requested for ${keyId} by user ${userId}`);

    return this.apiKeyService.regenerateKey(keyId, userId);
  }

  /**
   * GET /api-keys/scopes
   * List all available API key scopes.
   */
  @Get('scopes')
  @HttpCode(HttpStatus.OK)
  getAvailableScopes(): { scope: ApiKeyScope; description: string }[] {
    return Object.values(ApiKeyScope).map((scope) => ({
      scope,
      description: this.getScopeDescription(scope),
    }));
  }

  private getScopeDescription(scope: ApiKeyScope): string {
    const descriptions: Record<ApiKeyScope, string> = {
      [ApiKeyScope.READ]: 'Read access to all resources',
      [ApiKeyScope.WRITE]: 'Write access to all resources',
      [ApiKeyScope.DELETE]: 'Delete access to all resources',
      [ApiKeyScope.ADMIN]: 'Administrative access',
      [ApiKeyScope.PRODUCTS_READ]: 'Read product catalog',
      [ApiKeyScope.PRODUCTS_WRITE]: 'Manage products',
      [ApiKeyScope.ORDERS_READ]: 'Read orders',
      [ApiKeyScope.ORDERS_WRITE]: 'Manage orders',
      [ApiKeyScope.CUSTOMERS_READ]: 'Read customer data',
      [ApiKeyScope.CUSTOMERS_WRITE]: 'Manage customers',
      [ApiKeyScope.INVENTORY_READ]: 'Read inventory',
      [ApiKeyScope.INVENTORY_WRITE]: 'Manage inventory',
      [ApiKeyScope.ANALYTICS_READ]: 'Read analytics data',
      [ApiKeyScope.WEBHOOK_MANAGE]: 'Manage webhooks',
      [ApiKeyScope.PAYMENTS_READ]: 'Read payment data',
      [ApiKeyScope.PAYMENTS_PROCESS]: 'Process payments',
      [ApiKeyScope.SHIPPING_READ]: 'Read shipping data',
      [ApiKeyScope.SHIPPING_MANAGE]: 'Manage shipping',
      [ApiKeyScope.AI_GENERATE]: 'Use AI generation features',
      [ApiKeyScope.FULL_ACCESS]: 'Full access to all resources',
    };
    return descriptions[scope] || scope;
  }
}
