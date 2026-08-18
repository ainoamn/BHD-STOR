# دليل النقل — جهاز تطوير ثانٍ (BHD-STOR)

**آخر مزامنة من Git:** 2026-08-18  
**HEAD على `main`:** بعد دمج `feat/bhd-identity-sso` (SSO عميل `bhd-store`) — راجع `git log -1 --oneline`  
**نقطة كود الإصلاح السابقة:** `bdd414e` — `Merge branch 'fix/p2-nocheck-burn-deps'`  
**المستودع:** https://github.com/ainoamn/BHD-STOR  

> **اقرأ بهذا الترتيب على الجهاز الجديد:**  
> 1) هذا الملف  
> 2) [`BHD-STORE-IDENTITY.md`](./BHD-STORE-IDENTITY.md) إن كان العمل على SSO  
> 3) [`AUDIT-REMEDIATION-TRACKER-2026-08.md`](./AUDIT-REMEDIATION-TRACKER-2026-08.md)  
> 4) [`ENGINEERING-SECURITY-AUDIT-2026-08-11.md`](./ENGINEERING-SECURITY-AUDIT-2026-08-11.md)

---

## 0) قاعدة منع التعارض (مهم جداً)

كل العمل الأخير **مرفوع ومتزامن** على `origin/main`. لا توجد تغييرات محلية غير مُلتزَمة على جهاز المصدر.

على الجهاز الآخر افعل **فقط**:

```bat
cd /d C:\dev\BHD-STOR
git fetch origin
git checkout main
git pull --ff-only origin main
git log -1 --oneline
```

يجب أن ترى أحدث commit على `main` (بعد 2026-08-18 يتضمن BHD Identity SSO).  
نقطة كود الإصلاح الثقيلة تبقى: `bdd414e`.

| افعل | لا تفعل |
|------|---------|
| اعمل من `main` بعد `pull --ff-only` | لا تدمج فروع `fix/p0-*` أو `fix/p1-*` أو `fix/p2-*` يدوياً (مدموجة مسبقاً) |
| فرع جديد لكل مهمة: `git checkout -b fix/...` | لا تعدّل على commit قديم ثم تدفع بـ force |
| انسخ `.env` من الجهاز الأول يدوياً (لا يُرفع إلى Git) | لا ترفع `.env` / أسرار |
| شغّل migrations حتى **017** | لا تفترض أن DB القديم محدّثة |

إذا ظهر divergence:

```bat
git status
git log --oneline --graph --decorate -15
```

فضّل دائماً `main` من GitHub كمصدر حقيقة.

---

## 1) استنساخ نظيف (إن لم يكن المجلد موجوداً)

المسار الموصى به على Windows: **`C:\dev\BHD-STOR`** (تجنب مسارات عربية).

```bat
git clone https://github.com/ainoamn/BHD-STOR.git C:\dev\BHD-STOR
cd /d C:\dev\BHD-STOR
git checkout main
git pull --ff-only origin main
```

### متطلبات

| أداة | ملاحظة |
|------|--------|
| Node **24.x** | موحّد في engines/Docker/CI |
| npm ≥ 10 | |
| Docker Desktop | Postgres 16 + Redis 7 |
| Git | العمل اليومي على `main` |

### تشغيل محلي

```bat
cd /d C:\dev\BHD-STOR
docker compose -f docker-compose.infra.yml up -d
REM انسخ backend/.env و frontend/.env من الجهاز السابق (لا من Git)
cd backend
npm ci
npm run migration:run
npm run start:dev
```

نافذة أخرى:

```bat
cd /d C:\dev\BHD-STOR\frontend
npm ci
npm run dev
```

| عنوان | استخدام |
|--------|---------|
| http://localhost:3000/ar | الواجهة |
| http://localhost:3001/health | حياة API |
| http://localhost:3001/api/v1 | API |

فحوصات سريعة:

```bat
cd /d C:\dev\BHD-STOR\backend
npm run typecheck:gate
npm run test:security
```

```bat
cd /d C:\dev\BHD-STOR\frontend
npm run test:e2e:smoke
```

---

## 2) ماذا أنجزنا (سبتمبر إصلاح التدقيق — آب 2026)

المصدر: تدقيق NO-GO في `ENGINEERING-SECURITY-AUDIT-2026-08-11.md` (حول commit `feb0e49`).

### Phase 0 / أمان إطلاق

| بند | الحالة |
|-----|--------|
| توثيق NO-GO + متتبع إصلاح | تم |
| `PAYMENTS_LIVE_ENABLED` (افتراضي false؛ COD مسموح) | تم |
| تنقيح سجلات متكرر (redaction) | تم |
| CORS allowlist (Nest) + إيقاف عكس Origin في nginx | تم |
| منع رفع/خدمة SVG على origin بجلسات | تم |
| `/health` Docker/CD + Frontend `/api/health` | تم |
| `SECURITY.md` صادق (NO-GO) | تم |

### مسار المال / الطلبات

| بند | الحالة |
|-----|--------|
| إنشاء/إلغاء طلب داخل transaction + قفل مخزون | تم |
| `money.util` (OMR 3dp) على الإجماليات/استرداد/التقاط | تم |
| `PaymentAttempt` + `Idempotency-Key` | تم |
| `WebhookEvent` inbox فريد + mismatch يرمي خطأ | تم |
| Reconciliation ساعية (محاولات قديمة + drift) | تم |
| فواتير: كيان + تسلسل سنوي + PDF | تم (`014`) |
| جداول `api_keys` / `audit_logs` + أعمدة TOTP | تم (`015`) |
| أعمدة منتج featured/sales/deleted | تم (`016`) |
| عمود `users.bhd_sub` لربط BHD Identity | تم (`017`) — لا يمس الطلبات/المحافظ/كلمات المرور |

### مصادقة

| بند | الحالة |
|-----|--------|
| Password reset selector+verifier + Redis revoke | تم |
| TOTP setup/enable/disable + تحدّي login | تم |
| BHD Identity SSO (`client_id=bhd-store`) + بقاء الدخول المحلي | تم — [`BHD-IDENTITY-SSO.md`](./BHD-IDENTITY-SSO.md) |
| API key scopes assert عند الإنشاء | تم (الجداول عبر 015) |

### CI / جودة

| بند | الحالة |
|-----|--------|
| Node 24 موحّد | تم |
| `typecheck:gate` ميزانية **0** عبر `tsconfig.typecheck.json` | تم |
| ESLint غير تفاعلي | تم |
| `test:security` حاجز + Postgres/Redis في CI | تم |
| Playwright smoke **حاجز** | تم |
| `migration-smoke` على Postgres فارغ | تم (إصلاح UUID في seed `006`) |

### Commits رئيسية على `main` (الأحدث أولاً)

| Commit | الموضوع |
|--------|---------|
| `bdd414e` | دمج: typecheck مسار المال + اختبارات idempotency + migration smoke |
| `201560b` | إزالة nocheck عن مسار التجارة؛ hash/مخزون/webhook tests؛ seed logistics UUIDs |
| `6c800ec` / `a259944` | بوابة tsc@0 + Playwright smoke حاجز |
| `18b1b85` | خفض دين tsc 287→122؛ إزالة xlsx؛ swiper 14.1 |
| `1375c97` | TOTP + migration 015 + Playwright scaffolding |
| `374209c` | tsc budget + فواتير PDF + CI أمني |
| `a69cccb` | CORS/SVG + reconciliation |
| `aee766b` | طلبات transaction + PaymentAttempt + WebhookEvent |
| `c7fd271` | Phase 0 أمان أولي (health/Node/auth/XSS/SSRF/…) |

---

## 3) Migrations يجب تشغيلها على DB الجهاز الجديد

من مجلد `backend` بعد ضبط `DB_*` في `.env`:

```bat
npm run migration:run
```

تأكد من وجود (على الأقل):

| # | ملف | الغرض |
|---|-----|--------|
| 013 | `013-payment-attempts-webhook-events.ts` | payment_attempts + webhook_events + unique order_number |
| 014 | `014-invoices.ts` | invoices + invoice_sequences |
| 015 | `015-api-keys-audit-logs-totp.ts` | api_keys + audit_logs + أعمدة 2FA |
| 016 | `016-product-featured-sales.ts` | is_featured / sales_count / deleted_at |
| 017 | `017-user-bhd-sub.ts` | `users.bhd_sub` — ربط BHD Identity فقط |

متغيرات DataSource (`backend/src/data-source.ts`):  
`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`  
(وليست `DATABASE_*`).

---

## 3.1) BHD Identity SSO (المتجر)

التفاصيل التشغيلية: [`BHD-STORE-IDENTITY.md`](./BHD-STORE-IDENTITY.md)  
المواصفة المجمّدة: [`BHD-IDENTITY-SSO.md`](./BHD-IDENTITY-SSO.md)

على الجهاز الجديد بعد `migration:run`:

1. انسخ متغيرات `BHD_IDENTITY_*` / `BHD_OAUTH_*` من `backend/.env.example` و`frontend/.env.example` إلى `.env` المحلي (السر من Vercel `one-bhd`: `BHD_OAUTH_CLIENT_SECRET_STORE`).
2. لا تنسخ `AUTH_SECRET` أو قاعدة الهوية.
3. `NEXT_PUBLIC_BHD_IDENTITY_ENABLED=true` يظهر زر «الدخول بحساب BHD». الدخول بالبريد المحلي يبقى.

سجل العميل على هوية ONE-BHD (`main`) يشمل localhost و`bhd-stor-x7dc.vercel.app` و`store.bhd-om.com`.

---

## 4) من أين نكمل (الأولوية التالية)

الحكم ما زال **NO-GO للإنتاج**. التالي المنطقي:

1. **حرق `@ts-nocheck` المتبقي** خارج مسار المال (admin/logistics/ai/chat/…) — ابحث: `^// @ts-nocheck`
2. **اعتماديات عالية بلا إصلاح آمن:** `sharp` / `postcss` عبر Next / `webpack` عبر CLI — إما قبول مخاطر موثّق أو ترقية Next كبرى بحذر
3. **Sandbox مدفوعات حقيقي:** webhook replay + reconciliation على بيئة staging مع `PAYMENTS_LIVE_ENABLED` مضبوط بحذر
4. **Frontend:** typecheck/lint/unit خضراء بالكامل (smoke موجود وحاجز)
5. **Load test / backup drill / مراجعة قانونية** — من checklist التدقيق §11

**لا تبدأ** ميزات HR/CRM/Blockchain/Drone قبل إثبات مسار شراء على DB حقيقي.

عبارة العمل المعتادة: «اكمل وارفع» = نفّذ الشريحة التالية + حدّث المتتبع + commit + push `main`.

---

## 5) فروع قديمة على remote (لا تعد دمجها)

مدموجة مسبقاً في `main` — اتركها أو احذفها لاحقاً لتفادي اللبس:

- `fix/p0-cors-uploads-recon`
- `fix/p1-tsc-ci-invoice`
- `fix/p1-tsc-smoke-blocking`
- `fix/p2-deps-tsc-debt`
- `fix/p2-totp-apikeys-playwright`
- `fix/p2-nocheck-burn-deps`

---

## 6) ملفات توثيق مرتبطة

| ملف | دور |
|-----|-----|
| [`AUDIT-REMEDIATION-TRACKER-2026-08.md`](./AUDIT-REMEDIATION-TRACKER-2026-08.md) | حالة كل بند إصلاح |
| [`BHD-STORE-IDENTITY.md`](./BHD-STORE-IDENTITY.md) | تنفيذ SSO للمتجر (`bhd-store`) |
| [`BHD-IDENTITY-SSO.md`](./BHD-IDENTITY-SSO.md) | مواصفة الهوية المجمّدة (نسخة من ONE-BHD) |
| [`ENGINEERING-SECURITY-AUDIT-2026-08-11.md`](./ENGINEERING-SECURITY-AUDIT-2026-08-11.md) | تقرير NO-GO الأصلي |
| [`../SECURITY.md`](../SECURITY.md) | سياسة أمان + لافتة NO-GO |
| [`../README.md`](../README.md) | نظرة عامة + صف حالة الجاهزية |

---

## 7) Checklist بدء العمل على الجهاز الآخر

- [ ] `git pull --ff-only origin main` → أحدث `main` (SSO = عمود `bhd_sub` / docs/BHD-STORE-IDENTITY.md)
- [ ] `backend/.env` و `frontend/.env` منسوخان يدوياً
- [ ] Docker: Postgres + Redis يعملان
- [ ] `npm ci` في backend و frontend
- [ ] `npm run migration:run` ناجح حتى **017**
- [ ] `npm run typecheck:gate` → 0 أخطاء
- [ ] `npm run test:security` أخضر
- [ ] فرع جديد للمهمة التالية قبل أي تعديل

---

*حدّث التاريخ ورقم HEAD في أعلى هذا الملف عند كل انتقال جهاز جديد.*
