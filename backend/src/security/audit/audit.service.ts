/**
 * @fileoverview Audit Service
 * @description Comprehensive security audit logging service.
 * Logs all security-relevant events with risk scoring and alerting.
 *
 * OWASP: Logging and Monitoring Cheat Sheet compliance.
 * - A09:2021 – Security Logging and Monitoring Failures prevention
 * - A10:2021 – Server-Side Request Forgery detection support
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { AuditLog, AuditAction, RiskLevel } from './entities/audit-log.entity';

/** Options for creating an audit log entry */
export interface AuditLogOptions {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  resource?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  riskLevel?: RiskLevel;
  riskScore?: number;
  responseTime?: number;
  details?: Record<string, unknown>;
  errorMessage?: string;
  apiKeyId?: string;
  sessionId?: string;
  requestId?: string;
}

/** Statistics for audit dashboard */
export interface AuditStats {
  totalEvents24h: number;
  criticalEvents24h: number;
  failedLogins24h: number;
  topActions: { action: string; count: number }[];
  topIps: { ip: string; count: number }[];
  riskDistribution: { riskLevel: string; count: number }[];
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  /** Event count in current window for throttling alerts */
  private alertCount = 0;
  private alertWindowStart = Date.now();

  /** Alert threshold: max alerts per minute */
  private readonly ALERT_RATE_LIMIT = 10;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Log a security event.
   * This is the primary method for all audit logging.
   */
  async log(options: AuditLogOptions): Promise<AuditLog> {
    try {
      // Calculate risk score if not provided
      const riskScore = options.riskScore ?? this.calculateRiskScore(options);
      const riskLevel = options.riskLevel ?? this.scoreToLevel(riskScore);

      // Parse user agent
      const parsedUserAgent = options.userAgent
        ? this.parseUserAgent(options.userAgent)
        : null;

      // Attempt geolocation
      const geoLocation = options.ip
        ? await this.getGeoLocation(options.ip)
        : null;

      const auditLog = this.auditRepository.create({
        action: options.action,
        userId: options.userId || null,
        userEmail: options.userEmail,
        resource: options.resource || null,
        method: options.method || null,
        path: options.path || null,
        statusCode: options.statusCode || null,
        ip: this.anonymizeIp(options.ip),
        geoLocation,
        userAgent: options.userAgent || null,
        parsedUserAgent,
        riskLevel,
        riskScore,
        responseTime: options.responseTime || null,
        details: options.details || null,
        errorMessage: options.errorMessage || null,
        apiKeyId: options.apiKeyId || null,
        sessionId: options.sessionId || null,
        requestId: options.requestId || null,
      });

      const saved = await this.auditRepository.save(auditLog);

      // Alert on high-risk events
      if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
        await this.alertOnSuspiciousActivity(saved);
      }

      // Also log to application logger for real-time monitoring
      this.logToApplicationLogger(saved);

      return saved;
    } catch (error) {
      // Never throw from audit logging - fail silently
      this.logger.error(`Audit logging failed: ${(error as Error).message}`);
      // Return a minimal log object
      return null as unknown as AuditLog;
    }
  }

  /**
   * Log authentication events.
   */
  async logAuth(
    success: boolean,
    userId: string | undefined,
    userEmail: string | undefined,
    ip: string | undefined,
    userAgent: string | undefined,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const action = success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILURE;
    const riskLevel = success ? RiskLevel.INFO : RiskLevel.MEDIUM;
    const riskScore = success ? 0 : 30;

    await this.log({
      action,
      userId,
      userEmail,
      ip,
      userAgent,
      riskLevel,
      riskScore,
      details,
    });
  }

  /**
   * Log a rate limit hit.
   */
  async logRateLimit(
    identifier: string,
    endpoint: string,
    limit: number,
    ip: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      ip,
      resource: endpoint,
      details: { identifier, limit },
      riskLevel: RiskLevel.MEDIUM,
      riskScore: 40,
    });
  }

  /**
   * Log XSS detection.
   */
  async logXssDetection(
    patterns: string[],
    severity: string,
    ip: string,
    path: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.XSS_BLOCKED,
      ip,
      path,
      details: { patterns, severity },
      riskLevel: RiskLevel.HIGH,
      riskScore: severity === 'critical' ? 90 : 70,
    });
  }

  /**
   * Log CSRF failure.
   */
  async logCsrfFailure(
    reason: string,
    ip: string,
    path: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.CSRF_FAILURE,
      ip,
      path,
      userAgent,
      details: { reason },
      riskLevel: RiskLevel.HIGH,
      riskScore: 75,
    });
  }

  /**
   * Log permission denial.
   */
  async logPermissionDenied(
    userId: string,
    resource: string,
    action: string,
    ip: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.PERMISSION_DENIED,
      userId,
      resource,
      ip,
      details: { attemptedAction: action },
      riskLevel: RiskLevel.MEDIUM,
      riskScore: 50,
    });
  }

  /**
   * Log API key operations.
   */
  async logApiKeyOperation(
    action: AuditAction,
    keyId: string,
    userId: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action,
      userId,
      apiKeyId: keyId,
      details,
      riskLevel: RiskLevel.LOW,
      riskScore: 20,
    });
  }

  // ==================== Query Methods ====================

  /**
   * Get recent audit logs with filtering.
   */
  async getLogs(options: {
    action?: AuditAction;
    userId?: string;
    ip?: string;
    riskLevel?: RiskLevel;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const query = this.auditRepository.createQueryBuilder('log')
      .orderBy('log.timestamp', 'DESC');

    if (options.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }
    if (options.userId) {
      query.andWhere('log.userId = :userId', { userId: options.userId });
    }
    if (options.ip) {
      query.andWhere('log.ip = :ip', { ip: options.ip });
    }
    if (options.riskLevel) {
      query.andWhere('log.riskLevel = :riskLevel', { riskLevel: options.riskLevel });
    }
    if (options.startDate && options.endDate) {
      query.andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    const limit = options.limit || 100;
    const offset = options.offset || 0;

    query.skip(offset).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  /**
   * Get audit statistics for the dashboard.
   */
  async getStats(): Promise<AuditStats> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const dateRange = Between(yesterday, now);

    // Total events in 24h
    const totalEvents24h = await this.auditRepository.count({
      where: { timestamp: dateRange },
    });

    // Critical events in 24h
    const criticalEvents24h = await this.auditRepository.count({
      where: { timestamp: dateRange, riskLevel: RiskLevel.CRITICAL },
    });

    // Failed logins in 24h
    const failedLogins24h = await this.auditRepository.count({
      where: {
        timestamp: dateRange,
        action: AuditAction.LOGIN_FAILURE,
      },
    });

    // Top actions
    const topActions = await this.auditRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :yesterday', { yesterday })
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Top IPs
    const topIps = await this.auditRepository
      .createQueryBuilder('log')
      .select('log.ip', 'ip')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :yesterday', { yesterday })
      .groupBy('log.ip')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Risk distribution
    const riskDistribution = await this.auditRepository
      .createQueryBuilder('log')
      .select('log.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :yesterday', { yesterday })
      .groupBy('log.riskLevel')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      totalEvents24h,
      criticalEvents24h,
      failedLogins24h,
      topActions: topActions.map((r) => ({ action: r.action, count: parseInt(r.count) })),
      topIps: topIps.map((r) => ({ ip: r.ip, count: parseInt(r.count) })),
      riskDistribution: riskDistribution.map((r) => ({
        riskLevel: r.riskLevel,
        count: parseInt(r.count),
      })),
    };
  }

  /**
   * Export logs to CSV format.
   */
  async exportToCsv(options: {
    startDate: Date;
    endDate: Date;
    action?: AuditAction;
  }): Promise<string> {
    const { data } = await this.getLogs({
      action: options.action,
      startDate: options.startDate,
      endDate: options.endDate,
      limit: 10000,
    });

    // CSV header
    const csvHeader = [
      'id', 'timestamp', 'action', 'userId', 'userEmail',
      'resource', 'method', 'path', 'statusCode', 'ip',
      'riskLevel', 'riskScore', 'responseTime', 'details',
    ].join(',');

    // CSV rows
    const csvRows = data.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.action,
      log.userId || '',
      log.userEmail || '',
      log.resource || '',
      log.method || '',
      log.path || '',
      log.statusCode || '',
      log.ip || '',
      log.riskLevel,
      log.riskScore,
      log.responseTime || '',
      log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '',
    ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','));

    return [csvHeader, ...csvRows].join('\n');
  }

  // ==================== Private Helpers ====================

  /**
   * Calculate risk score based on event characteristics.
   */
  private calculateRiskScore(options: AuditLogOptions): number {
    let score = 0;

    // Base score by action type
    const highRiskActions = [
      AuditAction.LOGIN_FAILURE,
      AuditAction.PERMISSION_DENIED,
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditAction.XSS_BLOCKED,
      AuditAction.CSRF_FAILURE,
      AuditAction.VULNERABILITY_DETECTED,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.IP_BLOCKED,
    ];

    if (highRiskActions.includes(options.action)) {
      score += 30;
    }

    // Failed requests increase risk
    if (options.statusCode && options.statusCode >= 400) {
      score += 10;
    }

    // Multiple failures from same IP would be caught by aggregation

    // Anonymized IPs might indicate privacy-sensitive operations
    if (options.details?.anonymized === true) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Convert numeric score to risk level.
   */
  private scoreToLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MEDIUM;
    if (score >= 20) return RiskLevel.LOW;
    return RiskLevel.INFO;
  }

  /**
   * Parse user agent string into components.
   */
  private parseUserAgent(ua: string): Record<string, string> {
    const result: Record<string, string> = { raw: ua };

    // Browser detection
    if (ua.includes('Firefox/')) result.browser = 'Firefox';
    else if (ua.includes('Chrome/') && !ua.includes('Edg/')) result.browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) result.browser = 'Safari';
    else if (ua.includes('Edg/')) result.browser = 'Edge';
    else if (ua.includes('Opera/') || ua.includes('OPR/')) result.browser = 'Opera';
    else result.browser = 'Unknown';

    // OS detection
    if (ua.includes('Windows')) result.os = 'Windows';
    else if (ua.includes('Mac OS')) result.os = 'macOS';
    else if (ua.includes('Linux')) result.os = 'Linux';
    else if (ua.includes('Android')) result.os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) result.os = 'iOS';
    else result.os = 'Unknown';

    // Device type
    if (ua.includes('Mobile')) result.device = 'Mobile';
    else if (ua.includes('Tablet')) result.device = 'Tablet';
    else result.device = 'Desktop';

    return result;
  }

  /**
   * Get geolocation data for an IP address.
   * Placeholder - integrate with MaxMind GeoIP2 in production.
   */
  private async getGeoLocation(ip: string): Promise<Record<string, string> | null> {
    try {
      // Skip private IPs
      if (
        ip === '127.0.0.1' ||
        ip === '::1' ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('172.16.')
      ) {
        return { type: 'private' };
      }

      // TODO: Integrate with MaxMind GeoIP2 or similar service
      // For now, return null - will be populated by a background job
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Anonymize IP address for privacy compliance (GDPR).
   */
  private anonymizeIp(ip: string | undefined): string | null {
    if (!ip) return null;

    const shouldAnonymize = this.configService.get<boolean>('AUDIT_ANONYMIZE_IP', false);
    if (!shouldAnonymize) return ip;

    // Anonymize by removing last octet
    if (ip.includes('.')) {
      return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    if (ip.includes(':')) {
      return ip.split(':').slice(0, 4).join(':') + '::';
    }

    return ip;
  }

  /**
   * Send alert for suspicious activity.
   * Rate-limited to prevent alert fatigue.
   */
  private async alertOnSuspiciousActivity(log: AuditLog): Promise<void> {
    // Rate limit alerts
    const now = Date.now();
    if (now - this.alertWindowStart > 60000) {
      this.alertCount = 0;
      this.alertWindowStart = now;
    }

    if (this.alertCount >= this.ALERT_RATE_LIMIT) {
      return;
    }

    this.alertCount++;

    // Log to application logger (integrate with PagerDuty/Slack in production)
    this.logger.warn(
      `SECURITY ALERT: ${log.action} | Risk: ${log.riskLevel} | ` +
        `User: ${log.userId || 'anonymous'} | IP: ${log.ip || 'unknown'} | ` +
        `Path: ${log.path || 'N/A'} | Time: ${log.timestamp.toISOString()}`,
    );

    // TODO: Integrate with notification service
    // await this.notificationService.sendSecurityAlert(log);
  }

  /**
   * Log to application logger for real-time log aggregation.
   */
  private logToApplicationLogger(log: AuditLog): void {
    const logData = {
      event: 'audit',
      action: log.action,
      userId: log.userId,
      ip: log.ip,
      riskLevel: log.riskLevel,
      riskScore: log.riskScore,
      timestamp: log.timestamp.toISOString(),
      requestId: log.requestId,
    };

    if (log.riskLevel === RiskLevel.CRITICAL || log.riskLevel === RiskLevel.HIGH) {
      this.logger.warn(JSON.stringify(logData));
    } else {
      this.logger.debug(JSON.stringify(logData));
    }
  }
}
