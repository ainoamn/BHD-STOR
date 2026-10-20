# سجل جلسة — 20 أكتوبر 2026: بطاقة الحساب بأسلوب جوجل

> **الوثيقة:** [`BHD-ACCOUNT-SWITCHER.md`](./BHD-ACCOUNT-SWITCHER.md)  
> **المصدر المنشور:** https://id.bhd-om.com/docs/BHD-ACCOUNT-SWITCHER.md · commit هوية `ab8686a`  
> **المتجر:** نُسخ `BhdAppSwitcher` + أنماط CSS حرفياً من ONE-BHD

## الشكل

- الحساب النشط: صورة دائرية 56px + البريد (`dir=ltr`) في صف واحد؛ شارة المصدر على زاوية الصورة.
- حسابات أخرى: صورة 40px + بريد؛ النقر يبدّل فوراً.
- إضافة حساب: دائرة `+` ثم النص.
- الخروج: صفوف نصية أسفل فاصل، بلا أزرار داكنة عريضة.

## ملفات

| ملف | دور |
|---|---|
| `docs/BHD-ACCOUNT-SWITCHER.md` | المواصفة كما هي |
| `frontend/src/components/bhd/BhdAppSwitcher.tsx` | المكوّن من البوابة (+ تمييز المتجر / `admin-entry`) |
| `frontend/src/styles/globals.css` | `.bhd-switcher-face` · `person` · `who` · `account-now/list/foot` |

الربط السابق (me/switch/add/logout) من `SESSION-2026-10-20-MULTI-ACCOUNT.md` يبقى كما هو.

## نشر

- `f43f558` — التنفيذ + المواصفة  
- `9e1b187` — تثبيت HANDOFF  
- `origin/main` محدّث · Vercel مشروع `bhdstor`
