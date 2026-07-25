# تقرير حالة BHD-STOR — 2026-07-25

> **الغرض:** جواب صريح: ماذا أُنجز؟ ماذا تبقّى؟ كيف نطوّر النظام من هنا؟  
> **المستودع:** https://github.com/ainoamn/BHD-STOR  
> **فرع العمل:** `main`  
> **HEAD عند كتابة التقرير:** `f49b06c` (آخر ميزة كود: `ff25a60`)  
> **المسار المعتمد:** `C:\dev\bhd-app` فقط  

الخطة الحية: [`../ROADMAP.md`](../ROADMAP.md) · دليل جهاز ثانٍ: [`HANDOFF-SECOND-PC.md`](./HANDOFF-SECOND-PC.md) · سجل الجلسة: [`SESSION-2026-07-21.md`](./SESSION-2026-07-21.md)

---

## 1) الخلاصة التنفيذية

| السؤال | الجواب |
|--------|--------|
| هل المنصة «جاهزة إنتاج 100%»؟ | **لا.** هيكل قوي + مسار بيع مكتوب في الكود + طبقات أمان كثيرة، لكن **لم يُثبت بعد** على PostgreSQL/Redis حي (smoke). |
| أين نحن تقريباً؟ | نواة تجارة إلكترونية **~55–65%** جاهزية تشغيلية · حماية تصميمية **مرتفعة بعد سلسلة P0** · تكاملات sandbox **معلّقة على مفاتيح + بيئة**. |
| ماذا كان محور الأسابيع الأخيرة؟ | إغلاق ثغرات **ملكية / مبالغ / أدوار** (IDOR، underpay، خطط مجانية مزوّرة) قبل تضخيم HR/CRM/Blockchain. |
| أكبر عائق الآن؟ | **بيئة محلية:** Docker + Postgres + Redis + `.env` + migrations + `npm run smoke`. بدونها لا يوجد إثبات مسار بيع حقيقي. |

---

## 2) ما الذي تم إنجازه (مجمّع)

### 2.1 نواة التجارة (واجهة + API)

| البند | الحالة |
|-------|--------|
| سلة `/cart` + دفع `/checkout` + `SmartCart` | ✅ |
| طلب حي: checkout → `POST /orders` → دفع (COD/بوابات) | ✅ في الكود |
| صفحات طلبات عميل `/orders` + `/orders/[id]` | ✅ |
| مفضلة حية + طلبات التاجر بـ `storeId` | ✅ |
| منتجات تاجر: إنشاء/تعديل من اللوحة | ✅ |
| متسلسل متجر + باركود/QR + `/ar/s/{serial}` + طباعة ملصق | ✅ |
| باقات البائع الأربعة + اختيار اشتراك أو نسبة عمولة | ✅ (تفعيل مدفوع مقفول بدون دفع/أدمن) |
| تفعيل/إيقاف بوابات الدفع وشركات الشحن من الأدمن | ✅ |
| عمولة عند `order.paid` / `order.created` | ✅ في الكود |
| شحنة لوجستية تلقائية من أحداث الطلب | ✅ في الكود |
| كوبون على السلة (تطبيق/إزالة) + whitelist خادم | ✅ |
| JWT HttpOnly cookies + proxy `/api/v1` من Next | ✅ |
| Feature flags للأنظمة الموسّعة (افتراضي off) | ✅ |
| بناء Frontend (`next build`) و Backend (SWC) | ✅ |
| `GET /health` + `/health/ready` (Postgres/Redis) | ✅ |
| سكربتات `check:env` / `smoke` / `test:security` | ✅ |

### 2.2 الأمان والحماية (سلسلة P0/P1 المغلقة)

كل بند أدناه مُغلق في الكود ومغطى جزئياً بـ `npm run test:security` (~91 اختباراً عند آخر تشغيل).

| المجال | ما أُغلق |
|--------|----------|
| حراس عالميون | `JwtAuthGuard` + `RolesGuard` + `CsrfGuard` + `@Public()` للمسارات العامة فقط |
| أسرار إنتاج | `ENCRYPTION_MASTER_KEY` و`assertProductionSecrets` fail-closed |
| Demo Mode | معطّل في production + رفض بناء Next إن فُعّل |
| ملكية طلب/دفع/مرتجع/منتج/رفع/فاتورة/شحن | فحوصات ownership قبل القراءة/التعديل |
| مبالغ مالية | دفع من `order.total` · استرداد بسقف · capture Telr بسقف · COD من الطلب |
| اشتراكات | خطط مدفوعة لا تُفعَّل ذاتياً · عمولة نسبة ≥ 5% · حد منتجات الباقة عند الإنشاء |
| كوبونات | whitelist فقط (لا رموز ترحيب مفتوحة) |
| Webhooks | Stripe/PayPal/Thawani/Telr/Oman Net/واتساب: توقيع أو fail-closed |
| WebSockets | Chat / واتساب / GPS / logistics: JWT؛ لا ثقة بـ `bhd_session` وحده في middleware |
| واتساب `/order` | كشف التفاصيل فقط لصاحب الطلب (userId أو هاتف مطابق) · `simulate` للـ staff |
| أدوار | `isStaffRole` / `roleSatisfies` · قفل مسارات ولاء/عمولات/تحليلات متقدمة |
| Rate limit | Redis مع fallback ذاكرة · مستوى WEBHOOK |

### 2.3 آخر دفعات كود بارزة (أحدث أولاً)

| Commit | الموضوع |
|--------|---------|
| `ff25a60` | سقف capture Telr · ملكية واتساب `/order` · حد منتجات الباقة |
| `db99bcf` | إغلاق خطط مدفوعة مجانية · COD من الطلب · سقف استرداد |
| `d4aa41f` | مبلغ الدفع من الطلب · كوبونات whitelist · GPS للـ staff |
| `2af0611` | ربط شحنات الناقل بالطلب · ملكية capture/verify |
| `634b0f3` | JWT لـ WhatsApp/GPS WS · رفض session وحده |
| `c413613` | ملكية منتجات + نطاقات API keys |
| `3dbf385` | رفع/Blockchain/توقيع واتساب |
| …سلسلة أقدم | CSRF · Telr · IDOR حالة طلب · مرتجعات · Chat WS · Analytics · إلخ |

التفاصيل اليومية: [`SESSION-2026-07-21.md`](./SESSION-2026-07-21.md).

---

## 3) ما الذي تبقّى للعمل (مرتّب بالأولوية)

### المرحلة A — إثبات التشغيل (P0 تشغيلي · الآن)

بدون هذه الخطوة يبقى كل شيء «نظرياً صحيحاً» وغير مُثبت.

1. تثبيت **Docker Desktop** وإتاحته على PATH  
2. `docker compose -f docker-compose.infra.yml up -d` (Postgres 16 + Redis 7)  
3. `setup-env.bat` أو نسخ `.env.example` → `backend/.env` و`frontend/.env.local`  
4. `node scripts/check-env.mjs`  
5. Backend: `npm install` → `migration:run` (حتى **012**) → `seed` → `start:dev`  
6. Frontend: `npm install` → `dev`  
7. تحقق: `http://localhost:3001/health/ready` ثم من الجذر `npm run smoke`  
8. مسار يدوي: تسجيل/دخول → متجر → منتج → سلة → طلب → COD أو بوابة تجريبية → ظهور شحنة/عمولة

**حالة آخر جهاز تطوير فُحص:** لا Docker · لا `backend/.env` · منافذ 5432/6379 مغلقة → smoke لم يُشغَّل.

### المرحلة B — أموال وتكاملات حقيقية (P1)

| بند | الوضع | المطلوب |
|-----|--------|---------|
| Stripe / Thawani sandbox | كود + fail-closed | مفاتيح حقيقية + اختبار webhook end-to-end |
| فوترة اشتراك مدفوع | تفعيل عبر staff فقط | جلسة دفع بعد `choose` ثم `paymentConfirmed` من webhook فقط |
| شركات الشحن sandbox | محاكٍ موثّق / fail-closed | مفاتيح Oman Post أو Aramex عند التوفر |
| ربط حساب واتساب ↔ userId | جزئي (جلسة/هاتف) | ربط صريح للعميل عند أول محادثة |

### المرحلة C — جودة هندسية (P1/P2)

| بند | ملاحظة |
|-----|--------|
| تنظيف `tsc` الصارم للـ backend | البناء الحالي SWC ناجح؛ أخطاء أنواع متبقية في لوجستيات/أدمن |
| توسيع اختبارات التكامل/E2E | بعد نجاح smoke |
| مراقبة أخطاء (Sentry أو ما يعادله) | قبل Beta عام |
| توحيد bcrypt/argon2 | دين تقني غير حرج للإطلاق التجريبي |

### المرحلة D — لوجستيات داخلية (بعد إثبات البيع)

- GPS/خرائط حقيقية بدل محاكاة حيث يلزم  
- تطبيق سائق على جهاز حقيقي  
- إثبات تسليم (OTP/صورة) + تسعير مناطق  
- بوابة B2B للشحن (API + فوترة)

### المرحلة E — ما بعد النواة (لا يبدأ الآن)

Accounting · HR · CRM · MLM · Gamification كامل · Blockchain · Drone · تطبيقات موبايل كاملة · توسع خليجي  

هذه الأنظمة **موجودة كملفات** ومقفلة بـ `FEATURE_*=false`. تفعيلها قبل مسار البيع الحي = تضخيم نطاق خاطئ.

---

## 4) كيف سنطوّر النظام من الآن؟

### 4.1 مبدأ العمل (ثابت)

1. **نواة المتجر أولاً** — بيع واحد كامل على DB حقيقي قبل أي وحدة موسّعة.  
2. **أمان مبالغ وملكية قبل الميزات** — أي مبلغ أو مورد يمر عبر خادم؛ لا ثقة بجسم الطلب.  
3. **كود خالص يمكن دفعه بدون Docker** عند الحاجة، لكن **لا ندّعي جاهزية إنتاج** قبل smoke.  
4. مسار Windows الوحيد: **`C:\dev\bhd-app`** (مسارات عربية تكسر Next).  
5. فرع يومي: **`main`** · مستودع: `ainoamn/BHD-STOR`.  
6. عند «تابع واكمل وارفع»: أغلق أعلى P0/P1 تجارة/أمان → حدّث docs → commit + push.

### 4.2 إيقاع مقترح (أسابيع)

```
الأسبوع الحالي     → المرحلة A: Docker + migrations + seed + smoke + مسار يدوي
الأسبوع التالي     → المرحلة B: Stripe/Thawani sandbox + webhook واحد حي
الأسبوع 3          → فوترة اشتراك حقيقية + مراجعة حدود الباقة على UI
الأسابيع 4–6       → المرحلة D لوجستيات داخلية (بعد بيع مستقر)
بعد Beta داخلي     → المرحلة E انتقائياً حسب حاجة العمل
```

### 4.3 تعريف «جاهز لـ Beta داخلي»

- [ ] `health/ready` أخضر محلياً وعلى بيئة تجريبية  
- [ ] `npm run smoke` ناجح  
- [ ] مسار شراء يدوي كامل (عميل + تاجر + أدمن يشاهد الطلب/الدفع)  
- [ ] بوابة دفع واحدة sandbox + webhook موقّع يحدّث الطلب  
- [ ] Demo Mode = false في تلك البيئة  
- [ ] نسخ احتياطي DB مجدول على بيئة Beta  

### 4.4 مخاطر يجب مراقبتها

| خطر | تخفيف |
|-----|--------|
| تشغيل من Downloads/مسار عربي | الالتزام بـ `C:\dev\bhd-app` |
| تفعيل FEATURE_* مبكراً | تبقى false حتى استقرار النواة |
| مفاتيح في Git | `.env` محلي فقط · `setup-env` / `check-env` |
| افتراض «الكود = يعمل» | smoke + مسار يدوي إلزامي |

---

## 5) خريطة جاهزية سريعة

| الطبقة | تقدير |
|--------|--------|
| هيكل الكود / الصفحات | ~75–85% |
| مسار البيع في الكود + حماية مبالغ/ملكية | ~70–80% |
| إثبات تشغيل على DB/Redis | ~0–10% (لم يُشغَّل smoke على الجهاز الأخير) |
| تكاملات دفع/شحن بمفاتيح حقيقية | ~20–40% (كود موجود · sandbox معلّق) |
| لوجستيات داخلية كمنتج | ~40–50% هيكل · اختبار ميداني ضعيف |
| HR/CRM/Blockchain كمنتج | هيكل فقط · خارج الأولوية |

**المجموع التشغيلي الصادق للإطلاق العام:** غير جاهز.  
**المجموع لبدء Beta داخلي بعد المرحلة A+B:** واقعي خلال أسابيع قليلة إذا توفرت البيئة والمفاتيح.

---

## 6) أوامر سريعة للمزامنة والمتابعة

```bat
cd /d C:\dev\bhd-app
git pull origin main
git log -5 --oneline

docker compose -f docker-compose.infra.yml up -d
setup-env.bat
node scripts\check-env.mjs

cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev

REM نافذة أخرى
cd /d C:\dev\bhd-app\frontend
npm install
npm run dev

cd /d C:\dev\bhd-app
npm run smoke
```

اختبارات أمان بدون بنية تحتية:

```bat
cd /d C:\dev\bhd-app\backend
npm run test:security
```

---

## 7) روابط

| مورد | رابط |
|------|------|
| المستودع | https://github.com/ainoamn/BHD-STOR |
| ROADMAP | https://github.com/ainoamn/BHD-STOR/blob/main/ROADMAP.md |
| هذا التقرير | https://github.com/ainoamn/BHD-STOR/blob/main/docs/STATUS-REPORT-2026-07-25.md |
| HANDOFF | https://github.com/ainoamn/BHD-STOR/blob/main/docs/HANDOFF-SECOND-PC.md |
| SESSION | https://github.com/ainoamn/BHD-STOR/blob/main/docs/SESSION-2026-07-21.md |
| تدقيق الحماية | https://github.com/ainoamn/BHD-STOR/blob/main/docs/SECURITY-AUDIT-2026-07-23.md |

---

*كُتب 2026-07-25 بعد مزامنة `main` عند `f49b06c`. أي تقدم لاحق يُحدَّث في ROADMAP + هذا الملف أو SESSION.*
