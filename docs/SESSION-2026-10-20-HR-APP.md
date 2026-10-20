# سجل جلسة — 20 أكتوبر 2026: إضافة الموارد البشرية للمشغّل

> **الوثيقة:** [`BHD-APP-SWITCHER.md`](./BHD-APP-SWITCHER.md) §4.1  
> **منشور:** https://id.bhd-om.com/docs/BHD-APP-SWITCHER.md  
> **المصدر:** ONE-BHD `e51dc10` / `777fd7f`

## المنفَّذ

نسخ حرفي:

| ملف | دور |
|---|---|
| `docs/BHD-APP-SWITCHER.md` | القسم 4.1 — الموارد البشرية |
| `frontend/src/lib/bhd/apps.ts` | عنصر `hr` → `https://hr.bhd-om.com` |
| `frontend/src/components/bhd/BhdAppIcon.tsx` | أيقونة `hr` / `bhd-hr` |

يظهر تلقائياً في: مشغّل التسع نقاط · فوتر «برامجنا» (يقرأ من `BHD_APPS`).
