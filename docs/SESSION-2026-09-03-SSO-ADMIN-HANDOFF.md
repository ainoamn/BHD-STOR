# سجل جلسة — استكمال SSO/أدمن المتجر (آب–أيلول 2026)

> **المستودع:** https://github.com/ainoamn/BHD-STOR  
> **المرجع الحي للهوية:** https://github.com/ainoamn/ONE-BHD  
> **الغرض من هذا الملف:** نقل سياق المحادثة إلى الجهاز الثاني عبر Git — اقرأ ثم `git pull` ثم أكمل.  
> **محادثة Cursor (محلية على الجهاز الأول):** `agent-transcripts/27db8506-1ef3-4b83-aea8-6f9ba50026b4` — الملخص أدناه هو ما يُرفع إلى Git.

---

## 1) الخلاصة التقنية المعتمدة (لا تُحرَّف)

| الطبقة | ماذا تفعل | أين |
|---|---|---|
| الهوية | من أنت (حساب واحد) | `id.bhd-om.com` فقط |
| جلسة التنقّل | كوكي `bhd_id` → SSO بلا كلمة مرور | `start` → `authorize` → `callback` |
| صلاحية الأدمن | ماذا يحق لك داخل **هذا** المنتج | جدول `users.role` مربوط بـ `bhd_sub` |

**ممنوع:** مفتاح «أدمن كل المواقع» من الهوية.  
**مسموح:** نفس البريد أدمن في المتجر فقط إن عُيّن محلياً؛ في نَسَب/وازن يبقى مستخدماً عادياً ما لم يُعيَّن هناك أيضاً.  
أدمن منصة الهوية (`BHD_PLATFORM_ADMIN_EMAILS`) يخص `/admin` على الهوية فقط.

المصادر:

- [`BHD-PRODUCT-SSO-ADMIN.md`](./BHD-PRODUCT-SSO-ADMIN.md)
- [`BHD-UNIFIED-LOGIN-AND-APPS.md`](./BHD-UNIFIED-LOGIN-AND-APPS.md) — §0.7 و§4.9 و§12.6

---

## 2) ما نُفّذ في هذه المحادثة (على `main`)

### SSO + غلاف الدخول

- `GET /api/auth/bhd/start` → 302 إلى `https://id.bhd-om.com/oauth/authorize` (`client_id=bhd-store`)
- `GET /api/auth/bhd/callback` → تبادل الكود على الخادم + upsert على `bhd_sub`
- `GET /api/auth/bhd/logout` → مسح جلسة المنتج (بما فيها `bhd_sso_profile`) ثم `end-session`
- `/auth/login` و`/auth/register` → الهوية إلا طوارئ `?local=1` (بدون Google محلي للمستخدم النهائي)

### أدمن المنتج (§0.7 / §4.9)

- `GET /api/auth/admin-entry` → `start?returnTo=/dashboard/admin`
- أي مسار إدارة من login أو **middleware** (بلا جلسة) → `admin-entry` — ليس `?local=1`
- فوتر + مشغّل التطبيقات: «دخول الإدارة» → `admin-entry`
- Nest `decideBhdUserMatch` / `loginWithBhdIdentity`: ربط أدمن قديم بالبريد، **الإبقاء على الدور المحلي**، لا منح أدمن من الهوية؛ الموظفون يُربطون حتى لو `emailVerified` المحلي false
- migration **017** = `users.bhd_sub`

### هوية بصرية / جلسة / فوتر (الدليل الموحّد)

- IBM Plex Sans Arabic + ألوان البوابة (`#092d24` / `#fbfaf7`…)
- خمول منزلق 48 ساعة: `SESSION_IDLE_MAX_AGE_SEC` + `SessionKeepAlive` + `/api/auth/session/keepalive`
- فوتر «برامجنا» من الكتالوج المجمد + روابط عن الشركة / هوية الشركة على `www.bhd-om.com`
- `apps.ts` مزامَن من ONE-BHD (`store` و`nasab` و`office` = `sso` حيث ينطبق)

### توثيق

- نسخ الدليلين من ONE-BHD وتعليم قائمة PRODUCT للمتجر
- تحديث §12.6 في الدليل الموحّد (Gate middleware + تاريخ 23 أغسطس 2026)

---

## 3) Commits مرجعية على BHD-STOR `main`

| SHA | الموضوع |
|-----|---------|
| `36327e3` | Gate الأدمن عبر middleware/`admin-entry` + مزامنة docs/كتالوج |
| `1b31537` | `admin-entry` + الإبقاء على أدوار الموظفين المحليين |
| `37a0a88` | هوية بصرية + خمول 48 ساعة + فوتر برامجنا |
| `4587da6` | اتباع الدليل الموحّد على المتجر |
| `1451c06` | مشغّل التطبيقات بعد SSO |

نشر حي: مشروع Vercel **`bhdstor`** → `https://bhdstor.bhd-om.com`  
تحقق سابق: `/ar/dashboard/admin` (بلا جلسة) → `/api/auth/admin-entry?next=/dashboard/admin` → `start?returnTo=/dashboard/admin`.

---

## 4) لماذا كانت المشاكل تظهر (للتشخيص على الجهاز الثاني)

| العرض | السبب | الإصلاح |
|---|---|---|
| لوحة تسجيل قديمة | دخول محلي | غلاف → `/api/auth/bhd/start` |
| الانتقال يطلب دخولاً | لا `bhd_id` أو بلا `start`/`callback` أو `mode=browse` | مسار SSO كامل؛ الكتالوج `mode=sso` للمتجر |
| أدمن «غير موجود» | صف محلي بلا `bhd_sub` أو صف جديد بلا دور | ربط بالبريد في complete مع الإبقاء على الدور |

---

## 5) ما تبقّى / انتبه قبل المتابعة

1. **إنتاج Nest:** اضبط `BACKEND_URL` على Vercel إلى API عام شغّال، وشغّل migrations حتى **017** — بدونها ربط `bhd_sub` للأدمن لا يكتمل (يبقى fallback Next للمتسوق).
2. **NO-GO** للتدقيق الأمني ما زال قائماً — SSO لا يرفعه.
3. مشروع Vercel المكرر `bhd-stor-x7dc` إن بقي مربوطاً بـ Git: افصله/احذفه؛ النطاق الحي على **`bhdstor`** فقط.
4. لا ترفع `.env` / أسرار. انسخها يدوياً بين الأجهزة.
5. لا توحّد أدمن كل المنتجات في مفتاح هوية واحد.

---

## 6) أوامر الجهاز الثاني (ابدأ من هنا)

```bat
cd /d C:\dev\BHD-STOR
git fetch origin
git checkout main
git pull --ff-only origin main
git log -1 --oneline
```

يجب أن ترى commit توثيق هذه الجلسة أو أحدث `main` بعده، ومن التاريخ على الأقل `36327e3`.

ثم اقرأ بالترتيب:

1. [`HANDOFF-SECOND-PC.md`](./HANDOFF-SECOND-PC.md)
2. هذا الملف
3. [`BHD-PRODUCT-SSO-ADMIN.md`](./BHD-PRODUCT-SSO-ADMIN.md)
4. [`BHD-UNIFIED-LOGIN-AND-APPS.md`](./BHD-UNIFIED-LOGIN-AND-APPS.md) §0.7 و§4.9 و§12.6

للهوية/الكتالوج إن لزم:

```bat
cd /d C:\dev\ONE-BHD
git pull --ff-only origin main
```

---

## 7) اختبار قبول سريع بعد السحب

1. `GET https://bhdstor.bhd-om.com/api/auth/bhd/start` → 302 إلى `id.bhd-om.com`
2. بلا جلسة: `/ar/dashboard/admin` → `admin-entry`
3. مستخدم جديد عبر الهوية → صف بـ `bhd_sub` (يتطلب Nest + 017)
4. أدمن قديم بنفس البريد → يبقى `admin` بعد أول SSO
5. خروج موحّد → يطلب دخولاً من جديد عبر الهوية
