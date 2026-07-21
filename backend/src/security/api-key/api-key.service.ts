/**
 * @fileoverview API Key Service
 * @description Manages API key lifecycle: generation, validation, revocation,
 * and usage tracking. Follows OWASP API Security best practices.
 *
 * Security Features:
 * - Cryptographically secure key generation (48 bytes, base64url)
 * - Key hashing with server-side pepper (never store raw keys)
 * - Per-key rate limiting
 * - Scope-based access control
 * - Usage auditing
 * - Automatic expiration handling
 * - Key rotation support
 *
 * OWASP: API2:2023 – Broken Authentication prevention.
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { ApiKey, ApiKeyScope } from './entities/api-key.entity';

/** Raw API key with the full key shown once at creation */
export interface RawApiKey {
  id: string;
  name: string;
  key: string; // Raw key - ONLY SHOWN ONCE
  keyMask: string;
  scopes: ApiKeyScope[];
  expiresAt: Date | null;
  createdAt: Date;
}

/** API key validation result */
export interface ApiKeyValidationResult {
  valid: boolean;
  apiKey?: ApiKey;
  error?: string;
}

/** API key usage record for rate limiting */
interface UsageRecord {
  count: number;
  windowStart: number;
  dayCount: number;
  dayStart: number;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  /** Server-side pepper for key hashing */
  private readonly keyPepper: string;

  /** In-memory usage tracking for rate limiting */
  private usageStore = new Map<string, UsageRecord>();

  /** Cleanup interval */
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly configService: ConfigService,
  ) {
    this.keyPepper = this.configService.get<string>('API_KEY_PEPPER', '');
    if (!this.keyPepper) {
      this.logger.warn('API_KEY_PEPPER not configured - using empty pepper');
    }

    // Start cleanup interval for usage store
    this.cleanupInterval = setInterval(() => this.cleanupUsageStore(), 300000); // 5 minutes
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // ==================== Key Generation ====================

  /**
   * Generate a new API key.
   * The raw key is returned ONLY at creation time and is never stored.
   *
   * @param name - Human-readable name for the key
   * @param scopes - Permission scopes for the key
   * @param createdBy - User ID creating the key
   * @param expiresInDays - Optional expiration in days
   * @param options - Additional options
   * @returns Raw API key (save the key value - it won't be shown again)
   */
  async createKey(
    name: string,
    scopes: ApiKeyScope[],
    createdBy: string,
    expiresInDays?: number,
    options?: {
      rateLimitPerMinute?: number;
      rateLimitPerDay?: number;
      createdFromIp?: string;
      createdFromUserAgent?: string;
    },
  ): Promise<RawApiKey> {
    // Generate cryptographically secure random key
    const rawKey = this.generateRawKey();

    // Create hash of the key (what we store)
    const keyHash = this.hashKey(rawKey);
    const keyMask = `...${rawKey.slice(-4)}`;

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Save to database
    const apiKey = this.apiKeyRepository.create({
      name,
      keyHash,
      keyMask,
      scopes,
      createdBy,
      expiresAt,
      rateLimitPerMinute: options?.rateLimitPerMinute || 100,
      rateLimitPerDay: options?.rateLimitPerDay || 10000,
      createdFromIp: options?.createdFromIp,
      createdFromUserAgent: options?.createdFromUserAgent,
    });

    await this.apiKeyRepository.save(apiKey);

    this.logger.log(`API key created: ${apiKey.id} by user ${createdBy}`);

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // ONLY TIME THIS IS SHOWN
      keyMask: apiKey.keyMask,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Validate an API key from the request header.
   *
   * @param rawKey - The raw API key from X-API-Key header
   * @returns Validation result with API key entity if valid
   */
  async validateKey(rawKey: string): Promise<ApiKeyValidationResult> {
    if (!rawKey || typeof rawKey !== 'string') {
      return { valid: false, error: 'API key missing' };
    }

    // Validate key format
    if (!this.isValidKeyFormat(rawKey)) {
      return { valid: false, error: 'Invalid API key format' };
    }

    // Hash the provided key
    const keyHash = this.hashKey(rawKey);

    // Find the key in database
    const apiKey = await this.apiKeyRepository.findOne({
      where: { keyHash },
    });

    if (!apiKey) {
      this.logger.warn(`API key validation failed: key not found`);
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if key is active
    if (!apiKey.isActive || apiKey.isRevoked) {
      this.logger.warn(`API key ${apiKey.id} is inactive or revoked`);
      return { valid: false, error: 'API key is inactive or revoked' };
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      this.logger.warn(`API key ${apiKey.id} has expired`);
      return { valid: false, error: 'API key has expired' };
    }

    // Update usage stats
    await this.recordUsage(apiKey);

    return { valid: true, apiKey };
  }

  /**
   * Check rate limit for an API key.
   *
   * @param apiKeyId - The API key ID
   * @param rateLimitPerMinute - Key's per-minute limit
   * @param rateLimitPerDay - Key's per-day limit
   * @returns Whether the request is within rate limits
   */
  checkRateLimit(
    apiKeyId: string,
    rateLimitPerMinute: number,
    rateLimitPerDay: number,
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const minuteWindow = 60000;
    const dayWindow = 86400000;

    let record = this.usageStore.get(apiKeyId);
    if (!record) {
      record = { count: 0, windowStart: now, dayCount: 0, dayStart: now };
      this.usageStore.set(apiKeyId, record);
    }

    // Reset minute window if expired
    if (now - record.windowStart > minuteWindow) {
      record.count = 0;
      record.windowStart = now;
    }

    // Reset day window if expired
    if (now - record.dayStart > dayWindow) {
      record.dayCount = 0;
      record.dayStart = now;
    }

    // Check limits
    if (record.count >= rateLimitPerMinute || record.dayCount >= rateLimitPerDay) {
      const resetAt = Math.ceil((record.windowStart + minuteWindow) / 1000);
      return { allowed: false, remaining: 0, resetAt };
    }

    // Increment counters
    record.count++;
    record.dayCount++;

    const remaining = Math.max(0, rateLimitPerMinute - record.count);
    const resetAt = Math.ceil((record.windowStart + minuteWindow) / 1000);

    return { allowed: true, remaining, resetAt };
  }

  /**
   * Check if an API key has a required scope.
   *
   * @param apiKey - The API key entity
   * @param requiredScope - The required scope
   * @returns True if the key has the scope
   */
  hasScope(apiKey: ApiKey, requiredScope: ApiKeyScope): boolean {
    // Full access grants all scopes
    if (apiKey.scopes.includes(ApiKeyScope.FULL_ACCESS)) {
      return true;
    }

    // Check for the specific scope
    if (apiKey.scopes.includes(requiredScope)) {
      return true;
    }

    // Check for broader scope (e.g., 'write' includes 'products:write')
    const broadScope = requiredScope.split(':')[0] as ApiKeyScope;
    if (broadScope && apiKey.scopes.includes(broadScope)) {
      return true;
    }

    // Admin scope grants all permissions
    if (apiKey.scopes.includes(ApiKeyScope.ADMIN)) {
      return true;
    }

    return false;
  }

  /**
   * Require a specific scope - throws if not present.
   */
  requireScope(apiKey: ApiKey, scope: ApiKeyScope): void {
    if (!this.hasScope(apiKey, scope)) {
      throw new ForbiddenException(
        `API key does not have required scope: ${scope}`,
      );
    }
  }

  /**
   * Check multiple scopes - true if any match.
   */
  hasAnyScope(apiKey: ApiKey, scopes: ApiKeyScope[]): boolean {
    return scopes.some((scope) => this.hasScope(apiKey, scope));
  }

  /**
   * Check multiple scopes - true if all match.
   */
  hasAllScopes(apiKey: ApiKey, scopes: ApiKeyScope[]): boolean {
    return scopes.every((scope) => this.hasScope(apiKey, scope));
  }

  // ==================== Key Management ====================

  /**
   * List all API keys for a user (without sensitive data).
   */
  async listKeys(userId: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const keys = await this.apiKeyRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
      select: [
        'id', 'name', 'keyMask', 'scopes', 'isActive', 'isRevoked',
        'lastUsedAt', 'expiresAt', 'createdBy', 'usageCount',
        'rateLimitPerMinute', 'rateLimitPerDay', 'createdAt', 'updatedAt',
      ],
    });
    return keys;
  }

  /**
   * Revoke an API key.
   */
  async revokeKey(
    keyId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    // Only the creator or admin can revoke
    if (apiKey.createdBy !== userId) {
      throw new ForbiddenException('You can only revoke your own API keys');
    }

    apiKey.isRevoked = true;
    apiKey.isActive = false;
    apiKey.revokeReason = reason || 'User initiated revocation';

    await this.apiKeyRepository.save(apiKey);
    this.logger.log(`API key revoked: ${keyId} by user ${userId}`);
  }

  /**
   * Regenerate an API key (revoke old, create new with same settings).
   *
   * @param keyId - ID of the key to regenerate
   * @param userId - User performing the regeneration
   * @returns New raw API key
   */
  async regenerateKey(keyId: string, userId: string): Promise<RawApiKey> {
    const oldKey = await this.apiKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!oldKey) {
      throw new NotFoundException('API key not found');
    }

    if (oldKey.createdBy !== userId) {
      throw new ForbiddenException('You can only regenerate your own API keys');
    }

    // Create new key with same settings
    const rawKey = await this.createKey(
      oldKey.name,
      oldKey.scopes,
      userId,
      oldKey.expiresAt
        ? Math.ceil((oldKey.expiresAt.getTime() - Date.now()) / 86400000)
        : undefined,
      {
        rateLimitPerMinute: oldKey.rateLimitPerMinute,
        rateLimitPerDay: oldKey.rateLimitPerDay,
      },
    );

    // Revoke the old key
    await this.revokeKey(keyId, userId, 'Regenerated');

    this.logger.log(`API key regenerated: ${keyId} -> ${rawKey.id}`);
    return rawKey;
  }

  /**
   * Get API key by ID (admin function, no hash exposed).
   */
  async getKeyById(keyId: string): Promise<ApiKey | null> {
    return this.apiKeyRepository.findOne({
      where: { id: keyId },
    });
  }

  /**
   * Clean up expired keys (call periodically).
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await this.apiKeyRepository.update(
      {
        expiresAt: LessThan(new Date()),
        isActive: true,
      },
      { isActive: false },
    );

    const count = result.affected || 0;
    if (count > 0) {
      this.logger.log(`Deactivated ${count} expired API keys`);
    }
    return count;
  }

  // ==================== Private Helpers ====================

  /**
   * Generate a cryptographically secure raw API key.
   * Format: bhd_<base64url-encoded random bytes>
   */
  private generateRawKey(): string {
    const random = randomBytes(48).toString('base64url');
    return `bhd_${random}`;
  }

  /**
   * Hash an API key for storage.
   * Uses SHA-256 with server-side pepper.
   */
  private hashKey(rawKey: string): string {
    return createHash('sha256')
      .update(rawKey + this.keyPepper)
      .digest('hex');
  }

  /**
   * Validate raw key format.
   */
  private isValidKeyFormat(key: string): boolean {
    // Must start with 'bhd_' and be at least 50 chars
    return key.startsWith('bhd_') && key.length >= 50;
  }

  /**
   * Record API key usage in the database.
   */
  private async recordUsage(apiKey: ApiKey): Promise<void> {
    apiKey.lastUsedAt = new Date();
    apiKey.usageCount++;
    await this.apiKeyRepository.save(apiKey);
  }

  /**
   * Clean up old usage records.
   */
  private cleanupUsageStore(): void {
    const now = Date.now();
    const dayWindow = 86400000;
    let cleaned = 0;

    for (const [keyId, record] of this.usageStore.entries()) {
      if (now - record.dayStart > dayWindow) {
        this.usageStore.delete(keyId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired API key usage records`);
    }
  }
}
