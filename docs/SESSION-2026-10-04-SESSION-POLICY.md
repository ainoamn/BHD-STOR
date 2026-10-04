# سجل جلسة — 4 أكتوبر 2026: تطبيق سياسة الجلسة BHD على المتجر

> **المستودع:** https://github.com/ainoamn/BHD-STOR  
> **الوثيقة المطبّقة:** [`BHD-SESSION-POLICY.md`](./BHD-SESSION-POLICY.md) (المصدر: `ainoamn/ONE-BHD` → `docs/BHD-SESSION-POLICY.md`)  
> **Commit الكود:** `5a27b26` — `feat(auth): keep store session until explicit sign-out per BHD session policy`  
> **النشر:** Vercel مشروع `bhdstor` → https://bhdstor.bhd-om.com

---

## 1) القاعدة التي طُبّقت

المستخدم يبقى مسجّل الدخول **حتى يضغط «خروج»**.  
الخمول، إغلاق التبويب، إغلاق المتصفح، أو إعادة تشغيل الجهاز **لا تُسقط الجلسة** ولا تُحدّث الصفحة ولا تستدعي جوجل.

هذا يلغي القاعدة السابقة (خمول منزلق 48 ساعة + `SessionKeepAlive`) التي كانت في الدليل الموحّد §0.2.

---

## 2) ما الذي تغيّر في الكود

### الخادم (NestJS)

| الملف | التغيير |
|---|---|
| `backend/src/auth/utils/session-policy.ts` (جديد) | ثابت `PRODUCT_SESSION_MAX_AGE = '400d'` (و`_SEC` و`_MS`) |
| `backend/src/auth/auth.service.ts` | توكن الدخول والتحديث يُوقَّعان بمدة 400 يوم (كانت 15 دقيقة / 7 أيام من البيئة) |
| `backend/src/auth/auth.module.ts` | `JwtModule.signOptions.expiresIn` = 400 يوم |
| `backend/src/auth/utils/auth-cookies.ts` | كوكيز `accessToken` و`refreshToken` و`bhd_session` بمدة 400 يوم، و`SameSite=Lax` (كانت `None` في الإنتاج) |
| `backend/.env.example` | ملاحظة: `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` لم يعد لهما تأثير |
| `backend/src/auth/services/bhd-identity.service.ts` | إصلاح خطأ أنواع قديم (منذ `51088ab`) كان يُفشل `typecheck:gate` — `issuer` كـ tuple غير فارغ |

### الواجهة (Next.js)

| الملف | التغيير |
|---|---|
| `frontend/src/lib/bhd/session.ts` | `SESSION_IDLE_MAX_AGE_SEC` (48 ساعة) → `SESSION_MAX_AGE_SEC` (400 يوم) |
| `frontend/src/lib/bhd-identity.ts` | JWT المُصدَر على Next (مسار احتياطي حين يتعذّر Nest) بمدة `exp` = 400 يوم |
| `frontend/src/app/api/auth/bhd/callback/route.ts` | كوكيز الجلسة بمدة 400 يوم |
| `frontend/src/components/auth/SessionKeepAlive.tsx` | **حُذف** |
| `frontend/src/app/api/auth/session/keepalive/route.ts` | **حُذف** (يعيد الآن 404 على الموقع الحي) |
| `frontend/src/app/[locale]/layout.tsx` | إزالة تركيب `SessionKeepAlive` |
| `frontend/src/hooks/useAuth.ts` | `refetchOnWindowFocus: false` و`refetchOnReconnect: false` لاستعلام المستخدم |
| `frontend/src/services/api.ts` | فشل `/auth/me` لا يُخرج المستخدم ولا يمسح بياناته؛ انتهاء جلسة المتجر → `GET /api/auth/bhd/start` صامت بدل شاشة الدخول |
| `frontend/src/lib/auth-storage.ts` | كوكي العلامة `bhd_session` بمدة 400 يوم (كانت 7 أيام) |
| `frontend/src/components/NavigationWarmup.tsx` | إزالة `/auth/login` من التسخين المسبق |
| `frontend/src/components/pwa/ServiceWorkerRegistration.tsx` | لا فحص تحديث عند عودة التبويب؛ لا إعادة تحميل إلا بعد ضغطة «تحديث» |

---

## 3) مطابقة بنود الوثيقة

| بند `BHD-SESSION-POLICY.md` | الحالة في المتجر |
|---|---|
| لا مهلة خمول | ✅ 400 يوم ثابتة |
| لا `SessionKeepAlive` / نبضات `focus` `visibilitychange` `pointerdown` | ✅ حُذف |
| لا تجديد كوكي في قراءة الجلسة | ✅ لا مسار يجدّد الكوكي أثناء الاستخدام؛ `/me` لا يُعاد جلبه عند التركيز |
| لا `router.refresh()` / `location.reload()` تلقائي | ✅ Service Worker مقيّد بضغطة المستخدم |
| لا Google One Tap / `auto_select` | ✅ المتجر لا يستدعي جوجل أصلاً |
| لا تسخين لصفحة الدخول | ✅ |
| مدة كوكي المنتج = JWT `exp` | ✅ 400 يوم في Next وNest |
| HttpOnly / Secure في الإنتاج / Lax / Host-only | ✅ (الـ API عبر rewrite على نفس الأصل `/api/v1`) |
| جلسة منتهية + `bhd_id` قائمة → `start` صامت | ✅ |
| الخروج الوحيد = زر «خروج» → `end-session` | ✅ (كما كان) |

---

## 4) التحقق

- `backend`: `npm run typecheck:gate` → **0 أخطاء**؛ اختبارات المصادقة **38/38** نجحت.
- `frontend`: `tsc --noEmit` نجح.
- الموقع الحي بعد النشر:
  - `/api/auth/session/keepalive` → **404**
  - `/api/auth/bhd/start` → 307 إلى `id.bhd-om.com/oauth/authorize?client_id=bhd-store…`
  - `/ar/dashboard/admin` بلا جلسة → 307 إلى `/api/auth/admin-entry?next=/dashboard/admin`

### لم يُختبر بعد (يدوياً في المتصفح)

1. ادخل ← أغلق التبويب ساعة ← افتح: ما زلت داخلاً بلا وميض.
2. أغلق المتصفح كلياً ثم افتحه: داخل.
3. اضغط «خروج»: تُطلب شاشة الدخول لاحقاً.
4. من منتج آخر والجلسة قائمة: تنقّل صامت.

---

## 5) التوثيق المحدَّث

- `docs/BHD-SESSION-POLICY.md` — نسخة من ONE-BHD.
- `docs/BHD-UNIFIED-LOGIN-AND-APPS.md` — مزامَن من ONE-BHD (§0.2 الجديد + §12.6 للمتجر).
- ONE-BHD §12.6 — سطر «جلسة المنتج» محدَّث (وصل ضمن `e1bad4c`).
- `docs/SESSION-2026-09-03-SSO-ADMIN-HANDOFF.md` — شُطب سطر الـ 48 ساعة.

---

## 6) ملاحظات للمتابعة

- أي قيمة `JWT_EXPIRES_IN` في بيئة Nest الإنتاجية لن تقصّر الجلسة بعد الآن.
- إن نُقل الـ API إلى نطاق مختلف الموقع (cross-site) فيجب إبقاؤه خلف rewrite على نفس الأصل، لأن الكوكيز الآن `SameSite=Lax`.
- ما زال قائماً من قبل: `BACKEND_URL` على Vercel لـ Nest عام + migration `017`؛ وحكم **NO-GO** للتدقيق الأمني.
