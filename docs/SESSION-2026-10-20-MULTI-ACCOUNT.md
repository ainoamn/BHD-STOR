# سجل جلسة — 20 أكتوبر 2026: تعدد الحسابات من رأس المتجر

> **المستودع:** https://github.com/ainoamn/BHD-STOR  
> **الوثائق:** [`BHD-SESSION-POLICY.md`](./BHD-SESSION-POLICY.md) · [`BHD-APP-SWITCHER.md`](./BHD-APP-SWITCHER.md) · UNIFIED §0.2  
> **النشر:** Vercel `bhdstor` → https://bhdstor.bhd-om.com

---

## السلوك المطلوب

1. ادخل بالحساب الأول.
2. من الرأس → «إضافة حساب» وادخل بالثاني (`id.bhd-om.com/login?add=1`).
3. التبديل من قائمة الحسابات في الرأس **دون كلمة مرور** (`POST /api/auth/switch` ثم `start` صامت).
4. المعرّف الظاهر: **البريد أولاً**، وإلا اسم المستخدم، وإلا الهاتف — ليس الاسم وحده.
5. شارات المصدر بجانب كل حساب: `G` جوجل · `f` فيسبوك · `WA` واتساب · `●` تسجيل عادي.

---

## ما نُفّذ في المتجر

| ملف | التغيير |
|---|---|
| `frontend/src/lib/bhd/apps.ts` | نسخ حرفي من ONE-BHD (`workspacePath`، BHD R، `launchUrlForApp`) |
| `frontend/src/components/bhd/BhdAppSwitcher.tsx` | قائمة حسابات + شارات + إضافة + خروج هذا/الكل |
| `frontend/src/components/bhd/BhdAppIcon.tsx` | أيقونة `bhd-r` |
| `frontend/src/lib/bhd/identity-accounts.ts` | عميل CORS: `me` / `switch` / `logout` على `id.bhd-om.com` |
| `frontend/src/app/[locale]/(main)/layout.tsx` | ربط الرأس بالتبديل/الإضافة/الخروج |
| `frontend/src/app/api/auth/bhd/logout/route.ts` | `?local=1` يمسح جلسة المنتج فقط؛ `?all=1` → `end-session?all=1` |
| `frontend/src/styles/globals.css` | أنماط الشارات والقائمة |
| `docs/*` | نسخ السياسة والمشغّل والدليل الموحّد |

بعد التبديل: مسح جلسة المنتج ثم `/api/auth/bhd/start?returnTo=…` (مساحة العمل الافتراضية `/dashboard`).

---

## اختبار قبول

1. حسابان على الهوية → في المتجر تظهر القائمة بالبريد + الشارات.
2. تبديل حساب → بدون نموذج؛ الجلسة للمنتج على `sub` الجديد.
3. إضافة حساب → `/login?add=1` على الهوية.
4. خروج من هذا الحساب → يفعّل الآخر فوراً عبر `start` صامت.
5. خروج من كل الحسابات → `end-session?all=1`.
