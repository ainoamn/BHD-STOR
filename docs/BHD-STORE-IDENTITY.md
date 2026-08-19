# ربط متجر BHD-STOR بهوية BHD (تنفيذ المنتج)

> **المواصفة المجمّدة (لا تُعدَّل قيمها هنا):** [`BHD-IDENTITY-SSO.md`](./BHD-IDENTITY-SSO.md)  
> **مصدر المواصفة:** [ainoamn/ONE-BHD](https://github.com/ainoamn/ONE-BHD/blob/main/docs/BHD-IDENTITY-SSO.md)  
> **عميل المتجر:** `bhd-store`  
> **نطاق الإنتاج:** `https://bhdstor.bhd-om.com`  
> **تاريخ التنفيذ:** 18 أغسطس 2026

هذا الملف يصف **ما نُفّذ في المتجر فقط**. بيانات الطلبات والمحافظ وكلمات المرور المحلية لم تُمس.

---

## الحالة

| بند | الواقع |
|-----|--------|
| بروتوكول | OAuth 2.0 Authorization Code + PKCE S256 + OIDC |
| `client_id` | `bhd-store` |
| شاشة الدخول الافتراضية | تحويل فوري إلى بوابة الهوية `id.bhd-om.com/login` (نفس شكل وازن والبوابة) — المواصفة §6.6 |
| نموذج البريد المحلي | **باقٍ** على `/ar/auth/login?local=1` فقط (موظفون / طوارئ) |
| جلسة المتجر | كوكيز موجودة: `accessToken` / `refreshToken` / `bhd_session` — **ليست** `bhd_id` |
| أدوار بائع/مشرف من الهوية | **ممنوعة** — الحساب الجديد دائماً `customer` |
| زر Google على المتجر | **غير موجود** (جوجل على موقع الهوية فقط) |
| مشاركة قاعدة الهوية | **لا** |
| نسخ كلمات مرور الهوية | **لا** — مستخدم SSO-only يحصل على hash عشوائي محلي غير قابل للاستخدام |
| حكم الإنتاج العام | ما زال **NO-GO** (تدقيق آب 2026) — SSO لا يرفع الحكم |
| تحقق حي 19 أغسطس 2026 | GitHub `main` = `4b5a8d3` · `/ar/auth/login` → شاشة الهوية · `?local=1` بطاقة المتجر · `GET /api/auth/bhd/status` يعمل · Nest `/api/v1` على أصل المتجر **404** |

المُصدِر المجمّد: `https://id.bhd-om.com`.  
اكتشاف OIDC: `https://id.bhd-om.com/.well-known/openid-configuration`  
(احتياطي حتى يستقر CNAME: `https://one-bhd.vercel.app/.well-known/openid-configuration`)

لماذا كانت شاشة المتجر مختلفة: `/auth/login` كانت بطاقة سوق محلية. المواقع الأخرى غلاف يحوّل إلى الهوية. من commit `98c401f` المتجر يفعل ذلك أيضاً.

---

## ماذا يحدث عند الدخول

```text
المستخدم → /ar/auth/login
  → تحويل خادم إلى GET /api/auth/bhd/start   (Next: PKCE + كوكي bhd_oauth_state، 5 دقائق)
  → https://id.bhd-om.com/oauth/authorize
  → شاشة الهوية الموحّدة (قسمان، شعار BHD، جوجل إن فُعّل هناك)
  → GET /api/auth/bhd/callback
  → تبادل الرمز على Next: POST {ISSUER}/oauth/token (PKCE S256)
  → محاولة Nest POST /api/v1/auth/bhd/complete  (upsert bhd_sub)
  → إن تعذّر Nest (404 / غير منشور على نفس الأصل): جلسة منتج على Next
  → كوكيز المتجر على منشأ المتجر + كوكي قصيرة bhd_sso_profile
```

الاستثناء: `/ar/auth/login?local=1` يعرض نموذج البريد وكلمة المرور المحلية دون تحويل.

الخروج: `useLogout` → `/api/auth/bhd/logout` → مسح كوكيز المتجر ثم  
`{ISSUER}/oauth/end-session?client_id=bhd-store&post_logout_redirect_uri={origin}/`

`returnTo` مسار نسبي آمن فقط (`/ar/...`) — لا تحويل مفتوح.

تشخيص بلا أسرار: `GET /api/auth/bhd/status`

---

## ربط الحساب المحلي (`users.bhd_sub`)

Migration: `backend/src/database/migrations/017-user-bhd-sub.ts`

الترتيب:

1. صف موجود بـ `bhd_sub = id_token.sub` → حدّث الاسم/الصورة/البريد إن أمكن، أصدر JWT المتجر.
2. وإلا بريد **مؤكَّد محلياً** مطابق لبريد الهوية المؤكَّد → اربط `bhd_sub` (لا صف ثانٍ، الطلبات القديمة تبقى).
3. وإلا أنشئ `customer` جديد مع `bhd_sub`.
4. بريد محلي غير مؤكَّد بنفس العنوان → رفض (لا دمج أعمى).
5. لا تحدّي TOTP للمتجر عند مسار SSO (الهوية هي IdP).

إن كان Nest غير متاح على الإنتاج، جلسة Next تعتمد ملف الهوية دون upsert محلي. الطلبات/المحافظ الكاملة تحتاج `BACKEND_URL` عام + migration 017.

---

## متغيرات البيئة

انسخ من `.env.example` — **لا ترفع أسراراً**.

**Frontend (خادم Next فقط ما عدا العلم العام):**

```
BHD_IDENTITY_ISSUER=https://id.bhd-om.com
BHD_OAUTH_CLIENT_ID=bhd-store
BHD_OAUTH_CLIENT_SECRET=
NEXT_PUBLIC_BHD_IDENTITY_ENABLED=true
BACKEND_URL=http://localhost:3001
```

لا تضبط `BHD_OAUTH_REDIRECT_URI` على localhost في إنتاج Vercel؛ مسار `start` يستخدم منشأ الطلب.

إنتاج `https://bhdstor.bhd-om.com` على Vercel:

```
BHD_IDENTITY_ISSUER=https://id.bhd-om.com
BHD_OAUTH_CLIENT_ID=bhd-store
BHD_OAUTH_CLIENT_SECRET=<اختياري إن بقيت الهوية تقبل PKCE دون سر؛ وإلا نفس BHD_OAUTH_CLIENT_SECRET_STORE>
BACKEND_URL=https://<خادم-Nest-العام>
```

إن بقي `BACKEND_URL` فارغاً أو `localhost` على Vercel، `/api/v1/*` على أصل المتجر يعطي 404. مسار SSO يكتمل على Next (كوكيز منتج) حتى يُنشر Nest.

**Backend (Nest):**

```
BHD_IDENTITY_ISSUER=https://id.bhd-om.com
BHD_OAUTH_CLIENT_ID=bhd-store
BHD_OAUTH_CLIENT_SECRET=<نفس قيمة BHD_OAUTH_CLIENT_SECRET_STORE على مشروع one-bhd إن لزم>
```

لا تنسخ `AUTH_SECRET` ولا `IDENTITY_TOKEN_SECRET` من الهوية.  
لا تضبط `Domain=.bhd-om.com` على كوكيز المتجر (host-only، ليست `bhd_id`).

---

## عناوين مسجّلة في الهوية (ONE-BHD)

على `origin/main` في [ainoamn/ONE-BHD](https://github.com/ainoamn/ONE-BHD) للعميل `bhd-store` (مطابقة تامة):

| النوع | القيمة |
|-------|--------|
| redirect | `https://bhdstor.bhd-om.com/api/auth/bhd/callback` |
| redirect | `https://bhd-stor-x7dc.vercel.app/api/auth/bhd/callback` |
| redirect | `http://localhost:3000/api/auth/bhd/callback` |
| redirect | `http://127.0.0.1:3000/api/auth/bhd/callback` |
| post-logout | نفس الأصول مع `/` |

**ليس** `store.bhd-om.com`. النطاق الرسمي هو `bhdstor.bhd-om.com`.

أي منشأ معاينة Vercel جديد يحتاج إضافة صريحة في سجل عملاء الهوية ثم نشر `one-bhd`.

---

## ملفات التنفيذ

| ملف | دور |
|-----|-----|
| `frontend/src/app/[locale]/(auth)/auth/login/page.tsx` | غلاف خادم: تحويل إلى `/api/auth/bhd/start` إلا `?local=1` |
| `frontend/src/app/[locale]/(auth)/auth/login/LoginForm.tsx` | نموذج البريد المحلي (طوارئ) |
| `frontend/src/app/api/auth/bhd/start/route.ts` | PKCE + تحويل authorize |
| `frontend/src/app/api/auth/bhd/callback/route.ts` | تبادل الكود → Nest complete أو جلسة Next |
| `frontend/src/app/api/auth/bhd/logout/route.ts` | مسح جلسة المتجر + end-session |
| `frontend/src/app/api/auth/bhd/status/route.ts` | تشخيص JSON بلا أسرار |
| `frontend/src/lib/bhd-identity.ts` | PKCE / مسار آمن / كوكي الحالة |
| `backend/src/auth/services/bhd-identity.service.ts` | تبادل الرمز + userinfo |
| `backend/src/auth/auth.service.ts` `loginWithBhdIdentity` | upsert محلي |
| `POST /api/v1/auth/bhd/complete` | إصدار كوكيز المتجر (مسار معفى من CSRF) |
| `frontend/src/components/bhd/BhdAppSwitcher.tsx` | تسع النقاط بعد الجلسة |
| `frontend/src/lib/bhd/apps.ts` | كتالوج التطبيقات المجمّد |

الهوية تقبل عملاء الطرف الأول بـ PKCE حتى بدون `client_secret` (`resolveOAuthClient`) ما دام السجل كذلك. المتجر يبادل الرمز من Next دائماً، ثم يحاول Nest، وإن تعذّر يصدر جلسة منتج على أصل المتجر.

التحقق: بعد تبادل الرمز تُفحص مطالبات `iss` / `aud=bhd-store` / `exp` / `nonce` / `email_verified`. توقيع HS256 اختياري عبر `BHD_IDENTITY_TOKEN_SECRET` إن وُفِّر مفتاح منتج مخصص — لا تستخدم سر جلسة الهوية.

---

## اختبار يدوي سريع

1. `npm run migration:run` في `backend` حتى **017**.
2. أسرار العميل متطابقة في الهوية والمتجر إن لزم السر.
3. افتح `http://localhost:3000/ar/auth/login` → يجب أن تصل إلى شاشة `id.bhd-om.com/login` (ليست بطاقة المتجر).
4. أتمم الدخول على الهوية ثم عد للمتجر وجلسة المتجر مضبوطة.
5. `http://localhost:3000/ar/auth/login?local=1` ما زال يعمل للبريد المحلي.
6. الخروج يعود عبر end-session ثم أصل المتجر.
7. إنتاج: `https://bhdstor.bhd-om.com/ar/auth/login` يفتح شاشة `id.bhd-om.com` (تُحقّق 19 أغسطس 2026).

اختبارات وحدة:  
`backend` — `bhd-identity.util.spec.ts` + `auth.service.bhd-identity.spec.ts` + إعفاء CSRF.

---

## ما لم يُغيَّر

لا migrations لجداول `orders` / المدفوعات / المحافظ.  
لا حذف لعمود `password`.  
لا مشاركة كوكي `bhd_id`.  
لا رفع حكم NO-GO.
