import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { B2bShipmentService } from '../services/b2b-shipment.service';

interface B2bCustomerInfo {
  id: number;
  companyName: string;
  apiKey: string;
  creditLimit: number;
  creditUsed: number;
  webhookUrl: string | null;
  isActive: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  createdAt: Date;
  apiCallCount: number;
  apiCallLimit: number;
}

interface RequestWithCustomer extends Request {
  customer: B2bCustomerInfo;
}

/**
 * B2B API Key Guard
 *
 * Protects B2B endpoints by validating the X-API-Key header.
 * - Extracts API key from X-API-Key header
 * - Validates key against b2b_customers table
 * - Attaches customer info to request object
 * - Tracks API usage (increments call count)
 * - Returns 401 for missing/invalid keys
 * - Returns 403 for inactive accounts or exceeded limits
 */
@Injectable()
export class B2bApiKeyGuard implements CanActivate {
  constructor(private readonly b2bShipmentService: B2bShipmentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomer>();

    // 1. Extract API key from header
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException(
        'Missing API key. Please provide a valid X-API-Key header.',
      );
    }

    // 2. Validate API key and get customer
    const customer = await this.b2bShipmentService.validateApiKey(apiKey);

    if (!customer) {
      throw new UnauthorizedException(
        'Invalid API key. Please check your API key or contact support.',
      );
    }

    // 3. Check if account is active
    if (!customer.isActive) {
      throw new ForbiddenException(
        'Your account is inactive. Please contact your account manager.',
      );
    }

    // 4. Check API call limit
    if (customer.apiCallCount >= customer.apiCallLimit) {
      throw new ForbiddenException(
        `API call limit exceeded. Limit: ${customer.apiCallLimit}. Please upgrade your plan.`,
      );
    }

    // 5. Attach customer info to request for use in controllers
    request.customer = {
      id: customer.id,
      companyName: customer.companyName,
      apiKey: customer.apiKey,
      creditLimit: customer.creditLimit,
      creditUsed: customer.creditUsed,
      webhookUrl: customer.webhookUrl,
      isActive: customer.isActive,
      contactEmail: customer.contactEmail,
      contactPhone: customer.contactPhone,
      address: customer.address,
      createdAt: customer.createdAt,
      apiCallCount: customer.apiCallCount,
      apiCallLimit: customer.apiCallLimit,
    };

    // 6. Log API access for monitoring
    this.logApiAccess(request, customer.id);

    return true;
  }

  /**
   * Extract API key from request headers
   * Supports X-API-Key and Authorization: Bearer <key> formats
   */
  private extractApiKey(request: Request): string | null {
    // Primary: X-API-Key header
    const apiKey = request.headers['x-api-key'];
    if (apiKey && typeof apiKey === 'string') {
      return apiKey.trim();
    }

    // Fallback: Authorization: Bearer <key>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // Fallback: query parameter (for webhook testing)
    const apiKeyQuery = request.query.api_key;
    if (apiKeyQuery && typeof apiKeyQuery === 'string') {
      return apiKeyQuery.trim();
    }

    return null;
  }

  /**
   * Log API access for monitoring and rate limiting
   */
  private logApiAccess(request: Request, customerId: number): void {
    const method = request.method;
    const path = request.path;
    const timestamp = new Date().toISOString();
    const ip =
      (request.headers['x-forwarded-for'] as string) || request.ip || 'unknown';

    // In production, send to monitoring service (e.g., Datadog, CloudWatch)
    // For now, log to console with structured format
    console.log(
      JSON.stringify({
        event: 'b2b_api_access',
        customerId,
        method,
        path,
        timestamp,
        ip,
      }),
    );
  }
}
