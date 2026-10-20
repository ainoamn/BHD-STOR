# سجل جلسة — 20 أكتوبر 2026: تبديل بلا وميض + قفز لمساحة العمل

> **الوثيقة:** [`BHD-ACCOUNT-SWITCHER.md`](./BHD-ACCOUNT-SWITCHER.md) §5  
> **المصدر:** https://id.bhd-om.com/docs/BHD-ACCOUNT-SWITCHER.md · ONE-BHD `5715351`  
> **المتجر:** `BhdAppSwitcher` + `lib/bhd/apps.ts` منسوخان؛ الميدلوير → `start` فقط بلا جلسة

## السلوك

| إجراء | قبل | بعد |
|---|---|---|
| تبديل حساب | `reload`/`start` فوراً | تحديث الرأس من JSON فوراً؛ إن اختلف `sub` → hop واحد إلى `/dashboard` |
| فتح تطبيق آخر | غالباً `…/api/auth/bhd/start` | `{origin}{workspacePath}` (`launchUrlForApp`) |
| زيارة محمية بلا جلسة | `/auth/login` ثم start | `302` مباشرة إلى `/api/auth/bhd/start?returnTo=…` |
| تسخين | مسارات المتجر فقط | + `preconnect` لأصول التطبيقات و`prefetch` عند فتح الشبكة |

## ملفات

| ملف | دور |
|---|---|
| `docs/BHD-ACCOUNT-SWITCHER.md` | المواصفة كاملة (§5 إلزامي) |
| `docs/BHD-APP-SWITCHER.md` | إطلاق = مساحة العمل |
| `frontend/src/lib/bhd/apps.ts` | `workspaceUrlForApp` · `hopOrigins` · `launchUrlForApp` |
| `frontend/src/components/bhd/BhdAppSwitcher.tsx` | hop + prefetch + router.push نفس المنشأ |
| `frontend/src/lib/bhd/identity-accounts.ts` | switch/logout يعيدان JSON كامل |
| `frontend/src/app/[locale]/(main)/layout.tsx` | تحديث فوري + rebind إلى workspace |
| `frontend/src/middleware.ts` | محمي بلا جلسة → `start` |
| `frontend/src/components/NavigationWarmup.tsx` | preconnect `hopOrigins` |

الربط السابق (me/switch/add) من `SESSION-2026-10-20-MULTI-ACCOUNT.md` وبطاقة الصورة من `SESSION-2026-10-20-ACCOUNT-CARD.md` يبقيان.
