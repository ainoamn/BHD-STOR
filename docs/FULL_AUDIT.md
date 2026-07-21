# BHD-STOR — تقرير مراجعة هندسية وأمنية

> تاريخ المراجعة: 2026-07-21  
> المستودع: [ainoamn/BHD-STOR](https://github.com/ainoamn/BHD-STOR) @ `main`  
> المصدر: مراجعة محلية كاملة لـ `C:\dev\bhd-app` (وليس قراءة ملفات متفرقة عبر واجهة محدودة)  
> هذا التقرير **لا يدّعي 150 صفحة شكلية** — يركّز على نتائج قابلة للتحقق من الكود.

الخطة التنفيذية المستمرة: [`ROADMAP.md`](./ROADMAP.md)

---

## 1) الخلاصة التنفيذية

| البند | الحكم |
|-------|--------|
| نوع المشروع | سوق عماني متعدد البائعين (Next.js 14 + NestJS + TypeORM + PostgreSQL + Redis) |
| اكتمال البنية كملفات | عالٍ (~30 موديول Backend + لوحات كثيرة) |
| اكتمال مسار التجارة الحقيقي | منخفض — سلة/دفع/طلب غير مكتملين كرحلة منتج |
| الأمان التصميمي | وحدات كثيرة مكتوبة |
| الأمان التشغيلي | ضعيف حتى تُربط الحمايات فعلياً |
| الجاهزية للإطلاق التجاري | **~40–55%** (أقل من ادعاءات README القديمة) |
| مقارنة بأمازون / علي بابا / علي إكسبريس | غير منافس حالياً — أساس قابل للنمو بعد إثبات النواة |

**ChatGPT كان محقاً** أنه يحتاج وصولاً كاملاً للتقرير الجاد. الفرق: هنا تم تنفيذ المراجعة على الشجرة الكاملة محلياً.

---

## 2) البنية التقنية (Architecture)

```
Frontend (Next.js App Router + next-intl RTL)
    ↕ HTTP (/api/v1) + Demo Mode fallback
Backend (NestJS modules)
    ↕ TypeORM
PostgreSQL + Redis (+ Bull queues)
```

**نمط التنظيم:** Modular Monolith (Nest modules) — ليس Microservices ولا Hexagonal مكتمل.

| طبقة | التقنيات | ملاحظة |
|------|----------|--------|
| UI | Next 14, Tailwind, React Query, Zustand | جيد للسوق المحلي |
| API | NestJS, Swagger, ValidationPipe | تصميم جيد؛ حماية غير متسقة |
| ORM | TypeORM | ليس Prisma |
| Queue | Bull (`@nestjs/bull`) | ليس BullMQ |
| Security package | 26 ملفاً | أغلب Guards غير مُسجَّلة عالمياً |
| Extras | AI, WhatsApp, Logistics, HR, CRM, Accounting, Drone, Blockchain | Feature-creep قبل MVP |

---

## 3) الأدوار ولوحات التحكم

### الأدوار (مبعثرة — مشكلة)

| المصدر | الأدوار |
|--------|---------|
| `database/entities/user.entity` | customer, seller, admin, super_admin |
| `users/entities/user.entity` | customer, seller, admin, moderator |
| Frontend `types` | customer, vendor, admin, super_admin |
| Demo auth | customer / admin |

لا يوجد دور `driver` أو `A2B agent` كـ UserRole.

### مصفوفة اللوحات

| الدور | اللوحة | حماية المسار |
|-------|--------|--------------|
| Customer | متجر + `/orders` `/wishlist` | Cookie فقط؛ بيانات غالباً Demo |
| Seller | `/dashboard/store` | فحص عميل `isSellerRole` |
| Admin | `/dashboard/admin/*` | حماية جزئية فقط (بعض الصفحات بلا فحص دور) |
| Logistics UI | `/dashboard/logistics/*` | بلا فحص دور (أي مستخدم مسجّل) |
| B2B portal | `/shipping-portal/*` | مفتاح API (عميل)؛ middleware مفتوح |

**Middleware:** يتحقق من وجود cookie فقط — **لا يفرّق الأدوار**.

### ترابط رحلة الشراء

| الخطوة | الحالة |
|--------|--------|
| الرئيسية / المنتجات | موجودة |
| `/cart` صفحة | **ناقصة** (مكوّن SmartCart معطّل في الـ layout) |
| `/checkout` صفحة | **ناقصة** |
| طلبات العميل | واجهة Demo |
| دفع + Webhook | خدمات موجودة؛ حمايات/تحقق توقيع ناقص |

---

## 4) الثغرات الأمنية (مرتبة)

### Critical

1. **JwtAuthGuard وهمي في Payments/Shipping** كان يعيد `true` دائماً مع `mock-user-id` — **أُصلح** باستيراد الحارس الحقيقي من `auth/guards`.
2. **كثير من Controllers بدون أي Guard** (HR, CRM, Accounting, Audit, Returns, Loyalty…) — أي استدعاء API مكشوف إن وُجد السيرفر.
3. **لا يوجد APP_GUARD عالمي لـ JWT** — الحماية اختيارية لكل مسار؛ الافتراضي مفتوح.
4. **Webhooks دفع**: فشل توقيع PayPal قد يُتجاهل؛ بوابات أخرى بلا تحقق توقيع صارم.

### High

5. **EncryptionService غير مستخدم على PII** — التشفير موجود لكن الهاتف/العناوين plaintext.
6. **ازدواجية UserRole** بين كيانين لنفس جدول `users`.
7. **Account lockout غير مفعّل** رغم وجود الحقول.
8. **Blacklist التوكن عند Logout وهمي** (Redis معلّق).
9. **JWT في localStorage** — عرضة لـ XSS.
10. **Demo Mode** يمنح واجهة Admin بتوكنات ثابتة إن بقي مفعّلاً.

### Medium

11. وحدات CSRF/XSS/RateLimit في Nest **غير مسجّلة كـ APP_GUARD** (helmet + express-rate-limit فقط في main).
12. سياسة كلمة المرور ضعيفة (min 6)؛ JWT access في المثال 7 أيام.
13. رفع ملفات: MIME فقط؛ يسمح بـ SVG.
14. أسرار `NEXT_PUBLIC_*` مفرطة في `.env.example`.
15. WebSocket CORS `origin: '*'` في بعض بوابات اللوجستيات.

---

## 5) التشفير

| المكوّن | الواقع |
|---------|--------|
| كلمات المرور | bcrypt 12 (جيد كبداية) |
| AES-256-GCM | خدمة جاهزة؛ **مطلوب مفتاح في production** (أُصلح سابقاً) |
| استخدام فعلي على البيانات | شبه معدوم |
| توصية | ربط الهاتف/IBAN/أسرار البوابات بـ EncryptionService أو حذف الكود الميت |

---

## 6) كفاءة المتجر والأخطاء التقنية

- الواجهة تعمل في Demo من `C:\dev\bhd-app`؛ مسار عربي → شاشة بيضاء (موثّق في README_RUN).
- تضارب مسارات API كان محتملاً (`/api/api/v1`) — أُصلح إلى `/api/v1`.
- اختبارات مكتوبة لكن غير مثبتة كـ CI أخضر.
- لوحات HR/Accounting/Logistics غالباً mock/`setTimeout`.
- روابط مكسورة: `/cart`, `/checkout`, تفاصيل admin الديناميكية `[id]`.

---

## 7) مقارنة مع Amazon / AliExpress / Alibaba

| المحور | BHD الآن | Amazon | AliExpress | Alibaba (B2B) |
|--------|----------|--------|------------|---------------|
| Multi-vendor | هيكل نعم | ناضج | ناضج | ناضج |
| Search ranking | أساسي/AI مخطّط | عالمي | قوي | RFQ + search |
| Inventory realtime | جزئي | متقدم | متوسط | MOQ/جملة |
| Payments | كود بوابات | ناضج PCI | ناضج | Trade Assurance |
| Logistics | كود داخلي + حاملات | شبكة خاصة | Cainiao | شحن تجاري |
| Fraud / trust | ضعيف | متقدم | متوسط | قوي B2B |
| Scale | جهاز واحد/monolith | عالمي | عالمي | عالمي |
| AI recommendations | خدمات موجودة | رائد | جيد | متوسط |
| Mobile apps | scaffolding | أصلي ناضج | ناضج | ناضج |

**نقاط قوة BHD النسبية:** هوية عمانية، RTL، عملات خليجية، طموح لوجستي محلي، مرونة اشتراك/عمولة في التصميم.

**نقاط ضعف حاسمة:** مسار شراء غير مكتمل، أمان غير مفعّل بالكامل، Demo يخفي الفجوات، نطاق متضخم.

---

## 8) خطة الترقية (مرتبة)

### P0 (1–2 أسابيع) — قبل أي ميزة جديدة
1. APP_GUARD JWT عالمي + `@Public()` للمسارات العامة.
2. حماية كل Controllers الحساسة (HR/CRM/Accounting/Audit…).
3. توحيد User entity + الأدوار.
4. صفحات `/cart` و `/checkout` + تفعيل SmartCart.
5. `npm run build` أخضر للطرفين.
6. Webhooks: فشل التوقيع = رفض.
7. تعطيل Demo في أي build إنتاجي.

### P1 (2–4 أسابيع) — مسار بيع واحد حقيقي
حساب → متجر → منتج → سلة → طلب → Stripe test → شحنة → فاتورة.

### P2 (شهر+) — ما قبل الإطلاق
صلاحيات دقيقة، مراقبة، نسخ احتياطي، سياسة إرجاع، SEO، اختبار حمل، httpOnly cookies، تفعيل Encryption على PII.

### لاحقاً فقط (Feature flags)
HR, CRM, Accounting كامل، Blockchain، Drone، تطبيقات iOS/سائق كاملة.

---

## 9) التقييم النهائي

المشروع **أساس هندسي طموح** لمنصة عمانية، لكنه **ليس منافساً تشغيلياً** لأمازون/علي بابا اليوم. أكبر فجوة ليست «نقص الصفحات» بل **عدم إثبات النواة التجارية مع أمان حقيقي وقاعدة بيانات حية**.

نسبة جاهزية تقديرية للإطلاق التجاري الآمن: **~45%**.  
نسبة اكتمال الهيكل/الملفات: **~80–90%**.

---

*أُنشئ آلياً من مراجعة مستودع كامل — راجع أيضاً canvas `bhd-full-audit` في Cursor.*
