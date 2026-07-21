/**
 * @fileoverview Security Module
 * @description Main NestJS security module that integrates all security sub-modules
 * for the BHD Oman e-commerce marketplace.
 *
 * Combines:
 * - Rate Limiting (OWASP API4:2023)
 * - XSS Protection (OWASP A03:2021)
 * - CSRF Protection (OWASP A01:2021)
 * - Content Security Policy (OWASP Defense in Depth)
 * - Encryption Layer (OWASP A02:2021)
 * - API Key Management (OWASP API2:2023)
 * - Audit Trail (OWASP A09:2021)
 * - Security Headers (OWASP A05:2021)
 * - Vulnerability Scanner (OWASP A03:2021)
 *
 * @example
 * // In app.module.ts
 * imports: [SecurityModule, ...]
 */

import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// === Rate Limiting ===
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';

// === XSS Protection ===
import { XssSanitizerService } from './xss/xss-sanitizer.service';
import { XssInterceptor } from './xss/xss.interceptor';
import { XssGuard } from './xss/xss.guard';

// === CSRF Protection ===
import { CsrfService } from './csrf/csrf.service';
import { CsrfGuard } from './csrf/csrf.guard';
import { CsrfController } from './csrf/csrf.controller';

// === Content Security Policy ===
import { CspMiddleware } from './csp/csp.middleware';

// === Encryption ===
import { EncryptionModule } from './encryption/encryption.module';
import { EncryptionService } from './encryption/encryption.service';

// === API Key Management ===
import { ApiKeyService } from './api-key/api-key.service';
import { ApiKeyGuard } from './api-key/api-key.guard';
import { ApiKeyController } from './api-key/api-key.controller';
import { ApiKey } from './api-key/entities/api-key.entity';

// === Audit Trail ===
import { AuditService } from './audit/audit.service';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditController } from './audit/audit.controller';
import { AuditLog } from './audit/entities/audit-log.entity';

// === Security Headers ===
import { SecurityHeadersMiddleware } from './headers/security-headers.middleware';

// === Vulnerability Scanner ===
import { SecurityScannerService } from './scanner/security-scanner.service';

/**
 * Security Module
 *
 * Integrates all security subsystems into a single importable module.
 * Configures middleware, guards, interceptors, and services.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ApiKey, AuditLog]),
    RateLimitModule,
    EncryptionModule,
  ],
  controllers: [
    CsrfController,
    ApiKeyController,
    AuditController,
  ],
  providers: [
    // Rate Limiting
    RateLimitService,
    RateLimitGuard,

    // XSS Protection
    XssSanitizerService,
    XssInterceptor,
    XssGuard,

    // CSRF Protection
    CsrfService,
    CsrfGuard,

    // Encryption
    EncryptionService,

    // API Key Management
    ApiKeyService,
    ApiKeyGuard,

    // Audit Trail
    AuditService,
    AuditInterceptor,

    // Security Headers (no service needed)

    // Vulnerability Scanner
    SecurityScannerService,
  ],
  exports: [
    // Rate Limiting
    RateLimitService,
    RateLimitGuard,

    // XSS Protection
    XssSanitizerService,
    XssInterceptor,
    XssGuard,

    // CSRF Protection
    CsrfService,
    CsrfGuard,

    // Encryption
    EncryptionService,

    // API Key Management
    ApiKeyService,
    ApiKeyGuard,

    // Audit Trail
    AuditService,
    AuditInterceptor,

    // Vulnerability Scanner
    SecurityScannerService,
  ],
})
export class SecurityModule implements NestModule {
  /**
   * Configure middleware for the application.
   * Security headers and CSP are applied globally.
   */
  configure(consumer: MiddlewareConsumer): void {
    // Apply security headers middleware to all routes
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply CSP middleware to all routes
    consumer
      .apply(CspMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
