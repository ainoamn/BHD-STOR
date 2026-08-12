# تقرير المراجعة الهندسية والأمنية لمشروع BHD-STOR

> **Documented into repo:** 2026-08-12  
> **Commit reference at time of audit:** `feb0e4919f8e85f6138481dec1e5c85c1bc4d8c5`  
> **Status:** ACCEPTED as authoritative **NO-GO** production gate until P0 closure

**المستودع:** [ainoamn/BHD-STOR](https://github.com/ainoamn/BHD-STOR)  
**مرجع المراجعة:** الفرع `main`، الالتزام `feb0e4919f8e85f6138481dec1e5c85c1bc4d8c5` بتاريخ 11 أغسطس 2026  
**تاريخ التقرير:** 11 أغسطس 2026  
**نوع المراجعة:** مراجعة كود ثابتة، تشغيل بناء واختبارات محلية، تدقيق اعتماديات، وفحص إعدادات التشغيل. ليست اختبار اختراق للإنتاج ولا شهادة امتثال.

## 1. الخلاصة التنفيذية

المشروع منصة سوق إلكتروني عمانية متعددة البائعين، واسعة النطاق، مبنية أساساً بـ Next.js وNestJS وPostgreSQL وRedis. يوجد قدر جيد من العمل في الواجهة، إدارة المتاجر والمنتجات والطلبات، اللوجستيات، الدفع، الترجمة العربية/الإنجليزية، وبعض طبقات الأمان. كما أن README يصرّح بوضوح بأن المشروع «هيكل احترافي واسع وليس منتج إنتاج مكتمل»؛ وهذا الوصف صادق.

**قرار الإطلاق الحالي: NO-GO للإنتاج العام أو لمعالجة أموال حقيقية.** يمكن استخدامه كبيئة تطوير أو Beta داخلية مع بيانات تجريبية فقط بعد إصلاح مسار التشغيل الأساسي. أسباب المنع ليست تحسينات تجميلية، بل تشمل دورة دفع غير مكتملة، غياب idempotency، سباقات في الطلبات والمخزون، إعادة تعيين كلمة مرور غير عاملة، إلغاء جلسات وهمي، اختبارات Integration/E2E معطلة، هجرات لا يمكن تشغيلها بالأمر الموثق، وفجوة كبيرة بين نجاح بناء SWC وسلامة TypeScript الفعلية.

أبرز النتائج المثبتة:

1. بناء Backend وFrontend ينجح، لكن `npx tsc --noEmit` في Backend يُظهر **292 خطأ TypeScript** لأن SWC مضبوط على `typeCheck: false` وTypeScript على `strict: false`.
2. اختبارات Backend الافتراضية تمر: **29 حزمة و101 اختبار**، لكنها اختبارات وحدوية ضيقة. اختبارات Backend E2E وFrontend Jest وPlaywright لا تعمل.
3. بناء Frontend ينتج **439 kB JavaScript مشتركاً لكل الصفحات**، منها **383 kB** في `vendors`؛ وهذا مانع مباشر لهدف «سرعة البرق» على الهواتف والشبكات الضعيفة.
4. تدقيق الاعتماديات الإنتاجية أظهر **38 تنبيهاً في Backend** و**8 في Frontend**: المجموع 46، منها 2 حرجة و24 عالية.
5. بدء الدفع يستدعي بوابات خارجية لكنه لا ينشئ أو يحفظ سجل `Payment`، ولا توجد مفاتيح idempotency أو سجل Webhook فريد.
6. أخطاء تطبيق Webhook على الطلب تُبتلع ثم قد تُعاد استجابة 200؛ وهذا يمكن أن يفقد تحديث دفع نهائياً ويمنع إعادة المحاولة من البوابة.
7. استعادة كلمة المرور مكسورة منطقياً: يُخزن bcrypt hash ثم يُبحث عنه بمساواة مباشرة مع النص الخام، ولا يُرسل البريد فعلياً. إلغاء refresh tokens والـ blacklist مجرد تعليقات ترجع دائماً أن الرمز غير ملغى.
8. توجد نقاط XSS في HTML الفاتورة، طباعة باركود المتجر، وJSON-LD. ولا توجد وحدات POS أو مطعم في المستودع حتى يمكن التحقق منها.
9. يوجد SSRF مؤكد في Webhook اللوجستيات B2B: يقبل أي URL صالح شكلياً ثم ينفذ `fetch` إليه. حقل `apiEndpoint` لبوابات الدفع موجود دون سياسة URL، لكنه ليس موصولاً حالياً بمسار إدارة يسمح بتعديله.
10. Docker health checks تشير إلى مسارات خاطئة، وأمر `migration:run` يفشل بسبب غياب `--dataSource` وعدم وجود ملف DataSource؛ كما تنقص migrations لجداول `api_keys` و`audit_logs`.
11. وثيقة `SECURITY.md` تبالغ في الحالة وتضع كثيراً من بنود OWASP على أنها مكتملة رغم أن الكود يناقض ذلك. هذا بحد ذاته خطر تشغيلي وتدقيقي.

## 2. نطاق المراجعة وما تم تشغيله

تمت مراجعة أحدث نسخة من `main`، وعدد الملفات المتتبعة 1030 ملفاً تقريباً: 630 ملف TypeScript، و255 TSX، و38 Swift، و31 Markdown. يحتوي Backend على نحو 55 Controller و109 Service و75 Entity و12 Migration. أكبر خدمة هي `backend/src/payments/services/payments.service.ts` بحوالي 1492 سطراً، تليها خدمات تكامل ولوجستيات وواتساب كبيرة.

### نتائج التشغيل الفعلي

| الفحص | النتيجة | الملاحظة |
|---|---:|---|
| `backend: npm run build` | ✅ | SWC جمع نحو 515 ملفاً، لكنه لا يفحص الأنواع |
| `backend: npm test -- --runInBand` | ✅ | 29 suites، و101 tests |
| `backend: npx tsc --noEmit` | ❌ | 292 خطأ TypeScript، منها أخطاء في admin/payments/entities/modules |
| `backend: npm run lint` | ❌ | لا يوجد ESLint config |
| `backend: npm run test:e2e` | ❌ | مفتاح Jest خاطئ `setupFilesAfterSetup` ومسارات `src/modules/...` قديمة |
| `backend: npm run migration:run` | ❌ | `Missing required argument: dataSource` |
| `frontend: npm run type-check` | ✅ | فحص TypeScript يمر |
| `frontend: npm run build` | ✅ | Next.js 14.2.35؛ 439 kB shared JS، وfallback في sitemap |
| `frontend: npm run lint` | ❌ | Next يطلب إنشاء إعداد ESLint تفاعلياً |
| `frontend: npm test` | ❌ | لا يوجد Jest config/transform مناسب، وتختلط ملفات Playwright و`.next` مع Jest |
| `frontend: npm run test:e2e -- --list` | ❌ | `e2e/global-setup` و`global-teardown` غير موجودين |
| `npm audit --omit=dev` | ❌ | Backend: 38، Frontend: 8 تنبيهات |
| Smoke مع PostgreSQL/Redis | لم يُنفذ | Docker engine غير متاح في بيئة المراجعة ولا توجد خدمات على 5432/6379 |

لا توجد Issues أو Pull Requests مفتوحة وقت الفحص، لكن غياب التذاكر لا يعني غياب الأعطال؛ كثير من المشكلات غير ممثلة في tracker.

تم فحص الشجرة الحالية بأنماط شائعة للمفاتيح الخاصة وStripe/AWS/GitHub/Slack/Google ولم تظهر قيمة سرية واضحة متتبعة. هذا **ليس** بديلاً عن Gitleaks كامل للتاريخ، ولا عن GitHub Secret Scanning، ولا يثبت أن الأسرار لم توجد تاريخياً.

## 3. كيف يعمل البرنامج

### التدفق العام

1. المستخدم يدخل واجهة Next.js App Router المترجمة إلى العربية والإنجليزية مع RTL/LTR.
2. الواجهة تستخدم React Query وZustand وتتصل بـNestJS من خلال `/api/v1` أو rewrite من Next/Nginx.
3. NestJS يطبق JWT guard وRoles guard عالمياً، مع `@Public()` للمسارات العامة، ثم ValidationPipe وinterceptors.
4. TypeORM يصل إلى PostgreSQL للبيانات الأساسية، وRedis يُستخدم لبعض التخزين المؤقت والـrate limiting وBull queues.
5. وحدات المتجر الأساسية هي المستخدمون، المتاجر، المنتجات، السلة، الطلبات، الدفع، الشحن، الاشتراكات، العمولة، الإرجاع، المحادثة، والإشعارات.
6. توجد وحدات أوسع للوجستيات وB2B وHR وCRM والمحاسبة والذكاء الاصطناعي وواتساب والطائرات والبلوك تشين، لكن عدة أجزاء منها scaffolding أو demo وليست ناضجة تشغيلياً.
7. يُفترض أن Nginx يعمل أمام Next وNest، مع Docker Compose وGitHub Actions للنشر.

### مسار الشراء الحالي

ينشئ Backend الطلب من بيانات المنتجات المخزنة على الخادم، ويتحقق من المخزون ويحسب الإجمالي والضريبة والشحن، ثم ينقص المخزون ويحفظ الطلب. عند اختيار بوابة دفع، يستدعي Backend البوابة ويعيد redirect URL أو client secret. بعد ذلك تستقبل نقطة Webhook إشعار البوابة، تتحقق من التوقيع في أغلب البوابات، وتحدث `paymentStatus` للطلب وتطلق events للوجستيات.

التصميم النظري صحيح، لكن التنفيذ الحالي لا يلف إنشاء الطلب وإنقاص المخزون في transaction، ولا يحفظ محاولة الدفع، ولا يمنع إعادة الطلب أو Webhook المكرر، ولا يربط event واحداً بتحديث واحد. لذلك لا يمكن اعتبار الدورة المالية موثوقة بعد.

## 4. التقنيات واللغات

| الطبقة | التقنية |
|---|---|
| لغة الويب والخادم | TypeScript 5 / JavaScript |
| Frontend | Next.js 14، React 18، App Router، Tailwind CSS، React Query، Zustand، Radix UI، next-intl |
| Backend | NestJS 10، Express، TypeORM 0.3، Bull، Socket.IO |
| البيانات | PostgreSQL 16، Redis 7 |
| الدفع | Stripe، PayPal، Oman Net، Thawani، Telr، CCAvenue، COD |
| التخزين والوسائط | S3/Cloudinary ورفع محلي |
| الذكاء الاصطناعي | OpenAI/LangChain وبعض حزم Anthropic/Google |
| التشغيل | Docker، Docker Compose، Nginx، GitHub Actions، Vercel config |
| تطبيقات إضافية | Swift/iOS وmobile scaffolds |

يوجد تضارب إصدارات واضح: الجذر وFrontend و`.nvmrc` يطلبون Node 24، Backend يطلب `>=20`، CI يستخدم Node 20، وDocker يستخدم Node 18. يجب اختيار إصدار واحد؛ الأنسب الآن Node 24 LTS وتثبيته في `.nvmrc` وengines وCI وDocker معاً.

يوجد أيضاً تضارب ترخيص: README يعرض MIT وينص على وجود `LICENSE`، لكن الملف غير موجود، وBackend/Frontend يحملان `UNLICENSED`، وSwagger يعلن Proprietary. يلزم قرار قانوني واحد وتطبيقه على المستودع والحزم والوثائق.

## 5. الإيجابيات

- تقسيم مبدئي جيد إلى وحدات NestJS وكيانات TypeORM، مع مساحة واضحة للتوسع.
- التحقق العالمي من JWT وRoles أساس جيد، مع نهج default-authenticated واستثناءات `@Public()`.
- التحقق من ملكية الطلب والدفع موجود في عدة مسارات، ومبلغ بدء الدفع يُشتق من `order.total` بدلاً من الثقة بالعميل.
- تحقق توقيعات Stripe/PayPal/Thawani/Telr/Oman Net وواتساب يميل إلى fail-closed في production، وهو اتجاه صحيح.
- توجد اختبارات وحدوية مركزة لملكية الموارد، الأدوار، مبالغ الدفع والاسترداد، وتوقيعات Webhooks.
- واجهة عربية/إنجليزية، `lang` و`dir` ديناميكيان، وNext Image يدعم WebP/AVIF مع cache جيد للصور.
- Docker متعدد المراحل ويستخدم مستخدماً غير root، وتوجد liveness/readiness endpoints في Backend.
- README صريح نسبياً بشأن عدم الجاهزية للإنتاج.
- توجد قاعدة توثيق واسعة ومراجعات سابقة، ويمكن تحويلها إلى توثيق تشغيلي جيد بعد إزالة التناقضات.

## 6. مصفوفة التحقق من البنود المطلوبة

الرموز: ✅ مستوفى، ⚠️ جزئي، ❌ غير مستوفى، N/A غير موجود في المشروع الحالي.

| البند | الحالة | الحكم المختصر |
|---|---:|---|
| منع تسرب الأسرار إلى سجلات التدقيق مع regression tests | ❌ | redaction سطحي، query/params/url بلا تنقية، تسريبات صريحة، AuditInterceptor غير عالمي، ولا اختبارات regression |
| فرض صلاحيات الوحدات والأدوار مركزياً على جميع APIs | ⚠️ | JWT وRoles عالميان، لكن permissions غير مستخدمة، وملكية الموارد ad hoc، وأدوار لوجستية غير موجودة في UserRole |
| إغلاق XSS في الفواتير وPOS والمطعم | ❌ / N/A | XSS في فاتورة وطباعة المتجر وJSON-LD؛ POS والمطعم غير موجودين |
| إصلاح تكرار الدفعات وسباقات Webhook وإضافة idempotency | ❌ | لا payment attempt محفوظة، لا idempotency key، لا WebhookEvent فريد، لا transaction/lock/outbox |
| تقليل بيانات روابط الفواتير العامة | N/A | لا يوجد public invoice link؛ تنزيل الفاتورة الحالي authenticated. يلزم تصميم آمن قبل إنشاء الرابط |
| إغلاق SSRF في إعدادات بوابات الدفع | ⚠️ | لا يوجد مسار حالي لتعديل `apiEndpoint`، لكنه غير محمي بسياسة URL. ويوجد SSRF مؤكد في B2B webhooks |
| تغيير/استعادة كلمة المرور وإلغاء الجلسات القديمة | ❌ | reset مكسور، لا بريد، لا change-password، وإلغاء refresh tokens stub |
| حماية CSRF وتشديد TOTP وAPI Keys | ⚠️ | CSRF عالمي لكن به bypass/Origin flaws؛ TOTP غير مطبق؛ API Keys scaffolding غير موصول بالمصادقة |
| التشفير مع فصل المفاتيح والإصدارات والتدوير | ⚠️ | AES-GCM versioned service موجود، لكنه غير مستخدم، بلا KMS أو فصل purpose keys؛ Auth يستخدم CBC أضعف |
| ترقيم الفواتير المتزامن وDecimal | ❌ | الفاتورة `INV-` من 8 أحرف من UUID، والمال يستخدم JS Number/Math.round |
| عزل الشركات واختبارات cross-tenant | ❌ | لا `tenant_id` أو company context أو RLS؛ الموجود multi-vendor ownership فقط |
| تحديث الاعتماديات والتنبيهات الأمنية | ❌ | 46 تنبيهاً إنتاجياً، وCI يسمح بفشل audit |
| Backend/Frontend/Integration/E2E tests | ❌ | Backend unit فقط يعمل؛ بقية الطبقات معطلة أو غائبة |
| CI/CD وDocker والهجرات والإصدارات | ❌ | إصدارات Node متضاربة، health checks خاطئة، migrations command مكسور، الاختبارات غير blocking |
| CSP ورؤوس الأمان والمرفقات | ❌ | سياسات متعارضة، `unsafe-inline/eval`، CORS يعكس origin، ورفع ملفات same-origin غير آمن |
| Accessibility والواجهة والنصوص والثقة والخصوصية | ❌ | أزرار أيقونات دون أسماء، لا axe، وروابط privacy/terms تشير لصفحات غير موجودة |
| إعادة تنظيم الخدمات الضخمة تدريجياً | ❌ | خدمات 700–1492 سطراً؛ يلزم strangler refactor بعقود واختبارات |
| Country Packs والعملات والترجمة والتوسع الدولي | ⚠️ | عملات وar/en موجودة، لكن عمان/OMR/VAT/العنوان hardcoded ولا توجد Country Pack architecture |
| التوثيق وRunbooks وThreat Model وسياسات التشغيل | ⚠️ | وثائق كثيرة لكنها قديمة ومتعارضة ومبالغة؛ لا Threat Model أو Runbooks تشغيلية مكتملة |

## 7. النتائج الأمنية والتقنية التفصيلية

### 7.1 تسرب الأسرار وسجل التدقيق — P0

`LoggingInterceptor` عالمي في `backend/src/main.ts:135-139`. دالة التنقية في `backend/src/common/interceptors/logging.interceptor.ts:106-133` تنسخ المستوى الأول فقط؛ فلا تنظف أسراراً داخل `payment.card.secret` مثلاً. كما تسجل `request.query` و`request.params` وURL كما هي، ما قد يسرب reset tokens وAPI keys وتوقيعات callbacks إذا مرت في URL.

أمثلة صريحة:

- `backend/src/whatsapp/whatsapp.controller.ts:151` يسجل verify token غير الصحيح نفسه.
- `backend/src/whatsapp/whatsapp.controller.ts:112` يسجل أول 200 حرف من payload الرسالة.
- `backend/src/auth/auth.service.ts:279` يسجل بادئة encrypted reset token.
- `backend/src/notifications/notifications.service.ts:348` يسجل payload كاملاً بـ`JSON.stringify`.
- `AuditInterceptor` يسجل query وparams بلا تنقية في `backend/src/security/audit/audit.interceptor.ts:109-110` و`138-139`، لكنه غير مسجل كـ`APP_INTERCEPTOR` أصلاً.
- لا توجد migration لجداول `api_keys` و`audit_logs` رغم تسجيل كياناتهما في SecurityModule.

**الإصلاح:** بناء مكتبة redaction مركزية recursive، case-insensitive، تعمل على body/query/params/headers/URL/error metadata، والأفضل اعتماد allowlist بدلاً من قائمة حظر فقط. لا تُسجل Authorization/Cookie/API keys/reset tokens/card data أو payloads الكاملة. يسجل audit IDs وحالة/نوع الفعل فقط، مع hash أو suffix عند الحاجة التشخيصية. تسجيل AuditInterceptor عالمياً بعد إنجاز migration، مع queue/append-only storage وصلاحيات قراءة منفصلة.

**اختبارات القبول:** حقن canary secrets في كل مستوى متداخل وفي query/header/error، ثم التقاط جميع مخرجات logger والتأكد أن السلسلة الأصلية لا تظهر. يجب أن تشمل الاختبارات WhatsApp، auth reset، payment webhooks، notifications، audit CSV، وفشل exceptions.

### 7.2 الأدوار والصلاحيات المركزية — P0/P1

الإيجابي أن `JwtAuthGuard` و`RolesGuard` مسجلان عالمياً في `backend/src/auth/auth.module.ts:47-54`. لكن RolesGuard لا يفحص إلا `@Roles`. `JwtStrategy` يبني مصفوفة `permissions`، ولا يوجد PermissionsGuard أو decorator يستخدمها.

كيان المستخدم يسمح فقط بـ`customer/seller/admin/super_admin/moderator` في `backend/src/database/entities/user.entity.ts:25-31`، بينما Controllers تطلب `support/logistics_manager/dispatcher/driver/b2b_customer` وأدوار drone. لذلك بعض المسارات غير قابلة للوصول بواسطة مستخدم طبيعي، أو ستحتاج تغييراً خارج النموذج يخلق تضارباً.

لا توجد سياسة موحدة لملكية المورد أو نطاق المتجر/الشركة؛ كل Controller/Service ينفذ فحصاً مختلفاً. توجد helpers واختبارات جيدة لبعض الموارد، لكنها لا تغطي جميع APIs.

**الإصلاح:** تعريف Permission catalog واحد مثل `orders.read.own`, `orders.read.store`, `payments.refund`, `logistics.dispatch`. يربط role بالpermissions في قاعدة البيانات أو config versioned، ويطبق PolicyGuard عالمي بعد JWT. تمر كل عملية على `authorize(subject, action, resourceContext)`. يجب إزالة string roles المبعثرة أو إدخالها رسمياً في نموذج staff memberships، مع عدم جعل user.role الواحد يمثل كل الأدوار التنظيمية.

**اختبار القبول:** توليد inventory آلي لكل route والتأكد أنه إما Public صراحة أو يملك permission policy. ثم matrix لكل دور × action × resource owner، مع deny-by-default واختبارات أن إضافة route جديد بلا metadata تفشل في CI.

### 7.3 XSS والفواتير والطباعة — P0

`generateInvoice` يدمج قيم الدفع مباشرة داخل HTML في `backend/src/payments/services/payments.service.ts:1037-1078` دون HTML escaping، ثم يعيد HTML خاماً في Buffer ويسميه PDF في السطر 1083. الـController يضع `Content-Type: application/pdf` رغم أنه ليس PDF. هذا خلل وظيفي وأمني.

`frontend/src/components/store/StoreBarcodeCard.tsx:276-310` يبني HTML عبر template string و`document.write`. إزالة حرف `<` من الاسم فقط لا تكفي؛ باقي الاسم وserial/code/URL والترجمة والصور غير escaped. كما أن JSON-LD في `ProductSeo.tsx` و`StoreSeo.tsx` وغيرها يستخدم `dangerouslySetInnerHTML` مع `JSON.stringify` دون استبدال `<` بـ`\u003c`، ما يسمح بإغلاق script إذا دخلت قيمة متجر/منتج خبيثة.

لا يوجد POS أو restaurant module في الشجرة؛ لذلك لا يمكن إعلان إغلاق XSS فيهما.

**الإصلاح:** إنشاء template typed للفاتورة مع output encoding، وإنتاج PDF حقيقي في worker مع مكتبة PDF أو Chromium sandboxed. لا تستخدم `document.write`؛ أنشئ print route React منفصلة وضع القيم عبر text nodes. استخدم helper واحداً لـJSON-LD: `JSON.stringify(value).replace(/</g, '\\u003c')`. لا تعتمد على input sanitization وحده؛ الترميز حسب سياق الإخراج هو الضمان الأساسي.

### 7.4 الدفع وWebhook وIdempotency — P0

هذه أخطر منطقة وظيفية:

- `processPayment` في `payments.service.ts:101-280` يستدعي Stripe/PayPal/OmanNet/Thawani/Telr ويعيد النتيجة، لكن لا يوجد `paymentRepository.create/save` لمسار البدء. لذلك histories/refunds/invoices قد لا تجد الدفع أصلاً.
- لا يقبل Controller `Idempotency-Key` ولا يخزنه، وإعادة الضغط أو retry من الشبكة قد ينشئ عدة intents/orders عند البوابة.
- `gatewayTransactionId` عليه index فقط وليس unique.
- لا يوجد جدول `webhook_events` بمفتاح provider event id فريد.
- `applyPaymentWebhook` في `orders.service.ts:423-453` يقرأ ويعدل ويحفظ بلا transaction أو row lock، ويضيف history في كل تكرار.
- كل Webhook مدفوع يطلق `order.paid` و`order.created` مرة أخرى، ما قد يكرر شحنة أو عمولة. فحص وجود الشحنة قبل إنشائها لا يمنع race ما لم يوجد unique constraint.
- `applyWebhookToOrder` يبتلع خطأ تحديث الطلب في `payments.service.ts:920-925`، ثم تعود معالجة Webhook بنجاح. والـController يعيد 200 للأخطاء غير BadRequest في `payments.controller.ts:198-204`، وقد تتوقف البوابة عن retry.
- فحص المبلغ يقبل غياب amount افتراضياً، ويسمح tolerance تصل إلى 1% من الإجمالي (`payment-amount.ts:47-54`). هذا غير مناسب لتسوية مالية.
- refund/capture يستخدمان Number ولا توجد row locks؛ استردادان متزامنان قد يتجاوزان الرصيد.

**التصميم المقترح:** 

1. جدول `payment_attempts` يحتوي merchant/tenant، order، provider، idempotency_key، amount Decimal، currency، provider_reference، status، request_hash. قيد unique على `(merchant_id, idempotency_key)` وunique جزئي مناسب لـprovider reference.
2. عند البدء: transaction قصيرة تحجز/تنشئ محاولة PENDING، ثم استدعاء البوابة بنفس idempotency key، ثم حفظ المرجع. الطلب المكرر بنفس body يعيد نفس النتيجة؛ body مختلف مع نفس المفتاح يرجع 409.
3. جدول `webhook_events` بقيد unique `(provider, provider_event_id)`، payload hash، signature status، processing status، attempts، last_error.
4. التسلسل: تحقق signature من raw body → إدراج event `ON CONFLICT DO NOTHING` → queue → transaction مع `SELECT ... FOR UPDATE` → تحقق order/currency/amount exact → state transition مشروط → outbox event → commit.
5. 2xx يُعاد فقط إذا حُفظ الحدث durable أو كان duplicate معروفاً. خطأ مؤقت يعيد 5xx ليعيد provider المحاولة؛ خطأ توقيع 400/401؛ حدث غير مدعوم محفوظ يمكن أن يعيد 2xx.
6. Unique constraints على shipment/order commission/outbox consumer keys حتى يكون المستهلك idempotent أيضاً.

**اختبارات القبول:** 50 طلب دفع متوازياً بنفس المفتاح = استدعاء بوابة واحد وسجل واحد. 100 Webhooks متطابقة ومتوازية = انتقال حالة واحد، history واحد، shipment واحد، commission واحدة. Webhook يفشل DB update يجب أن يعيد 5xx ثم ينجح في retry. اختبارات مبالغ أقل/أعلى بفرق 0.001 OMR يجب أن ترفض وفق policy صريحة.

### 7.5 روابط الفواتير العامة — N/A حالياً

لم يظهر route عام لفاتورة. التنزيل الحالي authenticated ويستدعي فحص ملكية. هذه نقطة إيجابية، ولا ينبغي اعتبار البند «مكتمل» لأن الميزة نفسها غير موجودة.

إذا أضيفت: استخدم opaque random token مخزناً كـhash، TTL قصير، revocation، rate limit، وDTO مخصص لا يعرض userId/orderId الداخلي أو gateway response أو عناوين كاملة. يكفي رقم فاتورة عام، اسم جهة البيع، البنود، الإجماليات، العملة، الضريبة، التاريخ والحالة. لا تستخدم UUID قابل للتخمين كرابط.

### 7.6 SSRF — P0/P1

في بوابات الدفع، `PaymentGateway` يخزن `apiEndpoint` وsecrets كنصوص عادية. مسار الإدارة الحالي يعرض البوابات ويغير `isActive` فقط، ولا يوجد route ظاهر لتعديل endpoint؛ لذلك لا توجد حالياً سلسلة استغلال مؤكدة من «إعدادات الدفع» إلى HTTP request. مع ذلك لا توجد URL policy، وربط الحقل مستقبلاً بخدمات HTTP سيخلق SSRF فوراً.

يوجد SSRF مؤكد خارج الدفع: `backend/src/logistics/services/b2b-shipment.service.ts:461-485` لا يفعل سوى `new URL(webhookUrl)`، ثم `sendWebhookRequest` ينفذ `fetch(url)` في `532-543`. يمكن لعميل B2B الوصول إلى localhost أو RFC1918 أو metadata services أو استخدام DNS rebinding/redirect.

**الإصلاح:** HTTPS فقط، allowlist hosts ثابت لبوابات الدفع، وحماية Webhooks عبر resolver يفحص جميع عناوين A/AAAA ويمنع loopback/private/link-local/multicast/metadata وIPv4-mapped IPv6. إعادة الفحص عند كل redirect، حد redirects صفر أو قليل، مهلة وحجم response، outbound proxy/egress firewall، وعدم إرفاق أسرار في الطلبات إلى host غير مطابق. اختبارات localhost و`127.0.0.1` و`::1` و`169.254.169.254` وRFC1918 وredirect وDNS rebinding إلزامية.

### 7.7 كلمة المرور والجلسات — P0

`forgotPassword` يولد token ويخزن bcrypt hash، ثم يشفر الخام بـAES-CBC ويسجل بادئته، لكنه لا يستدعي خدمة البريد. `resetPassword` يفك النص الخام ثم يستدعي `findByResetToken(raw)`، بينما قاعدة البيانات تحتوي bcrypt hash؛ لن توجد مطابقة. بعد ذلك توجد `bcrypt.compare` لا يتم الوصول إليها غالباً.

لا يوجد change-password endpoint يتحقق من كلمة المرور الحالية. `blacklistToken` و`revokeRefreshTokens` لا يكتبان إلى Redis، و`isTokenBlacklisted` يرجع `false` دائماً في `auth.service.ts:512-553`. refresh token القديم يظل صالحاً بعد rotation، وlogout/password reset لا يبطلان الجلسات فعلياً. جدول refresh_tokens موجود في migration لكنه غير مستخدم من AuthService.

AES-CBC المستخدم في auth بلا authentication tag، والمفتاح الفارغ يتحول عبر pad إلى قيمة متوقعة. هذا مختلف عن EncryptionService الأفضل الموجود في security.

**الإصلاح:** reset token عشوائي one-time مع selector عام وverifier سري؛ خزّن HMAC/SHA-256 للـverifier، لا bcrypt lookup، وأرسل الرابط بالبريد. استهلكه transactionally مع expiry ومحاولة واحدة. أضف change-password مع current password وreauthentication. طبّق refresh token families: `jti` hash، device/session id، rotation، reuse detection، revoke-all timestamp أو `securityStamp/tokenVersion` يتحقق منه كل refresh. بعد تغيير كلمة المرور تُلغى كل الجلسات عدا اختيارية الجلسة الحالية.

### 7.8 CSRF وTOTP وAPI Keys — P0/P1

CSRF guard عالمي، والواجهة ترسل `X-XSRF-TOKEN`؛ هذه قاعدة جيدة. لكن:

- وجود أي `X-API-Key` يتجاوز CSRF قبل التحقق أن المفتاح صالح.
- `validateOrigin` و`validateReferer` يرجعان true عند غياب header، والـguard يرفض فقط إذا كان الاثنان false؛ Origin خبيث مع Referer مفقود يتجاوز طبقة origin.
- `originHost.endsWith(trusted)` أوسع من المطابقة الدقيقة.
- الكود يسمي SHA-256 لـ`secret + token` HMAC رغم أنه لا يستخدم `createHmac`.
- الاختبارات الحالية تختبر exemptions أساساً ولا تختبر الـguard كاملاً.

TOTP غير مطبق: توجد حقول `twoFactorEnabled/Secret` واعتمادية otplib، لكن لا enrollment/verify/recovery، والـlogin لا يفحص 2FA.

API Keys لديها أفكار جيدة: raw key عشوائي، تخزين hash، scopes، expiry. لكن ApiKeyGuard غير عالمي ولا مستخدم على APIs، وJWT guard العالمي سيمنع مصادقة API key وحدها. DTO الإنشاء بلا decorators ومع `whitelist + forbidNonWhitelisted` قد يجعل الطلب غير صالح. `API_KEY_PEPPER` اختياري وفارغ، والـguard يقبل key من query، والـrate limit في ذاكرة كل instance، وتحديث `usageCount` لكل طلب hotspot وrace. كما لا توجد migration لجدول API keys.

**الإصلاح:** مصادقة موحدة تختار Bearer أو API key بعد التحقق، ثم policy guard يفرض scopes. API keys في header فقط، pepper إلزامي أو HMAC داخل KMS، prefixes/version، rotation overlap، Redis distributed limits، batching للusage. TOTP secret مشفر بمفتاح purpose منفصل، confirmation قبل enable، backup codes hashed، rate limits وanti-replay/recovery policy.

### 7.9 التشفير وفصل المفاتيح — P1

`EncryptionService` يستخدم AES-256-GCM وsalt/IV و`keyVersion` ويستطيع قراءة historical keys وrotate data؛ هذا scaffold جيد. لكن البحث لا يظهر استخدامه في business data. أسرار بوابات الدفع تبقى أعمدة plaintext، وAuth يستخدم AES-CBC منفصلاً. نفس master key يُستخدم للتشفير وHMAC بلا domain separation، وkey history JSON في environment وليست KMS/envelope encryption. `addKeyVersion` يعدل الذاكرة فقط ولا توجد عملية re-encryption أو audit/rollback.

**الإصلاح:** KMS/Vault/Cloud KMS مع envelope encryption وkey IDs، وفصل مفاتيح عبر HKDF أو data keys حسب purpose (`payments`, `totp`, `pii`, `webhook`). يحمل كل ciphertext `algorithm/version/key_id/tenant_id`. أنشئ rotate job قابلاً للاستئناف مع metrics وcanary وrollback، واختبار أن البيانات القديمة تقرأ والجديدة تكتب بالإصدار الجديد. لا تعرض secrets في admin DTO؛ تعرض `configured/lastRotatedAt` فقط.

### 7.10 المال وترقيم الطلبات والفواتير — P0

أعمدة PostgreSQL تستخدم `decimal/numeric`، لكن خصائص TypeORM معرفة كـ`number` والكود يستخدم `Number`, `parseFloat`, `Math.round`. هذا يعرض المجاميع والضريبة والعمولة والاسترداد لأخطاء IEEE-754. OMR يحتاج 3 منازل، بينما بعض كيانات العمولة تستخدم scale 2، ما يزيد عدم الاتساق.

رقم الطلب `BHD-YYYYMMDD-` + رقم عشوائي من 4 خانات في `orders.service.ts:567-573`، أي 9000 احتمال يومياً فقط ولا توجد retry عند unique collision. رقم الفاتورة مشتق من أول 8 أحرف UUID ولا يوجد Invoice entity أو legal sequence.

إنشاء الطلب أيضاً غير transaction: ينقص المخزون في الذاكرة، يحفظ المنتجات أولاً ثم الطلب. فشل حفظ الطلب يترك المخزون ناقصاً، وطلبان متزامنان قد يبيعان نفس المخزون.

**الإصلاح:** اختيار واحد من:

- integer minor units (baisa) للعمليات التي تتبع 3 منازل ثابتة؛ أو
- `decimal.js` مع TypeORM transformer يعيد string/Decimal وعدم تحويل numeric إلى JS Number.

حدد rounding mode لكل tax/discount/refund. نفذ إنشاء الطلب داخل transaction مع conditional stock update `stock >= qty` أو row locks. أنشئ Invoice entity وcounter لكل `(legal_entity, fiscal_year, document_type)` باستخدام PostgreSQL sequence أو counter row locked داخل transaction. لا تعيد استخدام رقم ولا تحذف فجوة بعد إصدار قانوني؛ حالات void/cancel تحفظ كسجل.

### 7.11 عزل الشركات/المستأجرين — P0 إن كان المنتج SaaS متعدد الشركات

المشروع multi-vendor وليس multi-company SaaS فعلياً. لا يوجد `tenant_id/company_id` أو tenant context أو RLS أو composite keys. العزل الحالي عبارة عن owner/store checks متفرقة. توجد اختبارات مفيدة لبعض الموارد، لكنها ليست cross-tenant suite.

إذا كان المطلوب عزل شركات حقيقي: أضف `tenant_id NOT NULL` لكل جدول scoped، composite unique/FK، request tenant context موثوقاً من membership وليس header خام، repository/query wrapper يلزم scope، ويفضل PostgreSQL RLS كطبقة دفاع ثانية. يجب وجود اختبارات باثنين أو ثلاثة tenants لكل CRUD/search/export/websocket/file URL/background job، تشمل IDs معروفة من Tenant B ويحاول Tenant A قراءتها أو تعديلها.

### 7.12 الاعتماديات — P0/P1

نتائج production audit:

- Backend: 1 critical، 18 high، 17 moderate، 2 low.
- Frontend: 1 critical، 6 high، 1 moderate.
- اعتمادات مباشرة عالية/حرجة تشمل `swiper`, `next`, `multer`, `nodemailer`, `sharp`, `@nestjs/platform-express`, `@nestjs/serve-static`, LangChain packages، و`xlsx` الذي لا يقدم npm إصلاحاً مباشراً.

CI يشغل audit بصورة informational مع `continue-on-error` على job والخطوات، فلا يمنع أي إصدار.

**الإصلاح:** branch مخصص للترقية على دفعات، lockfile diff review، إزالة الحزم غير المستخدمة خصوصاً AI/Excel، استبدال `xlsx` بحزمة مدعومة أو عزلها عن مدخلات غير موثوقة، ترقية Multer/Next/Swiper، اختبارات contract بعد كل major. ضع policy تمنع critical/high المستغلة أو الجديدة، مع exceptions مؤقتة لها مالك وتاريخ انتهاء.

### 7.13 الاختبارات — P0/P1

الـ29 suite الحالية مفيدة لكنها داخل `backend/src` فقط. ملفات `backend/test/unit` لا تدخل افتراضياً لأن Jest rootDir هو `src`. Integration imports قديمة، ومفتاح config خطأ. Frontend لا يملك unit tests صالحة، وPlaywright يشير لملفات setup غير موجودة.

الحد الأدنى المطلوب:

- Backend unit: policies، Decimal، state machines، redaction، URL policy.
- Integration مع PostgreSQL/Redis حقيقيين: migrations، repositories، transactions، locks، RLS/tenant.
- Contract tests لكل gateway باستخدام signed fixtures، دون مفاتيح حقيقية.
- Frontend component tests: auth forms، checkout، error states، RTL، accessibility.
- E2E: register/login/2FA، seller product، cart/order، COD، sandbox payment webhook، refund، logout/session revocation، tenant denial.
- Security regression: IDOR، XSS، CSRF، SSRF، webhook replay، mass assignment، file upload.

كل الاختبارات الحرجة يجب أن تكون blocking ولا تستخدم `continue-on-error`.

### 7.14 CI/CD وDocker والهجرات — P0

- Node 24 في package/.nvmrc، Node 20 في CI، Node 18 في Docker.
- Backend build يخفي 292 type errors بسبب SWC typeCheck off.
- لا lint ولا backend tsc ولا E2E ولا migration smoke في CI.
- Docker Backend يفحص `/api/v1/health` بينما route مستثنى من global prefix ومساره الصحيح `/health`.
- Docker Frontend يفحص `/api/health` ولا يوجد Next API route بهذا المسار.
- `migration:run` يفتقد `-d`، ولا يوجد `src/data-source.ts`. Production image بعد prune لا يملك بالضرورة أدوات ts-node اللازمة للأمر الموثق.
- CD يبدأ التطبيق الجديد ثم يشغل migration؛ هذا خطر schema incompatibility. ويعمل `git pull main` بجانب image tag، ما يسمح بانحراف compose عن commit الصورة.
- Trivy يستخدم `aquasecurity/trivy-action@master` و`continue-on-error`. Actions غير مثبتة على commit SHA.
- migrations لا تنشئ `api_keys` و`audit_logs`، ما يثبت schema drift.

**الإصلاح:** توحيد Node 24، إضافة Backend strict typecheck تدريجي مع منع أخطاء جديدة، ESLint configs غير تفاعلية، services لـPostgres/Redis في CI، وتشغيل migrations من الصفر ثم app smoke. أنشئ DataSource صريحاً يعمل من source وdist، وصورة migration منفصلة. استخدم expand-contract migrations قبل تحويل traffic، immutable image digest، health/readiness ثم rollback تلقائي. ثبت Actions على SHAs، أضف secret scanning/SAST/dependency review/SBOM/provenance/container gate.

### 7.15 CSP والرؤوس والمرفقات وCORS — P0/P1

توجد ثلاث جهات تضع CSP: Helmet في Backend، SecurityModule middleware، Nginx، بالإضافة إلى Next headers. القيم متعارضة؛ Next/Nginx يسمحان `unsafe-inline` و`unsafe-eval`، وX-Frame-Options يختلف بين DENY وSAMEORIGIN. عدة CSP headers تتقاطع وقد تكسر Stripe/PayPal أو تعطي شعور حماية زائف.

Nginx يعكس `$http_origin` مع credentials في `/api` بلا allowlist، ويتعامل مع OPTIONS بنفسه، ولا يسمح `X-XSRF-TOKEN` في allowed headers؛ قد يكسر CSRF المشروع أو يفتح CORS بحسب ترتيب الرؤوس.

`/uploads` على نفس origin يسمح SVG/PDF/doc/docx ويضع cache immutable. الـlocation الأب لا يمنع فعلياً كل الامتدادات الأخرى؛ blacklist محدود. SVG غير موثوق على origin يحمل cookies خطر XSS، وPDF/HTML-like content يحتاج download/sandbox. `dangerouslyAllowSVG: true` في Next يزيد الحاجة للضبط.

**الإصلاح:** جهة واحدة للرؤوس عند edge، CSP nonce/hash بلا `unsafe-eval` وبأقل قدر من inline، rollout report-only ثم enforce. CORS allowlist دقيقة من Backend أو Nginx لا كليهما. خزن المرفقات في cookieless domain، افحص magic bytes، allowlist MIME، antivirus، أسماء عشوائية، size limits، `Content-Disposition: attachment`, `nosniff`, `sandbox` للعرض، وsigned URLs قصيرة. SVG إما sanitize موثوق أو يُمنع/يُنزّل فقط.

### 7.16 Accessibility والواجهة وصفحات الثقة — P1/P2

الأساس جيد جزئياً: RTL/LTR و`lang/dir`، وبعض aria labels. لكن أزرار القائمة والبحث والمفضلة والسلة في layout، ومنها `frontend/src/app/[locale]/(main)/layout.tsx:99` و`235-256`، هي أيقونات بلا accessible names. لا توجد اختبارات axe أو بوابة WCAG رغم وجود `eslint-plugin-jsx-a11y` غير مفعل.

روابط `/privacy` و`/terms` تظهر في التسجيل والـFooter وsitemap، لكن لا توجد صفحات route لهما. لا توجد Accessibility statement أو سياسة cookies/refunds/security/trust center. توجد نصوص إنجليزية hardcoded في dashboards وshipping portal رغم الترجمة العامة.

**الإصلاح:** WCAG 2.2 AA؛ تشغيل axe في component/E2E، keyboard/focus/skip link/dialog focus، contrast وzoom 200%، error association وlive regions. استخراج كل النصوص إلى namespaces. إنشاء privacy/terms/cookies/refunds/accessibility/security pages بنسخ ar/en، مع مراجعة قانونية بشرية قبل اعتمادها.

### 7.17 إعادة تنظيم الخدمات — P1/P2

خدمة الدفع 1492 سطراً وتجمع orchestration، gateways، webhooks، refunds، invoices، payouts، admin queries وتهيئة gateways. توجد خدمات أخرى 600–900 سطر وصفحات كبيرة. لا يُنصح بإعادة كتابة شاملة.

**مسار تدريجي:** ثبّت characterization/contract tests أولاً، ثم استخرج بالتتابع:

1. `PaymentInitiationService` وgateway ports/adapters.
2. `WebhookIngestionService` و`PaymentStateMachine`.
3. `Ledger/RefundService` باستخدام Decimal.
4. `InvoiceService` مستقل.
5. `PaymentReadService` وadmin DTOs.
6. Outbox/queue consumers idempotent.

كل استخراج خلف interface وfeature flag، مع تشغيل implementation القديم والجديد في shadow comparison للقراءات والحسابات. جمد توسعة HR/CRM/drone/blockchain حتى يثبت checkout/delivery/refund.

### 7.18 Country Packs والتوسع الدولي — P1/P2

توجد Currency entity وseed وترجمة ar/en، لكن هناك مئات الإشارات المرتبطة بعمان: `OMR`, `OM`, Muscat، +968، VAT 5%، Asia/Muscat، نطاقات وعناوين. الضريبة 5% hardcoded في `orders.service.ts:527`، وفاتورة تحمل tax registration تجريبياً.

اقترح interface/versioned data لحزمة الدولة:

- country code، locales وdirection، timezone، address/phone/postal validation.
- currency minor units وrounding/cash rounding.
- taxes effective-dated حسب فئة المنتج والمنطقة ونوع العميل.
- legal invoice fields/sequences/credit notes والاحتفاظ.
- gateways/carriers/return rules/holidays/data residency.
- localized trust/legal content.

يُحل Country Pack من tenant/store/order snapshot، ولا يُقرأ من global environment أثناء حساب قديم، حتى تبقى الفواتير قابلة لإعادة البناء تاريخياً.

### 7.19 التوثيق وThreat Model وRunbooks — P1

التوثيق كثير لكنه متضارب: README يذكر Prisma رغم أن المشروع TypeORM، ويعرض ملفات ومسارات غير موجودة، وإصدارات Node مختلفة. `SECURITY.md:736-762` يعلن RBAC/crypto/dependency/audit/SSRF مكتملة بينما المراجعة تثبت نواقص مباشرة. كما يذكر retention وCloudWatch/S3 archive بلا تطبيق مثبت.

المطلوب:

- Threat Model لكل trust boundary: browser، admin، seller، webhooks، uploads، queues، DB، Redis، vendors، mobile.
- inventory للأصول والبيانات الحساسة، DFDs، abuse cases، STRIDE، controls وresidual risk.
- Runbooks: incident/breach، secret rotation، compromised API key، webhook replay/backlog، payment reconciliation، DB failover، backup restore، migration rollback/forward-fix، dependency zero-day، vendor outage، account takeover.
- سياسات: access review، least privilege، retention/deletion، change/release، vulnerability SLA، backup RPO/RTO واختبارات restore، logging/privacy.
- docs-as-code checks للمسارات والأوامر والإصدارات، ومنع وضع ✅ امتثال دون evidence link واختبار.

## 8. جعل الموقع «سريعاً كسرعة البرق»

لا يمكن ضمان سرعة مطلقة من الكود فقط؛ يلزم قياس production p75 حسب الجهاز والمنطقة. لكن أكبر مانع واضح الآن هو bundle مشترك 439 kB لكل صفحة. السبب المباشر إعداد Webpack المخصص في `frontend/next.config.js:280-295` الذي يجمع كل `node_modules` تقريباً في `vendors` واحد حجمه 383 kB.

### ترتيب العمل عالي العائد

1. احذف custom `splitChunks.vendor/common` واترك Next يدير route-based splitting. قارن bundle analyzer قبل/بعد.
2. افصل layouts: لا تحمل SmartCart وFramer Motion وadmin/logistics libraries على صفحات auth أو صفحات المحتوى. استخدم dynamic import لـRecharts/Swiper/AI/editor/maps والتقارير.
3. زِد Server Components، وانقل data fetching والتنسيق غير التفاعلي إلى الخادم، واجعل client islands صغيرة.
4. لا ترسل ملف رسائل الترجمة الكامل لكل صفحة؛ استخدم namespaces/selected messages.
5. ضع caching صريحاً للكتالوج العام: CDN `s-maxage` و`stale-while-revalidate`، وRedis للقراءات المكلفة مع invalidation بالأحداث. لا تخزن بيانات user-specific في public cache.
6. راجع استعلامات DB بـ`EXPLAIN ANALYZE` وAPM، أزل N+1، استخدم select DTOs وcursor pagination، واضبط pool حسب عدد replicas مع PgBouncer.
7. الصور: استمر في WebP/AVIF، أضف width/height وpriority للصورة البطلة فقط، CDN قريب من عمان/GCC، وتجنب صور خارجية بلا optimization.
8. اجعل API payloads صغيرة ومضغوطة، ولا تعيد Entity كاملة أو gateway configs. لا تكرر compression/headers عبر ثلاث طبقات.
9. budgets blocking في CI: shared JS مبدئياً أقل من 170 kB compressed ثم خفضه، وroute delta محدود. أهداف p75: LCP ≤2.5s، INP ≤200ms، CLS ≤0.1، TTFB للصفحات cached ≤800ms.
10. OpenTelemetry/Sentry tracing من browser إلى API إلى DB/gateway، مع sampling وredaction. لا يمكن تحسين ما لا يقاس.

## 9. تحسين SEO والأرشفة

المشروع يملك metadata وrobots وsitemap وJSON-LD، وهذا أساس جيد، لكن التنفيذ الحالي به مشكلات:

- sitemap يجلب `https://bhd.market/api/products|stores|categories`، بينما rewrite الفعلي هو `/api/v1`. أثناء البناء ظهرت رسائل fallback، فاختفت المنتجات والمتاجر وأضيفت فئات افتراضية قد تكون غير موجودة.
- dynamic URLs في sitemap تستخدم `/product/...` و`/store/...` بينما routes الفعلية plural/localized مثل `/[locale]/products/[slug]` و`stores`.
- metadata في root يضع canonical ثابتاً على الصفحة الرئيسية؛ الصفحات تحتاج canonical خاصاً بها وhreflang متبادلاً.
- JSON-LD غير escaped كما سبق.
- privacy/terms/faq/careers URLs موجودة في sitemap وبعضها غير موجود في routes؛ إرسال 404 داخل sitemap يضر الجودة.

**الإصلاح:** أنشئ sitemap من Backend server-to-server URL موثوق أو مباشرة من DB/read API، مع pagination وتقسيم sitemap index بعد 50 ألف URL. لا تنشر fallback وهمياً؛ احتفظ بآخر نسخة ناجحة أو افشل job بوضوح. تحقق آلياً أن كل URL يرجع 200 وcanonical صحيح. أضف localized alternates للمنتج والمتجر والفئة، وProduct/Offer/Organization/Breadcrumb JSON-LD آمن ودقيق، وصفحات 404/410 صحيحة، وnoindex للبحث الداخلي ولوحات التحكم.

## 10. خارطة إصلاح مرتبة

### المرحلة 0 — خلال 24–72 ساعة: منع إطلاق غير آمن

- منع production deploy حتى تكون اختبارات P0 blocking.
- تعطيل بوابات الدفع الحقيقية وB2B outgoing webhooks؛ sandbox/COD داخلي فقط.
- إزالة تسجيل tokens/payloads وتطبيق redaction مركزي واختبار canary.
- إصلاح CORS reflection وuploads SVG/same-origin مؤقتاً.
- تصحيح health checks إلى `/health` وإضافة Frontend health route.
- إنشاء issue لكل P0 ومالك وSLA؛ تعديل `SECURITY.md` ليعكس الواقع.

### المرحلة 1 — أسبوعان: نواة آمنة قابلة للاختبار

- توحيد Node، ESLint، Backend tsc gate، وإيقاف زيادة الـ292 خطأ ثم إصلاح core commerce أولاً.
- إصلاح DataSource/migrations وإضافة api_keys/audit/webhook/payment attempts.
- تنفيذ transaction للمخزون والطلب وDecimal policy.
- إصلاح password reset/change/session revocation.
- إصلاح XSS للفواتير والطباعة وJSON-LD.
- URL/egress SSRF policy.
- إصلاح Backend integration وFrontend unit/Playwright setup.

### المرحلة 2 — 30 يوماً: دورة مالية موثوقة

- Payment attempt idempotency، Webhook inbox، outbox، unique consumers.
- reconciliation job يقارن gateway settlements بالسجلات ويبلغ عن الفروق.
- Invoice entity/sequence وPDF حقيقي وcredit notes.
- TOTP وAPI key scopes/rotation فعليان.
- تحديث الاعتماديات وإغلاق critical/high وفق policy.
- CI مع Postgres/Redis والمigrations/E2E/security regression.

### المرحلة 3 — 60 يوماً: الأداء والعزل والتشغيل

- إزالة vendor chunk، Server Components/dynamic imports، CDN/cache/DB tuning، performance budgets.
- tenant architecture إن كان business model يتطلب شركات مستقلة، مع RLS واختبارات cross-tenant.
- CSP nonce single-owner، attachment domain، malware scan.
- immutable CD وexpand-contract وrollback وSBOM/provenance.
- Threat Model وrunbooks وتمرين restore وincident tabletop.

### المرحلة 4 — 90 يوماً: التوسع المنضبط

- Country Packs versioned وtax/invoice/address adapters.
- refactor تدريجي لخدمة الدفع واللوجستيات مع contract/shadow tests.
- WCAG 2.2 AA وصفحات الثقة والسياسات المعتمدة قانونياً.
- اختبار اختراق staging بتفويض وحسابات أدوار ومتاجر/شركات متعددة، ثم إعادة اختبار الإصلاحات.

## 11. تعريف الجاهزية قبل الإنتاج

لا يُرفع الحظر قبل تحقق جميع الآتي:

- صفر critical/high غير مستثناة زمنياً في runtime/container.
- Backend وFrontend typecheck/lint/unit/integration/E2E blocking وخضراء.
- migrations من قاعدة فارغة ومن النسخة السابقة تنجح، وrollback/forward-fix مجرب.
- concurrency/idempotency tests للدفع والمخزون والفواتير خضراء.
- reset/change-password وlogout/revoke-all مثبتة باختبارات.
- XSS/CSRF/SSRF/IDOR/tenant/file upload regression suite خضراء.
- payment reconciliation في sandbox بلا فروق، وWebhook retry/replay مجرب.
- load test بأهداف p75/p95 وبميزانية أخطاء معروفة، لا مجرد «الصفحة تبدو سريعة».
- backup restore drill موثق، monitoring/alerts/on-call/runbooks جاهزة.
- مراجعة قانونية للسياسات، وتحديد PCI scope مع مزود دفع؛ دون ادعاء PCI/SOC 2/ISO ما لم تصدر شهادة رسمية.

## 12. القيود وما لا يثبته هذا التقرير

لم أدوّر مفاتيح دفع حقيقية، ولم أحذف سجلات إنتاج، ولم أعدل Vercel/Render/Neon/DNS/Redis/S3/Sentry/البريد، ولم أنفذ أي تغيير في المستودع. لم يتوفر Docker/PostgreSQL/Redis حي لتشغيل smoke، ولم تتوفر أسرار sandbox أو حسابات متعددة. لم أفحص البنية السحابية أو IAM أو WAF أو النسخ الاحتياطية الفعلية. لم أنفذ اختبار اختراق production أو فحص full-history secrets متخصصاً.

لا يمكن ضمان انعدام الثغرات 100%. الممكن هندسياً هو تقليل المخاطر، منع regressions بالاختبارات، قياس controls، وإعادة المراجعة والاختبار بعد كل إصلاح.

## 13. الحكم النهائي

المشروع **واعد وغني بالوظائف، لكنه prototype/advanced scaffold أكثر من كونه منصة مالية جاهزة للإنتاج**. أفضل قرار تقني وتجاري هو تجميد الميزات البعيدة مؤقتاً، والتركيز على نواة واحدة: مستخدم → متجر → منتج → مخزون → طلب → دفع idempotent → فاتورة → شحن → إرجاع/استرداد، مع اختبارات وتدقيق وتشغيل يمكن إثباته.

عند إغلاق P0 المذكورة ونجاح تعريف الجاهزية، يمكن الانتقال إلى Beta حقيقية بثقة أعلى. قبل ذلك، تشغيل أموال أو بيانات حساسة حقيقية سيحمل مخاطر فقدان دفعات، تكرار عمليات، تسرب بيانات، وتعطل نشر لا ينبغي قبولها.
