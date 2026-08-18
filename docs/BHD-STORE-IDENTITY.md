# ربط متجر BHD-STOR بهوية BHD (تنفيذ المنتج)

> **المواصفة المجمّدة (لا تُعدَّل قيمها هنا):** [`BHD-IDENTITY-SSO.md`](./BHD-IDENTITY-SSO.md)  
> **مصدر المواصفة:** [ainoamn/ONE-BHD](https://github.com/ainoamn/ONE-BHD/blob/main/docs/BHD-IDENTITY-SSO.md)  
> **عميل المتجر:** `bhd-store`  
> **تاريخ التنفيذ:** 18 أغسطس 2026

هذا الملف يصف **ما نُفّذ في المتجر فقط**. بيانات الطلبات والمحافظ وكلمات المرور المحلية لم تُمس.

---

## الحالة

| بند | الواقع |
|-----|--------|
| بروتوكول | OAuth 2.0 Authorization Code + PKCE S256 + OIDC |
| `client_id` | `bhd-store` |
| جلسة المتجر | كوكيز موجودة: `accessToken` / `refreshToken` / `bhd_session` — **ليست** `bhd_id` |
| الدخول المحلي (بريد + كلمة مرور) | **باقٍ** |
| أدوار بائع/مشرف من الهوية | **ممنوعة** — الحساب الجديد دائماً `customer` |
| زر Google على المتجر | **غير موجود** (جوجل على موقع الهوية فقط) |
| مشاركة قاعدة الهوية | **لا** |
| نسخ كلمات مرور الهوية | **لا** — مستخدم SSO-only يحصل على hash عشوائي محلي غير قابل للاستخدام |
| حكم الإنتاج العام | ما زال **NO-GO** (تدقيق آب 2026) — SSO لا يرفع الحكم |

المُصدِر المجمّد: `https://id.bhd-om.com`.  
حتى يعمل CNAME لـ `id`، استخدم الأصل الحي:

`BHD_IDENTITY_ISSUER=https://one-bhd.vercel.app`

اكتشاف OIDC الحي: `https://one-bhd.vercel.app/.well-known/openid-configuration`  
(العميل `bhd-store` مدرج هناك.)

---

## ماذا يحدث عند الدخول

```text
المستخدم → /auth/login → «الدخول بحساب BHD»
  → GET /api/auth/bhd/start   (Next: PKCE + كوكي bhd_oauth_state، 5 دقائق)
  → https://{ISSUER}/oauth/authorize
  → GET /api/auth/bhd/callback
  → POST Nest /api/v1/auth/bhd/complete  (تبادل الكود + userinfo + upsert)
  → كوكيز جلسة المتجر على منشأ المتجر
```

الخروج: `useLogout` → `/api/auth/bhd/logout` → مسح كوكيز المتجر ثم  
`{ISSUER}/oauth/end-session?client_id=bhd-store&post_logout_redirect_uri={origin}/`

`returnTo` مسار نسبي آمن فقط (`/ar/...`) — لا تحويل مفتوح.

---

## ربط الحساب المحلي (`users.bhd_sub`)

Migration: `backend/src/database/migrations/017-user-bhd-sub.ts`

الترتيب:

1. صف موجود بـ `bhd_sub = id_token.sub` → حدّث الاسم/الصورة/البريد إن أمكن، أصدر JWT المتجر.
2. وإلا بريد **مؤكَّد محلياً** مطابق لبريد الهوية المؤكَّد → اربط `bhd_sub` (لا صف ثانٍ، الطلبات القديمة تبقى).
3. وإلا أنشئ `customer` جديد مع `bhd_sub`.
4. بريد محلي غير مؤكَّد بنفس العنوان → رفض (لا دمج أعمى).
5. لا تحدّي TOTP للمتجر عند مسار SSO (الهوية هي IdP).

---

## متغيرات البيئة

انسخ من `.env.example` — **لا ترفع أسراراً**.

**Frontend (خادم Next فقط ما عدا العلم العام):**

```
BHD_IDENTITY_ISSUER=https://one-bhd.vercel.app
BHD_OAUTH_CLIENT_ID=bhd-store
BHD_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/bhd/callback
NEXT_PUBLIC_BHD_IDENTITY_ENABLED=true
BACKEND_URL=http://localhost:3001
```

إنتاج `https://bhdstor.bhd-om.com` على Vercel **يجب** ضبط:

```
BHD_IDENTITY_ISSUER=https://id.bhd-om.com
BHD_OAUTH_CLIENT_ID=bhd-store
BHD_OAUTH_CLIENT_SECRET=<نفس BHD_OAUTH_CLIENT_SECRET_STORE على one-bhd>
BACKEND_URL=https://<خادم-Nest-العام>
```

بدون `BACKEND_URL` عام، مسار `/api/v1/*` يعيد 404 بعد العودة من الهوية. تشخيص: `https://bhdstor.bhd-om.com/api/auth/bhd/status`

تحقق: `GET /api/auth/bhd/status` (لا يسرّب السر، يعرض هل هو مضبوط).

**Backend (Nest):**

```
BHD_IDENTITY_ISSUER=https://one-bhd.vercel.app
BHD_OAUTH_CLIENT_ID=bhd-store
BHD_OAUTH_CLIENT_SECRET=<نفس قيمة BHD_OAUTH_CLIENT_SECRET_STORE على مشروع one-bhd>
```

لا تنسخ `AUTH_SECRET` ولا `IDENTITY_TOKEN_SECRET` من الهوية.  
إن لم يُضبط `BHD_OAUTH_CLIENT_SECRET_STORE` على الهوية، فهي تشتق سراً من `AUTH_SECRET` ولا يمكن للمتجر إكماله. عيّن السر صراحةً في المكانين.

---

## عناوين مسجّلة في الهوية (ONE-BHD)

على `origin/main` في [ainoamn/ONE-BHD](https://github.com/ainoamn/ONE-BHD) للعميل `bhd-store`:

| النوع | القيمة |
|-------|--------|
| redirect | `https://store.bhd-om.com/api/auth/bhd/callback` |
| redirect | `https://bhd-stor-x7dc.vercel.app/api/auth/bhd/callback` |
| redirect | `http://localhost:3000/api/auth/bhd/callback` |
| redirect | `http://127.0.0.1:3000/api/auth/bhd/callback` |
| post-logout | نفس الأصول مع `/` |

`redirect_uri` مطابقة تامة. أي منشأ معاينة Vercel جديد يحتاج إضافة صريحة في `app/lib/identity/clients.ts` ثم نشر `one-bhd`.

---

## ملفات التنفيذ

| ملف | دور |
|-----|-----|
| `frontend/src/app/api/auth/bhd/start/route.ts` | PKCE + تحويل authorize |
| `frontend/src/app/api/auth/bhd/callback/route.ts` | استلام code → Nest complete |
| `frontend/src/app/api/auth/bhd/logout/route.ts` | مسح جلسة المتجر + end-session |
| `frontend/src/lib/bhd-identity.ts` | PKCE / مسار آمن / كوكي الحالة |
| `backend/src/auth/services/bhd-identity.service.ts` | تبادل الرمز + userinfo |
| `backend/src/auth/auth.service.ts` `loginWithBhdIdentity` | upsert محلي |
| `POST /api/v1/auth/bhd/complete` | إصدار كوكيز المتجر (مسار معفى من CSRF) |

التحقق: بعد تبادل الرمز (TLS + `client_secret`) تُفحص مطالبات `iss` / `aud=bhd-store` / `exp` / `nonce` / `email_verified`، ثم `GET /oauth/userinfo`. توقيع HS256 اختياري عبر `BHD_IDENTITY_TOKEN_SECRET` إن وُفِّر مفتاح منتج مخصص — لا تستخدم سر جلسة الهوية.

---

## اختبار يدوي سريع

1. `npm run migration:run` في `backend` حتى **017**.
2. أسرار العميل متطابقة في الهوية والمتجر.
3. افتح `http://localhost:3000/ar/auth/login` → «الدخول بحساب BHD».
4. أتمم الدخول على الهوية ثم عد للمتجر وجلسة المتجر مضبوطة.
5. الدخول بالبريد المحلي ما زال يعمل لنفس المستخدم المرتبط.
6. الخروج يعود عبر end-session ثم أصل المتجر.

اختبارات وحدة:  
`backend` — `bhd-identity.util.spec.ts` + `auth.service.bhd-identity.spec.ts` + إعفاء CSRF.

---

## ما لم يُغيَّر

لا migrations لجداول `orders` / المدفوعات / المحافظ.  
لا حذف لعمود `password`.  
لا مشاركة كوكي `bhd_id`.  
لا رفع حكم NO-GO.
