# دليل النقل — جهاز تطوير ثانٍ (BHD-STOR)

**آخر مزامنة من Git:** 2026-07-25  
**HEAD على `main`:** f49b06c — تقرير حالة + آخر ميزة `ff25a60`  
**المستودع:** https://github.com/ainoamn/BHD-STOR  

> اقرأ أولاً: [`STATUS-REPORT-2026-07-25.md`](./STATUS-REPORT-2026-07-25.md) ثم هذا الملف + `ROADMAP.md` و`SESSION-2026-07-21.md`.

---

## 1) حقيقة المشروع

- **BHD-STOR** = متجر إلكتروني عماني متعدد البائعين (B2B/B2C/C2C) — **ليس** عقارات.
- المسار المعتمد على Windows: **`C:\dev\bhd-app` فقط** (مسارات عربية في Downloads تكسر Next.js).
- Stack: Next.js 14 + NestJS + TypeORM + PostgreSQL + Redis + Bull.

---

## 2) استنساخ وتشغيل (Checklist)

```bat
git clone https://github.com/ainoamn/BHD-STOR.git C:\dev\bhd-app
cd /d C:\dev\bhd-app
git pull origin main
git log -5 --oneline
```

يجب أن ترى أحدث commit تقريباً: `f49b06c` أو أحدث (تقرير الحالة / `ff25a60`).

### متطلبات

| أداة | ملاحظة |
|------|--------|
| Node **20+** (مستحسن 20 LTS؛ الجهاز السابق كان v22) | `.nvmrc` إن وُجد |
| Docker Desktop | لـ Postgres 16 + Redis 7 |
| Git | فرع `main` فقط للعمل اليومي |

### بيئة محلية (إلزامي قبل smoke)

```bat
cd /d C:\dev\bhd-app
docker compose -f docker-compose.infra.yml up -d
setup-env.bat
node scripts\check-env.mjs
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```

في نافذة أخرى:

```bat
cd /d C:\dev\bhd-app\frontend
npm install
npm run dev
```

| عنوان | استخدام |
|--------|---------|
| http://localhost:3000/ar | الواجهة |
| http://localhost:3001/health | حياة الـ API |
| http://localhost:3001/health/ready | جاهزية Postgres+Redis |
| http://localhost:3001/api/v1 | API (أو عبر proxy `/api/v1` من Next) |

Smoke بعد جاهزية ready:

```bat
cd /d C:\dev\bhd-app
npm run smoke
```

حسابات الـ seed (بعد `npm run seed`): راجع `setup-env.bat` / seeds — غالباً `customer@bhdoman.com` / كما في السكربت.

---

## 3) حالة الجهاز السابق (عند آخر فحص)

| فحص | نتيجة |
|------|--------|
| `main` vs `origin/main` | متزامن · شجرة نظيفة |
| `backend/.env` | **غير موجود** على ذلك الجهاز |
| Postgres `:5432` | مغلق |
| Redis `:6379` | مغلق |
| Docker على PATH | غير متوفر |
| Node | v22.17.1 |

→ كل العمل الأخير كان **كوداً خالصاً** (بناء/أمان/واجهة) بدون smoke حي.

---

## 4) ما اكتمل مؤخراً على `main` (ملخص سريع)

| Commit | ماذا |
|--------|------|
| `ff25a60` | سقف capture · واتساب `/order` بملكية · حد منتجات الباقة |
| `db99bcf` | خطط مدفوعة مغلقة · COD من الطلب · سقف استرداد |
| `d4aa41f` | مبلغ الدفع من الطلب · كوبونات whitelist |
| `2af0611` / `634b0f3` / … | ملكية شحن/دفع · JWT لـ WS · سلسلة P0 أمان |
| أقدم | CSRF · Telr · طلبات/مفضلة · باركود متجر · مسار بيع API |

تقرير مجمّع: [`STATUS-REPORT-2026-07-25.md`](./STATUS-REPORT-2026-07-25.md)  
تفاصيل الجلسة: [`SESSION-2026-07-21.md`](./SESSION-2026-07-21.md)  
حماية: [`SECURITY-AUDIT-2026-07-23.md`](./SECURITY-AUDIT-2026-07-23.md)  
خطة حية: [`../ROADMAP.md`](../ROADMAP.md)

---

## 5) التالي على أي جهاز (أولوية)

1. Docker → infra → `.env` → migrations **حتى 012** → seed → `health/ready` → `npm run smoke`
2. مسار شراء يدوي كامل على DB حقيقي
3. مفاتيح sandbox Stripe/Thawani + اختبار webhook
4. فوترة اشتراك حقيقية بعد اختيار الخطة المدفوعة
5. تنظيف `tsc` backend (البناء الحالي SWC ناجح)

التفاصيل: [`STATUS-REPORT-2026-07-25.md`](./STATUS-REPORT-2026-07-25.md)

**لا تبدأ** HR/CRM/Blockchain/Drone قبل إثبات مسار البيع على DB حقيقي.

---

## 6) أوامر سريعة يومية

```bat
cd /d C:\dev\bhd-app
git pull origin main
npm run build:backend
npm run build:frontend
npm run test:backend
```

اختبارات أمنية مركّزة:

```bat
cd backend
npx jest --testPathPattern="(request-user|assert-production-secrets|roles.guard|csrf.service|telr.service)"
```

---

## 7) قواعد لا تنسَها

- لا تشغّل Next من مجلد عربي.
- لا ترفع `.env` إلى Git.
- `NEXT_PUBLIC_DEMO_MODE=false` عند الاختبار الحقيقي.
- عبارة المستخدم «اكمل وارفع» = نفّذ شريحة P0/P1 تالية + حدّث docs + commit + push `main`.

---

*ملف مخصّص للنقل بين الأجهزة — حدّث التاريخ ورقم الـ HEAD عند كل انتقال جديد.*
