# BHD Oman Marketplace - Security Documentation

> **Production readiness: NO-GO per Aug 2026 audit until P0 closed. See [`docs/ENGINEERING-SECURITY-AUDIT-2026-08-11.md`](./docs/ENGINEERING-SECURITY-AUDIT-2026-08-11.md)**

> **صدق الحالة (2026-07-21):** هذا المستند يصف **التصميم المستهدف** ووحدات الأمان الموجودة في `backend/src/security/`.  
> **لا يوجد حالياً شهادة SOC2 مثبتة.** ORM الفعلي هو **TypeORM** وليس Prisma. MFA/OAuth مذكورة في الكيانات/التوثيق وليست كلها مفعّلة كمنتج.  
> للتقييم العملي والنواقص الحرجة راجع **[`docs/ENGINEERING-SECURITY-AUDIT-2026-08-11.md`](./docs/ENGINEERING-SECURITY-AUDIT-2026-08-11.md)** و [`ROADMAP.md`](./ROADMAP.md) — لا تعتبر جداول OWASP أدناه شهادة امتثال.

---

## 📋 Table of Contents

- [Security Features](#-security-features-implemented)
- [Authentication & Authorization](#-authentication-and-authorization)
- [Encryption Methods](#-encryption-methods)
- [Rate Limiting](#-rate-limiting-rules)
- [Content Security Policy](#-content-security-policy)
- [Security Headers](#-security-headers)
- [Vulnerability Reporting](#-vulnerability-reporting)
- [Audit Trail](#-audit-trail)
- [OWASP Compliance](#-owasp-compliance)

---

## 🔒 Security Features Implemented

### Overview

BHD Oman Marketplace implements enterprise-grade security measures to protect user data, financial transactions, and platform integrity. Our security architecture follows industry best practices and complies with international standards.

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  HTTPS/TLS 1.3  │  WAF  │  DDoS Protection                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                Nginx Reverse Proxy                           │
│  Rate Limiting │ SSL Termination │ Request Filtering        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Authentication Layer (JWT/OAuth)                  │
│  Multi-Factor Auth │ RBAC │ Session Management             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Application Layer (NestJS)                      │
│  Input Validation │ Output Encoding │ CSRF Protection       │
│  SQL Injection Prev │ XSS Prevention │ File Upload Security │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Data Layer                                  │
│  PostgreSQL (Encrypted) │ Redis (Auth) │ S3 (SSE)           │
└─────────────────────────────────────────────────────────────┘
```

### Security Features Checklist

| Feature | Status | Details |
|---------|--------|---------|
| HTTPS/TLS 1.3 | 🎯 Target / edge | Enforce at reverse proxy / CDN in production |
| JWT Authentication | ✅ | Short-lived access + refresh; cookie or Bearer |
| OAuth 2.0 / OpenID Connect | ⚠️ Partial | Planned / stubs — not fully productized |
| Multi-Factor Authentication | ⚠️ Partial | Entity/docs exist; not fully enforced as product MFA |
| Role-Based Access Control | ✅ | RolesGuard + `@Roles`; `super_admin` satisfies `admin` |
| Rate Limiting | ✅ | Redis-backed `ThrottlerGuard` with in-memory fallback |
| SQL Injection Prevention | ✅ | **TypeORM** parameterized queries (not Prisma) |
| XSS Prevention | ⚠️ | CSP/guards present; invoice/print/JSON-LD XSS open — see Aug 2026 audit |
| CSRF Protection | ⚠️ | Global guard exists; Origin/bypass gaps — see Aug 2026 audit |
| File Upload Security | ⚠️ Partial | Type validation; virus scanning depends on deploy |
| Data Encryption at Rest | ⚠️ | AES-GCM service present but underused; auth CBC weaker — see audit |
| Data Encryption in Transit | 🎯 Target | TLS at edge / load balancer |
| Password Hashing | ✅ | Argon2id / Bcrypt |
| Audit Logging | ❌ | Redaction incomplete; secrets/tokens can leak — see Aug 2026 audit |
| DDoS Protection | 🎯 Target | App rate limits + edge (e.g. Cloudflare) when deployed |
| Security Headers | ✅ | Helmet / OWASP-oriented set |
| Input Validation | ✅ | class-validator / DTO pipes (not only Zod) |
| API Security | ⚠️ | Webhook signatures mixed; SSRF/idempotency gaps — see Aug 2026 audit |
| Payment Security | ⚠️ In progress | Gateway ownership checks + signed webhooks; PCI scope at processor |
| Session Management | ❌ | Refresh revoke/blacklist stubs; reset broken — see Aug 2026 audit |
| SOC 2 | ❌ | **Not certified** — do not claim compliance |

---

## 🔐 Authentication and Authorization

### Authentication Methods

#### 1. Email/Password Authentication

```typescript
// Registration Flow
POST /api/v1/auth/register
  → Validate input (Zod schema)
  → Check email uniqueness
  → Hash password (Argon2id)
  → Encrypt sensitive PII
  → Send verification email
  → Return JWT tokens

// Login Flow
POST /api/v1/auth/login
  → Validate credentials
  → Check account status (not locked/suspended)
  → Verify password hash
  → Generate JWT access token (15 min expiry)
  → Generate refresh token (7 day expiry)
  → Create session in Redis
  → Return tokens + user data
```

**Password Requirements:**

| Requirement | Minimum |
|-------------|---------|
| Length | 8 characters |
| Uppercase letters | 1 |
| Lowercase letters | 1 |
| Numbers | 1 |
| Special characters | 1 |
| Common passwords | Blocked (top 1000) |

#### 2. JWT Token Configuration

```typescript
// Access Token
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "buyer",
  "iat": 1704067200,
  "exp": 1704068100,  // 15 minutes
  "iss": "bhd-oman-marketplace",
  "aud": "bhd-oman-users",
  "jti": "unique-token-id"  // For revocation
}

// Refresh Token
{
  "sub": "user-uuid",
  "type": "refresh",
  "tokenFamily": "family-uuid",
  "iat": 1704067200,
  "exp": 1704672000,  // 7 days
  "jti": "unique-refresh-id"
}
```

**Token Security:**
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh token rotation on every use
- Token family tracking to detect reuse
- Blacklist capability via Redis
- Secure token storage (HttpOnly cookies recommended)

#### 3. Multi-Factor Authentication (MFA)

```typescript
// MFA Setup Flow
POST /api/v1/auth/mfa/setup
  → Generate TOTP secret
  → Generate QR code URI
  → Show backup codes
  → Verify first code
  → Enable MFA on account

// MFA Login Flow
POST /api/v1/auth/login
  → Verify credentials
  → If MFA enabled:
    → Return mfa_required: true
    → POST /api/v1/auth/mfa/verify
      → Verify TOTP code or backup code
      → Complete login
```

**MFA Methods Supported:**

| Method | Description | Priority |
|--------|-------------|----------|
| TOTP | Time-based OTP (Google Authenticator) | Primary |
| SMS OTP | One-time code via SMS | Secondary |
| Email OTP | One-time code via email | Fallback |
| Backup Codes | Single-use recovery codes | Emergency |

#### 4. Social Authentication

```typescript
// Google OAuth 2.0 Flow
GET /api/v1/auth/google
  → Redirect to Google consent screen
  → Receive authorization code
  → Exchange for access token
  → Verify ID token signature
  → Extract user info
  → Create or link account
  → Generate JWT tokens

// Apple Sign In Flow
POST /api/v1/auth/apple
  → Receive Apple ID token
  → Verify with Apple public key
  → Check nonce for replay attack
  → Extract user info
  → Create or link account
  → Generate JWT tokens
```

### Authorization (RBAC)

#### Role Hierarchy

```
Super Admin
    └── Full system access

Admin
    ├── User management (CRUD)
    ├── Store moderation
    ├── Order management
    ├── Financial reports
    ├── Platform settings
    └── Audit log access

Seller
    ├── Own store management
    ├── Product CRUD (own)
    ├── Order management (own)
    ├── Analytics (own)
    └── Payout requests

Buyer
    ├── Profile management
    ├── Order history (own)
    ├── Reviews (own)
    ├── Wishlist (own)
    └── Chat
```

#### Permission Matrix

| Permission | Super Admin | Admin | Seller | Buyer |
|------------|:-----------:|:-----:|:------:|:-----:|
| View Users | ✅ | ✅ | ❌ | ❌ |
| Edit Users | ✅ | ✅ | ❌ | ❌ |
| Suspend Users | ✅ | ✅ | ❌ | ❌ |
| View All Stores | ✅ | ✅ | ❌ | ❌ |
| Edit Any Store | ✅ | ✅ | ❌ | ❌ |
| Verify Store | ✅ | ✅ | ❌ | ❌ |
| Manage Own Store | ✅ | ❌ | ✅ | ❌ |
| Manage Own Products | ✅ | ❌ | ✅ | ❌ |
| View All Orders | ✅ | ✅ | ❌ | ❌ |
| Manage Own Orders | ✅ | ❌ | ✅ | ✅ |
| Process Refunds | ✅ | ✅ | ❌ | ❌ |
| View Financial Data | ✅ | ✅ | ❌ | ❌ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ |
| View Audit Log | ✅ | ❌ | ❌ | ❌ |

#### Permission Guards Implementation

```typescript
// NestJS Guard Example
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// Usage
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('users')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getUsers() { ... }
  
  @Post('stores/:id/verify')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async verifyStore() { ... }
}
```

---

## 🔑 Encryption Methods

### Data at Rest

#### Database Encryption

```typescript
// AES-256 Encryption for PII
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes

// Encrypt sensitive fields before saving
@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  private authTagLength = 16;

  encrypt(plaintext: string): string {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(
      this.algorithm,
      Buffer.from(ENCRYPTION_KEY, 'base64'),
      iv
    );
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(ciphertext: string): string {
    const [ivBase64, authTagBase64, encryptedBase64] = ciphertext.split(':');
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    
    const decipher = createDecipheriv(
      this.algorithm,
      Buffer.from(ENCRYPTION_KEY, 'base64'),
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  }
}
```

**Encrypted Fields:**

| Field | Table | Encryption |
|-------|-------|------------|
| National ID | users | AES-256-GCM |
| Bank Account | seller_profiles | AES-256-GCM |
| IBAN | seller_profiles | AES-256-GCM |
| Phone Number | users | AES-256-GCM |
| Address Details | addresses | AES-256-GCM |

#### Password Hashing

```typescript
// Argon2id Configuration (Recommended)
const argon2Config = {
  type: argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 parallel threads
  hashLength: 32,       // 32 byte output
};

// Hash password
const hash = await argon2.hash(password, argon2Config);

// Verify password
const isValid = await argon2.verify(hash, password);
```

**Password Security Features:**
- Argon2id winner of Password Hashing Competition
- Memory-hard to resist GPU/ASIC attacks
- Unique salt per password
- Configurable cost parameters

### Data in Transit

#### TLS Configuration

```nginx
# nginx ssl.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

# Modern cipher suite
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# Session configuration
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /path/to/chain.pem;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

**TLS Grade Target:** A+ on SSL Labs

---

## 🚦 Rate Limiting Rules

> **التنفيذ الحالي:** `ThrottlerGuard` يستخدم **Redis** (`INCR` + `PEXPIRE`، مفتاح `bhd:rl:*`) عند توفر العميل، مع **fallback في الذاكرة** إن فشل Redis. مستويات: DEFAULT / STRICT / LENIENT / LOGIN / REGISTER / WEBHOOK.

### Rate Limit Configuration (تصميم مرجعي / مستويات الكود)

```typescript
// Rate limiting tiers
const rateLimitTiers = {
  // Anonymous users
  anonymous: {
    windowMs: 60 * 1000,        // 1 minute
    max: 30,                     // 30 requests
    keyGenerator: (req) => req.ip,
  },
  
  // Authenticated users
  authenticated: {
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.user.id,
  },
  
  // Premium users
  premium: {
    windowMs: 60 * 1000,
    max: 200,
    keyGenerator: (req) => req.user.id,
  },
  
  // Admin users
  admin: {
    windowMs: 60 * 1000,
    max: 500,
    keyGenerator: (req) => req.user.id,
  },
};
```

### Endpoint-Specific Limits

| Endpoint | Rate Limit | Window | Scope |
|----------|-----------|--------|-------|
| `POST /auth/register` | 5 | 1 hour | IP |
| `POST /auth/login` | 10 | 1 minute | IP |
| `POST /auth/forgot-password` | 3 | 1 hour | IP |
| `POST /auth/otp/send` | 5 | 1 hour | Phone |
| `POST /auth/resend-verification` | 3 | 1 hour | Email |
| `POST /payments/process` | 10 | 1 minute | User |
| `POST /orders` | 20 | 1 minute | User |
| `POST /cart/items` | 30 | 1 minute | User |
| `GET /products` | 60 | 1 minute | IP/User |
| `POST /ai/chat` | 50 | 1 minute | User |
| `POST /upload` | 20 | 1 minute | User |
| `GET /admin/*` | 200 | 1 minute | User |
| WebSocket connections | 10 | 1 minute | IP |

### Rate Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

---

## 🛡️ Content Security Policy

### CSP Configuration

```nginx
# Content Security Policy Header
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://js.stripe.com 
    https://checkout.thawani.om
    https://www.googletagmanager.com
    https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com;
  font-src 'self' 
    https://fonts.gstatic.com;
  img-src 'self' data: https: blob: 
    https://cdn.bhd.om 
    https://res.cloudinary.com;
  connect-src 'self' 
    https://api.bhd.om 
    https://api.openai.com
    https://api.stripe.com
    https://www.google-analytics.com;
  frame-src 'self' 
    https://js.stripe.com 
    https://checkout.thawani.om
    https://www.google.com/recaptcha/;
  media-src 'self' https://cdn.bhd.om;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" always;
```

### CSP Directives Breakdown

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default fallback |
| `script-src` | `'self'` + trusted domains | Allow scripts |
| `style-src` | `'self'` + Google Fonts | Allow stylesheets |
| `img-src` | `'self'` + data + https | Allow images |
| `connect-src` | `'self'` + APIs | Allow XHR/fetch |
| `frame-src` | Payment iframes | Allow frames |
| `object-src` | `'none'` | Block Flash/PDF |
| `base-uri` | `'self'` | Restrict base tag |
| `upgrade-insecure-requests` | - | Force HTTPS |

---

## 📋 Security Headers

### Complete Header Configuration

```nginx
# nginx security-headers.conf

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy
add_header Permissions-Policy "
  camera=(),
  microphone=(),
  geolocation=(self),
  payment=(self https://checkout.thawani.om https://js.stripe.com),
  usb=(),
  magnetometer=(),
  gyroscope=()
" always;

# Strict Transport Security
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "..." always;

# Cache Control for sensitive pages
location /admin {
  add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
  add_header Pragma "no-cache" always;
  add_header Expires "0" always;
}
```

### Header Reference Table

| Header | Value | OWASP Category |
|--------|-------|----------------|
| `X-Content-Type-Options` | `nosniff` | Security Misconfiguration |
| `X-Frame-Options` | `SAMEORIGIN` | Broken Access Control |
| `X-XSS-Protection` | `1; mode=block` | XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Security Misconfiguration |
| `Permissions-Policy` | Feature restrictions | Security Misconfiguration |
| `Strict-Transport-Security` | `max-age=63072000` | Security Misconfiguration |
| `Content-Security-Policy` | Full policy | XSS, Injection |
| `Cache-Control` | `no-store` for auth | Sensitive Data Exposure |

---

## 🐛 Vulnerability Reporting

### Reporting Process

We take security seriously and appreciate responsible disclosure.

#### How to Report

1. **Email**: security@bhd.om
2. **Subject**: `[SECURITY] Brief description`
3. **Include**:
   - Detailed description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your contact information

#### Response Timeline

| Phase | Timeframe |
|-------|-----------|
| Acknowledgment | Within 24 hours |
| Initial Assessment | Within 72 hours |
| Fix Development | 1-2 weeks (critical: 48h) |
| Fix Deployment | 2-4 weeks (critical: 1 week) |
| Disclosure | After fix deployed |

#### Bounty Program

| Severity | Reward (OMR) | Examples |
|----------|-------------|----------|
| Critical | 1,000 - 2,000 | RCE, SQL injection, Auth bypass |
| High | 500 - 1,000 | XSS, IDOR, Sensitive data exposure |
| Medium | 200 - 500 | CSRF, Information disclosure |
| Low | 50 - 200 | Best practice violations |

### Scope

**In Scope:**
- https://bhd.om
- https://api.bhd.om
- https://admin.bhd.om
- Mobile applications
- API endpoints

**Out of Scope:**
- Third-party services
- Social engineering
- Physical attacks
- DOS/DDOS attacks
- Outdated browser vulnerabilities

### Responsible Disclosure Rules

1. Do not access, modify, or delete others' data
2. Do not disrupt services
3. Provide reasonable time for fixes before disclosure
4. Follow coordinated disclosure
5. Do not violate any laws

---

## 📜 Audit Trail

### Logging Configuration

```typescript
// Audit log schema
interface AuditLog {
  id: string;           // Unique log ID
  timestamp: Date;      // Event timestamp
  userId?: string;      // User who performed action
  userEmail?: string;   // User email
  ipAddress: string;    // Client IP
  userAgent: string;    // Client user agent
  action: string;       // Action performed
  resource: string;     // Resource affected
  resourceId?: string;  // Resource ID
  oldValue?: object;    // Previous state
  newValue?: object;    // New state
  result: 'success' | 'failure';
  errorMessage?: string;
  metadata?: object;    // Additional context
}
```

### Logged Events

| Category | Events |
|----------|--------|
| **Authentication** | login, logout, failed_login, password_change, mfa_enable, mfa_disable |
| **Registration** | register, email_verify, resend_verification |
| **Authorization** | permission_denied, role_change, access_granted |
| **Users** | create, update, delete, suspend, activate |
| **Stores** | create, update, delete, verify, suspend |
| **Products** | create, update, delete, publish, unpublish |
| **Orders** | create, update_status, cancel, refund |
| **Payments** | process, success, failure, refund, dispute |
| **Settings** | update, security_setting_change |
| **Admin** | admin_login, settings_change, user_action |

### Audit Log Retention

| Log Type | Retention Period | Storage |
|----------|-----------------|---------|
| Authentication logs | 2 years | PostgreSQL + Archive |
| Authorization logs | 2 years | PostgreSQL + Archive |
| Transaction logs | 7 years | PostgreSQL + S3 Archive |
| System logs | 1 year | CloudWatch + S3 |
| Access logs | 90 days | S3 |

### Audit Log Query

```bash
# Query audit logs via API (Admin only)
GET /api/v1/admin/audit-log?userId=xxx&action=login&from=2024-01-01&to=2024-01-31

# Export audit logs
GET /api/v1/admin/audit-log/export?format=csv&from=2024-01-01&to=2024-01-31
```

---

## ⚠️ OWASP Compliance

> Status below reflects **current code reality**, not target design. Details: [`docs/ENGINEERING-SECURITY-AUDIT-2026-08-11.md`](./docs/ENGINEERING-SECURITY-AUDIT-2026-08-11.md).

### OWASP Top 10 (2021) Compliance

| # | Risk | Status | Mitigation |
|---|------|--------|------------|
| A01 | Broken Access Control | ⚠️ | JWT/Roles guards exist; permissions unused, ownership ad hoc — see audit |
| A02 | Cryptographic Failures | ⚠️ | Argon2id OK; EncryptionService underused; auth CBC weaker — see audit |
| A03 | Injection | ⚠️ | TypeORM params OK; XSS in invoice/print/JSON-LD — see audit |
| A04 | Insecure Design | ❌ | Payment/idempotency/inventory races — see audit §7 |
| A05 | Security Misconfiguration | ⚠️ | Headers present; CORS/upload/health gaps — see audit |
| A06 | Vulnerable Components | ❌ | npm audit findings open — see Aug 2026 audit |
| A07 | Auth Failures | ❌ | Password reset broken; session revoke stubs; MFA not productized — see audit |
| A08 | Data Integrity Failures | ⚠️ | Webhook/payment integrity incomplete — see audit |
| A09 | Logging Failures | ❌ | Incomplete redaction; token/payload leaks — see audit |
| A10 | SSRF | ❌ | Confirmed B2B webhook SSRF; no egress URL policy — see audit |

### OWASP API Security Top 10

| # | Risk | Status | Mitigation |
|---|------|--------|------------|
| API1 | Broken Object Level Auth | ⚠️ | Ownership checks ad hoc, not centralized — see audit |
| API2 | Broken Auth | ❌ | Reset/session revoke failures — see audit |
| API3 | Excessive Data Exposure | ⚠️ | DTOs partial; logging may expose secrets — see audit |
| API4 | Lack of Rate Limiting | ⚠️ | Throttler present; coverage/bypass gaps — see audit |
| API5 | Broken Function Level Auth | ⚠️ | `@Roles` only; permissions unused — see audit |
| API6 | Mass Assignment | ⚠️ | DTO whitelists uneven — see audit |
| API7 | Security Misconfiguration | ⚠️ | Hardening incomplete vs production needs — see audit |
| API8 | Injection | ⚠️ | SQL params OK; XSS vectors remain — see audit |
| API9 | Improper Asset Management | ⚠️ | Versioning present; unused/scaffolded APIs — see audit |
| API10 | Insufficient Logging | ❌ | Audit trail incomplete; redaction fails — see audit |

### Security Testing Checklist

- [ ] **SAST**: Static Application Security Testing (SonarQube)
- [ ] **DAST**: Dynamic Application Security Testing (OWASP ZAP)
- [ ] **Dependency Scanning**: npm audit, Snyk
- [ ] **Container Scanning**: Docker image vulnerability scan
- [ ] **Penetration Testing**: Annual third-party assessment
- [ ] **Code Review**: Security-focused code reviews
- [ ] **Secret Scanning**: GitLeaks, TruffleHog
- [ ] **Fuzzing**: Input fuzzing for APIs

### Security Scanning Commands

```bash
# npm audit
npm audit
npm audit fix

# Snyk scan
npx snyk test
npx snyk monitor

# Docker image scan
docker scan bhd/marketplace-backend:latest

# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.bhd.om

# GitLeaks secret detection
gitleaks detect --source . --verbose
```

---

<div align="center">

**[⬅️ Back to README](./README.md)** | **[🚀 Deployment](./DEPLOYMENT.md)** | **[🔧 Troubleshooting](./TROUBLESHOOTING.md)**

Made with ❤️ in 🇴🇲 Oman

</div>
