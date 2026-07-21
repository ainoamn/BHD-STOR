/**
 * @fileoverview Audit Log Entity
 * @description TypeORM entity for storing comprehensive security audit logs.
 * Captures all security-relevant events for compliance and forensics.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** Categories of audit events */
export enum AuditAction {
  // Authentication events
  LOGIN_SUCCESS = 'login:success',
  LOGIN_FAILURE = 'login:failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password:change',
  PASSWORD_RESET_REQUEST = 'password:reset_request',
  PASSWORD_RESET_COMPLETE = 'password:reset_complete',
  MFA_ENABLED = 'mfa:enabled',
  MFA_DISABLED = 'mfa:disabled',
  MFA_CHALLENGE = 'mfa:challenge',
  SESSION_CREATED = 'session:created',
  SESSION_EXPIRED = 'session:expired',
  SESSION_REVOKED = 'session:revoked',
  TOKEN_REFRESH = 'token:refresh',
  TOKEN_INVALID = 'token:invalid',

  // Authorization events
  ROLE_ASSIGNED = 'role:assigned',
  ROLE_REMOVED = 'role:removed',
  PERMISSION_DENIED = 'permission:denied',
  ACCESS_GRANTED = 'access:granted',
  ACCESS_REVOKED = 'access:revoked',

  // API Key events
  API_KEY_CREATED = 'api_key:created',
  API_KEY_REVOKED = 'api_key:revoked',
  API_KEY_REGENERATED = 'api_key:regenerated',
  API_KEY_USED = 'api_key:used',
  API_KEY_INVALID = 'api_key:invalid',

  // Rate limiting events
  RATE_LIMIT_HIT = 'rate_limit:hit',
  RATE_LIMIT_EXCEEDED = 'rate_limit:exceeded',

  // XSS events
  XSS_DETECTED = 'xss:detected',
  XSS_BLOCKED = 'xss:blocked',

  // CSRF events
  CSRF_FAILURE = 'csrf:failure',
  CSRF_TOKEN_GENERATED = 'csrf:token_generated',

  // Data events
  DATA_EXPORT = 'data:export',
  DATA_IMPORT = 'data:import',
  DATA_DELETED = 'data:deleted',
  DATA_ACCESSED = 'data:accessed',
  PII_ACCESSED = 'pii:accessed',

  // Payment events
  PAYMENT_INITIATED = 'payment:initiated',
  PAYMENT_COMPLETED = 'payment:completed',
  PAYMENT_FAILED = 'payment:failed',
  PAYMENT_REFUNDED = 'payment:refunded',

  // Admin events
  ADMIN_ACTION = 'admin:action',
  CONFIG_CHANGED = 'config:changed',
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_DELETED = 'user:deleted',
  USER_BLOCKED = 'user:blocked',

  // Security scan events
  VULNERABILITY_DETECTED = 'vuln:detected',
  SUSPICIOUS_ACTIVITY = 'security:suspicious',
  IP_BLOCKED = 'ip:blocked',
  IP_UNBLOCKED = 'ip:unblocked',

  // System events
  SYSTEM_HEALTH = 'system:health',
  BACKUP_CREATED = 'backup:created',
  BACKUP_RESTORED = 'backup:restored',
}

/** Risk severity levels */
export enum RiskLevel {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
@Index(['action'])
@Index(['userId'])
@Index(['ip'])
@Index(['timestamp'])
@Index(['riskLevel'])
@Index(['statusCode'])
@Index(['action', 'timestamp'])
@Index(['userId', 'timestamp'])
export class AuditLog {
  /** Unique log entry ID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Action type */
  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  /** User ID (if authenticated) */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** User email/username for display */
  @Column({ type: 'varchar', length: 255, nullable: true })
  userEmail?: string;

  /** Resource being accessed */
  @Column({ type: 'varchar', length: 500, nullable: true })
  resource: string | null;

  /** HTTP method */
  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  /** Request path */
  @Column({ type: 'text', nullable: true })
  path: string | null;

  /** HTTP status code */
  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  /** Client IP address */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  /** Geolocation data (country, city) */
  @Column({ type: 'jsonb', nullable: true })
  geoLocation: Record<string, string> | null;

  /** User agent string */
  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  /** Parsed user agent (browser, OS, device) */
  @Column({ type: 'jsonb', nullable: true })
  parsedUserAgent: Record<string, string> | null;

  /** Risk severity level */
  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.INFO,
  })
  riskLevel: RiskLevel;

  /** Risk score (0-100) */
  @Column({ type: 'int', default: 0 })
  riskScore: number;

  /** Request/response time in milliseconds */
  @Column({ type: 'int', nullable: true })
  responseTime: number | null;

  /** Additional details (JSON) */
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  /** Error message (if any) */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /** API key ID (if API key auth) */
  @Column({ type: 'uuid', nullable: true })
  apiKeyId: string | null;

  /** Session ID */
  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  /** Request ID for correlation */
  @Column({ type: 'varchar', length: 255, nullable: true })
  requestId: string | null;

  /** Event timestamp */
  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
