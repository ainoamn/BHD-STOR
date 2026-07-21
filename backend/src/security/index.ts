/**
 * @fileoverview Security Module Barrel Export
 * @description Central export point for all security module components.
 * Import from this file to access any security feature.
 *
 * @example
 * import {
 *   SecurityModule,
 *   RateLimitGuard,
 *   RateLimitPresets,
 *   EncryptionService,
 * } from './security';
 */

// ==================== Main Module ====================
export { SecurityModule } from './security.module';

// ==================== Rate Limiting ====================
export { RateLimitModule } from './rate-limit/rate-limit.module';
export { RateLimitService, type RateLimitResult } from './rate-limit/rate-limit.service';
export { RateLimitGuard } from './rate-limit/rate-limit.guard';
export {
  RateLimit,
  RateLimitPresets,
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from './rate-limit/rate-limit.decorator';

// ==================== XSS Protection ====================
export {
  XssSanitizerService,
  XssSeverity,
  type XssDetectionResult,
} from './xss/xss-sanitizer.service';
export {
  XssInterceptor,
  type XssInterceptorConfig,
} from './xss/xss.interceptor';
export { XssGuard } from './xss/xss.guard';

// ==================== CSRF Protection ====================
export {
  CsrfService,
  CSRF_TOKEN_COOKIE,
  CSRF_HEADER_NAME,
  type CsrfToken,
  type CsrfCookieOptions,
} from './csrf/csrf.service';
export {
  CsrfGuard,
  type RequestWithCsrf,
} from './csrf/csrf.guard';
export { CsrfController } from './csrf/csrf.controller';

// ==================== Content Security Policy ====================
export {
  CspMiddleware,
  type RequestWithCspNonce,
} from './csp/csp.middleware';
export {
  getCspConfig,
  getPaymentCspConfig,
  buildCspString,
  strictCspConfig,
  balancedCspConfig,
  developmentCspConfig,
  reportOnlyCspConfig,
  paymentCspConfig,
  type CspConfig,
  type CspDirectiveConfig,
} from './csp/csp.config';

// ==================== Encryption Layer ====================
export { EncryptionModule } from './encryption/encryption.module';
export {
  EncryptionService,
  type EncryptedData,
  type HmacResult,
} from './encryption/encryption.service';

// ==================== API Key Management ====================
export {
  ApiKeyService,
  type RawApiKey,
  type ApiKeyValidationResult,
} from './api-key/api-key.service';
export {
  ApiKeyGuard,
  RequireApiKey,
  API_KEY_REQUIRED,
  API_KEY_SCOPES,
  type RequestWithApiKey,
} from './api-key/api-key.guard';
export { ApiKeyController } from './api-key/api-key.controller';
export {
  ApiKey,
  ApiKeyScope,
} from './api-key/entities/api-key.entity';

// ==================== Audit Trail ====================
export {
  AuditService,
  type AuditLogOptions,
  type AuditStats,
} from './audit/audit.service';
export {
  AuditInterceptor,
  type RequestWithAudit,
} from './audit/audit.interceptor';
export { AuditController } from './audit/audit.controller';
export {
  AuditLog,
  AuditAction,
  RiskLevel,
} from './audit/entities/audit-log.entity';

// ==================== Security Headers ====================
export {
  SecurityHeadersMiddleware,
  type SecurityHeadersConfig,
} from './headers/security-headers.middleware';

// ==================== Vulnerability Scanner ====================
export {
  SecurityScannerService,
  VulnSeverity,
  type VulnerabilityResult,
  type SecurityScanResult,
} from './scanner/security-scanner.service';
