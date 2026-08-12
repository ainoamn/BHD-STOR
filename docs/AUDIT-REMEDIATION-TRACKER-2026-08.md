# Audit Remediation Tracker — 2026-08

**Source:** [`ENGINEERING-SECURITY-AUDIT-2026-08-11.md`](./ENGINEERING-SECURITY-AUDIT-2026-08-11.md)  
**Audit commit:** `feb0e4919f8e85f6138481dec1e5c85c1bc4d8c5`  
**Documented:** 2026-08-12  
**Implementation sprint started:** 2026-08-12  
**Gate:** Production remains **NO-GO** until remaining dependency highs without safe fix are accepted/replaced; `@ts-nocheck` debt should be burned down module-by-module

Status values: `pending` · `in progress` · `done` · `blocked`

---

## Phase 0 — 24–72h: Block unsafe launch

| Done | ID | Severity | Item | Status | Owner | Notes |
|------|----|----------|------|--------|-------|-------|
| [x] | P0-01 | P0 | Document NO-GO gate + remediation tracker | done | agents | docs/ENGINEERING-SECURITY-AUDIT + TRACKER + README |
| [x] | P0-02 | P0 | Kill-switch live card payments (`PAYMENTS_LIVE_ENABLED`, default false); COD allowed | done | agents | payments.service.ts + .env.example |
| [x] | P0-03 | P0 | Central recursive redaction; stop token/payload logging | done | agents | redact.util.ts + LoggingInterceptor + whatsapp/notifications |
| [x] | P0-04 | P0 | Fix CORS reflection; restrict uploads (SVG/same-origin) | done | agents | Nest allowlist + nginx no reflect; SVG blocked; Next dangerouslyAllowSVG=false |
| [x] | P0-05 | P0 | Docker/CD health → `/health`; Frontend `/api/health` | done | agents | compose + cd.yml + route.ts |
| [x] | P0-06 | P0 | Align `SECURITY.md` with audit reality (NO-GO banner) | done | agents | Honest OWASP table |

---

## Phase 1 items pulled forward (implemented 2026-08-12)

| Done | ID | Severity | Item | Status | Owner | Notes |
|------|----|----------|------|--------|-------|-------|
| [x] | P1-01a | P0 | Unify Node to 24 (engines, Docker, CI) | done | agents | backend engines + Dockerfiles + ci/docker-build |
| [x] | P1-02a | P0 | TypeORM DataSource + migration:run `-d` | done | agents | `src/data-source.ts` |
| [x] | P1-04 | P0 | Password reset (selector+verifier) + Redis session revoke | done | agents | auth.service + JWT strategies |
| [x] | P1-05 | P0 | XSS: invoice HTML escape, barcode DOM print, JSON-LD `\u003c` | done | agents | payments + StoreBarcodeCard + seo |
| [x] | P1-06 | P0 | B2B webhook SSRF allowlist/private-IP block | done | agents | safe-webhook-url.ts |
| [x] | P0-WH | P0 | Webhook apply errors rethrow → 5xx for provider retry | done | agents | payments.controller/service |

---

## Phase 1 — remaining (~2 weeks)

| Done | ID | Severity | Item | Status | Owner | Notes |
|------|----|----------|------|--------|-------|-------|
| [x] | P1-01b | P0/P1 | Backend `tsc` gate; ESLint non-interactive; stop growth of errors | done | agents | Gate green at 0 via `tsconfig.typecheck.json`; legacy `@ts-nocheck` debt remains |
| [x] | P1-02b | P0 | Migrations for webhook_events / payment_attempts (+ unique order_number) | done | agents | `013-payment-attempts-webhook-events.ts` (api_keys/audit still pending) |
| [x] | P1-03 | P0 | Inventory + order transactions; money helpers on critical paths | done | agents | orders.create/cancel tx + pessimistic lock; money.util; refund/capture helpers |
| [x] | P1-07 | P0/P1 | Backend integration + Frontend unit/Playwright setup | done | agents | Playwright smoke suite + **blocking** CI job |
| [x] | P0-04 | P0 | Complete CORS allowlist + upload SVG harden | done | agents | Nest cors.util + nginx; multer/nginx block SVG; docs attachment |

---

## Phase 2 — ~30 days: Trusted money cycle

| Done | ID | Severity | Item | Status | Owner | Notes |
|------|----|----------|------|--------|-------|-------|
| [x] | P2-01 | P0 | Payment attempt idempotency; Webhook inbox (unique consumers) | done | agents | PaymentAttempt + Idempotency-Key; WebhookEvent inbox; outbox still pending |
| [x] | P2-02 | P0 | Reconciliation job | done | agents | Hourly PaymentReconciliationService (stale attempts + mismatch logs; no auto-capture) |
| [x] | P2-03 | P0 | Invoice entity/sequence; real PDF | done | agents | Invoice + yearly sequence lock; minimal PDF writer; HTML invoice removed |
| [x] | P2-04 | P0/P1 | TOTP + API key scopes | done | agents | TotpService + login challenge; migration 015 api_keys/audit_logs; scopes assert on create |
| [x] | P2-05 | P0/P1 | Dependency updates critical/high | done | agents | Removed unused xlsx; FE swiper→14.1 (crit fixed); audit fix. Remaining highs: sharp/postcss-via-next/webpack-via-cli (no safe non-breaking fix) |
| [x] | P2-06 | P0 | CI Postgres/Redis + security regression blocking | done | agents | CI services + test:security + tsc gate@0 + Playwright smoke **blocking** |

---

## Production readiness checklist (audit §11)

Do not lift NO-GO until all are true:

- [ ] Zero unexcepted critical/high in runtime/container
- [x] Backend typecheck gate green (error budget 0 on `tsconfig.typecheck.json`; burn down `@ts-nocheck`)
- [ ] Frontend typecheck/lint/unit/integration/E2E fully green (Playwright smoke now blocking)
- [ ] Migrations from empty DB and from previous version succeed
- [ ] Concurrency/idempotency tests for payment, inventory, invoices green
- [x] Reset password path works (selector+verifier); revoke-all via Redis
- [x] XSS invoice/barcode/JSON-LD hardened (regression suite still needed)
- [x] SSRF B2B webhook URL policy (full suite still needed)
- [ ] Payment reconciliation in sandbox; webhook retry/replay proven
- [ ] Load test vs p75/p95
- [ ] Backup restore drill; monitoring/runbooks
- [ ] Legal review; no false PCI/SOC2/ISO claims
