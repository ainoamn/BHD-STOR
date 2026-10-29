# ربط BHD-STOR (frontend) بهوية BHD الحية

> تاريخ التحديث: 29 أكتوبر 2026  
> المصدر: https://id.bhd-om.com

## الملفات التي تغيّرت

| ملف | الغرض |
|-----|--------|
| `frontend/src/app/[locale]/layout.tsx` | `bhd-identity.js` |
| `frontend/next.config.js` | CSP لـ `id.bhd-om.com` |
| `frontend/src/lib/bhd/runtime.ts` | `session.maxAgeSec` من `/api/bhd/runtime` |
| `frontend/src/lib/bhd/session.ts` | واجهة `productSessionMaxAgeSec()` |
| `frontend/src/app/api/auth/bhd/rebind/route.ts` | rebind بالـ Bearer |
| `frontend/src/lib/identity/client.ts` | Bearer + rebind-first isolation |
| `frontend/src/lib/bhd/catalog.ts` + `use-bhd-catalog.ts` | كتالوج حي |
| `frontend/src/components/bhd/BhdSilentSso.tsx` | rebind عند عدم التطابق |
| `frontend/src/app/[locale]/(main)/layout.tsx` | تبديل حساب + فوتر البرامج |
| `frontend/src/components/bhd/BhdAppSwitcher.tsx` | شبكة من الكتالوج |

## متغيرات البيئة

- `BHD_IDENTITY_ISSUER` (افتراضي `https://id.bhd-om.com`)
- `BHD_OAUTH_CLIENT_ID` (افتراضي `bhd-store`)
- `BHD_OAUTH_CLIENT_SECRET` — مطلوب لـ token exchange في الإنتاج
- `JWT_SECRET` / `AUTH_SECRET` — لتوقيع JWT المحلي عند عدم وصول Nest (`mintStoreSessionTokens`)

## كيف تختبر

1. تحميل `bhd-identity.js` و `/api/bhd/runtime` من الشبكة.
2. SSO → cookies `accessToken`/`refreshToken` بمدة runtime.
3. تبديل حساب → `POST /api/auth/bhd/rebind`.
4. فوتر «البرامج» وشبكة التطبيقات من `/api/bhd/catalog`.

## ملاحظة

Rebind يحدّث جلسة Next (cookies). مسار Nest `POST /api/v1/auth/bhd/complete` يُستخدم من callback OIDC؛ عند تشغيل backend كامل يُفضّل ضبط `BACKEND_URL` لاستمرار upsert المستخدم في PostgreSQL.

## تحديث §95 (29 أكتوبر 2026)

إصلاح جذر العزل على الهوية: `POST /api/auth/switch` يكتب `bhd_id` دائماً. هذا المنتج يعتمد `rebind` محلياً بعد التبديل. التفاصيل: `BHD-ACCOUNT-ISOLATION.md`.
