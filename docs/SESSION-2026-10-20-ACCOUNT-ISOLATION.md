# سجل جلسة — 20 أكتوبر 2026: عزل الحساب + أسلوب جوجل

> **الوثيقة (ارفعها لباقي المواقع كما هي):** [`BHD-ACCOUNT-SWITCHER.md`](./BHD-ACCOUNT-SWITCHER.md)  
> **منشور:** https://id.bhd-om.com/docs/BHD-ACCOUNT-SWITCHER.md  
> **المصدر:** ONE-BHD `1bb8e27`

## المشكلة التي حُلّت

- التبديل كان يبقي بيانات الحساب السابق في جلسة المنتج.
- أحياناً فُتح `login?add=1` بالخطأ (مسار الإضافة فقط).
- فتح موقع برابط مباشر لم يربط بالحساب النشط بصمت.
- شارة المصدر كانت داخل الصورة بدل أن تكون بجانب البريد.

## السلوك الآن

| إجراء | النتيجة |
|---|---|
| تبديل حساب | `POST id…/switch` → مسح جلسة المنتج → `start?returnTo=المسار` (بيانات الحساب الجديد فقط) |
| إضافة حساب | فقط زر `+` → `login?add=1&next=/auth/continue?to=…` |
| رابط مباشر لموقع BHD | `BhdSilentSso`: إن اختلفت الهوية عن جلسة المنتج → `start` صامت |
| البطاقة | صورة نظيفة + بريد + شارة G/f/WA بجانب البريد |

## ملفات نسْخ للمنتجات

انسخ من هذا المستودع أو من ONE-BHD:

1. `docs/BHD-ACCOUNT-SWITCHER.md`
2. `BhdAppSwitcher.tsx`
3. `BhdSilentSso.tsx`
4. `lib/identity/client.ts` (`identityFetch` · `applyAccountIsolation` · `addAccountUrl`)
5. `lib/bhd/apps.ts`

`connect-src` يجب أن يشمل `https://id.bhd-om.com`.
