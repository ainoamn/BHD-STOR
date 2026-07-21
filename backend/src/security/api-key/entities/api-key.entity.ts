/**
 * @fileoverview API Key Entity
 * @description TypeORM entity for storing API keys with secure hashing.
 * Only stores hashed keys - raw keys are shown once at creation time only.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** Available API key scopes/permissions */
export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  ORDERS_READ = 'orders:read',
  ORDERS_WRITE = 'orders:write',
  CUSTOMERS_READ = 'customers:read',
  CUSTOMERS_WRITE = 'customers:write',
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',
  ANALYTICS_READ = 'analytics:read',
  WEBHOOK_MANAGE = 'webhook:manage',
  PAYMENTS_READ = 'payments:read',
  PAYMENTS_PROCESS = 'payments:process',
  SHIPPING_READ = 'shipping:read',
  SHIPPING_MANAGE = 'shipping:manage',
  AI_GENERATE = 'ai:generate',
  FULL_ACCESS = 'full_access',
}

/** API Key entity for database storage */
@Entity('api_keys')
@Index(['keyHash'], { unique: true })
@Index(['isActive'])
@Index(['createdBy'])
@Index(['expiresAt'])
export class ApiKey {
  /** Unique identifier */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable name for the API key */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Hashed API key value.
   * The raw key is only shown once at creation time.
   * Uses SHA-256 hash with server-side pepper.
   */
  @Column({ type: 'varchar', length: 128, unique: true })
  keyHash: string;

  /**
   * Last 4 characters of the raw key for identification purposes.
   * Example: "...a3f9"
   */
  @Column({ type: 'varchar', length: 8 })
  keyMask: string;

  /** Granted permission scopes */
  @Column({
    type: 'simple-array',
    default: ApiKeyScope.READ,
  })
  scopes: ApiKeyScope[];

  /** Whether the key is active */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** Whether the key has been revoked */
  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  /** Revocation reason */
  @Column({ type: 'varchar', length: 500, nullable: true })
  revokeReason?: string;

  /** Timestamp of last use */
  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  /** Expiration timestamp */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /** ID of the user who created this key */
  @Column({ type: 'uuid' })
  createdBy: string;

  /** Request IP at creation time */
  @Column({ type: 'varchar', length: 45, nullable: true })
  createdFromIp?: string;

  /** User agent at creation time */
  @Column({ type: 'text', nullable: true })
  createdFromUserAgent?: string;

  /** Number of times this key has been used */
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  /** Rate limit: requests per minute */
  @Column({ type: 'int', default: 100 })
  rateLimitPerMinute: number;

  /** Rate limit: requests per day */
  @Column({ type: 'int', default: 10000 })
  rateLimitPerDay: number;

  /** Creation timestamp */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** Last update timestamp */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
