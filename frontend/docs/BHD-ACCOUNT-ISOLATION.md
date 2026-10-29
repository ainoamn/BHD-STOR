# عزل بيانات الحساب بعد التبديل (خصوصية — نموذج جوجل)

> **الحالة:** إلزامي لكل منتج مرتبط بـ `https://id.bhd-om.com`.  
> **تاريخ:** 29 أكتوبر 2026 — محاذاة مع BHD-HR-live.  
> **لوحة الربط:** https://id.bhd-om.com/admin#connect  
> **النموذج:** مثل جوجل `authuser` — كل تبويب مربوط بحساب عبر `?au=<sub>`.

---

## القاعدة (نموذج جوجل)

### ربط التبويب (`?au=<sub>`)
1. بعد التبديل: `?au=<bhdSub>&_bhd=<ts>` مرة واحدة ثم يُزال `_bhd` بهدوء (`history.replaceState`).
2. `sessionStorage`: خريطة `bhd_account_tokens[sub]` + `bhd_active_au`.
3. عند التطابق: لا ملاحظة ولا حجاب — الصفحة تعمل مباشرة.
4. عند الانحراف (تبويب آخر): `POST /api/auth/bhd/rebind` بصيغة JSON صامتة بلا شاشة ولا نص.

### التبديل (فقط عند اختيار حساب)
1. غطاء فارغ بلا نص (لا «جاري عزل…»).
2. `POST /api/auth/switch` مع `X-BHD-Persist-Cookie: 1`.
3. ثم form `rebind` لإعادة تحميل كاملة (عزل React state 100%).

### نوافذ متعددة
`BhdSilentSso` يصلح بهدوء كل ~20ث أو عند الظهور — بلا وميض وبلا ملاحظات.

مرجع التطبيق: `src/lib/identity/client.ts` + `BhdPrivacyGate` + `BhdSilentSso`.

---

## ملفات هذا التطبيق (BHD-STOR frontend)

- `src/lib/identity/window-session.ts`
- `src/lib/identity/client.ts`
- `src/components/bhd/BhdSilentSso.tsx`
- `src/components/bhd/BhdPrivacyGate.tsx`
- `src/components/bhd/BhdStoreAccountIsolation.tsx`
- `src/app/api/auth/bhd/rebind/route.ts`
- `src/app/[locale]/(main)/layout.tsx`
