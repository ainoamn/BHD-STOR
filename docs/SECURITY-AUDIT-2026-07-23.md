# تقرير تدقيق الحماية والتشفير والأداء — BHD-STOR

**التاريخ:** 2026-07-23  
**المستودع:** [ainoamn/BHD-STOR](https://github.com/ainoamn/BHD-STOR)  
**المسار المعتمد:** `C:\dev\bhd-app`  
**المنهج:** مراجعة ثابتة للكود + `nest build` + اختبارات وحدة أمنية  
**تنويه:** ليس اختبار اختراق، وليس شهادة SOC2 / PCI DSS.

---

## 1) الخلاصة التنفيذية

طبقات Auth والتشفير وملكية المدفوعات/الطلبات **قوية نسبياً** بعد سلسلة إصلاحات P0 الأخيرة.  
في هذه الجولة أُغلق أيضاً: **IDOR تحديث حالة الطلب**، **تقييد returnUrl للدفع وتسجيل الدخول**، و**إزالة fallback ثابت لـ WhatsApp verify token**.

ما زال مفتوحاً للإنتاج الحقيقي: تفعيل CSRF عالمياً مع كوكيز، تحقق توقيع Telr، Redis للـ throttle، وتشغيل smoke على Docker.

| المحور | الحكم |
|--------|--------|
| الحماية (Auth/RBAC/ملكية) | جيد مع بقايا P1 |
| التشفير | AES-256-GCM + fail-closed في production |
| السرعة | مقبول للنواة؛ مخاطر N+1 وthrottle في الذاكرة |
| أخطاء البناء/الاختبار | `nest build` ناجح · 10 اختبارات أمنية ناجحة |

---

## 2) تحقق التشغيل (هذه الجلسة)

| فحص | النتيجة |
|------|---------|
| `npx nest build` | OK (SWC · ~470 ملف) |
| Jest `(request-user\|assert-production-secrets\|roles.guard)` | 3 suites / 10 tests |
| أسرار hardcoded / `sk_live` / private keys | لا تطابقات خطرة |
| `Math.random` لمفاتيح تشفير | لا — يستخدم `crypto.randomBytes` |
| `DISABLE_AUTH` / bypass | غير موجود |
| `.env` في git | مستبعد عبر `.gitignore` |

---

## 3) جدول التحقق

| # | الموضوع | المسار | الخطورة | الحالة |
|---|---------|--------|---------|--------|
| 1 | JwtAuthGuard + RolesGuard كـ APP_GUARD | `backend/src/auth/auth.module.ts` | P0 | ✅ |
| 2 | أسرار الإنتاج الضعيفة مرفوضة | `assert-production-secrets.ts` | P0 | ✅ |
| 3 | ENCRYPTION_MASTER_KEY fail-closed + AES-256-GCM | `security/encryption/encryption.service.ts` | P0 | ✅ |
| 4 | bcrypt 12 rounds | `auth.service.ts` | P1 | ✅ |
| 5 | ملكية الطلب GET/history | `orders.service.ts` `assertOrderAccess` | P0 | ✅ |
| 6 | ملكية الدفع/الاسترداد | `payments.service.ts` | P0 | ✅ |
| 7 | تحديث حالة الطلب بدون ملكية (IDOR) | `orders.controller.ts` `PATCH :id/status` | P0 | ✅ **أُصلح 2026-07-23** (`updateStatusForRequester` + `assertOrderManageAccess`) |
| 8 | Webhooks Stripe/PayPal/Thawani fail-closed | `payments.service.ts` | P0 | ✅ |
| 9 | Telr بدون تحقق توقيع قوي | `payments.service.ts` case telr | P1 | ⚠️ مفتوح |
| 10 | Throttle على webhook | `ThrottlerGuard` + `WEBHOOK` | P1 | ✅ منطق / ⚠️ مخزن in-memory |
| 11 | CSRF غير مفعّل عالمياً | `security/csrf` | P1 | ✅ **أُصلح 2026-07-23** (`APP_GUARD` + استثناء webhooks دفع/واتساب + FE header) |
| 12 | Open redirect بعد login | `auth/login/page.tsx` | P1 | ✅ **أُصلح** (مسارات نسبية فقط) |
| 13 | returnUrl للدفع غير مقيد | `payments.service.ts` | P1 | ✅ **أُصلح** (`sanitizePaymentReturnUrl`) |
| 14 | WhatsApp verify token ثابت | `whatsapp.controller.ts` | P1 | ✅ **أُصلح** (لا fallback؛ فارغ يرفض) |
| 15 | Demo Mode افتراضي false | `frontend` demo-mode | P0 | ✅ |
| 16 | Helmet + ValidationPipe | `main.ts` | P2 | ✅ |
| 17 | مبالغة SOC2 في SECURITY.md | `SECURITY.md` | Docs | ⚠️ يبقى تحذير الصدق أعلى الملف |

---

## 4) التشفير (مختصر)

- الخوارزمية: **AES-256-GCM** مع IV + authTag.
- المفتاح: `ENCRYPTION_MASTER_KEY` بطول 64 hex في production وإلا **فشل الإقلاع**.
- خارج production: تحذير + مفتاح مؤقت (غير مناسب لأي بيانات حقيقية).
- كلمات المرور: **bcrypt cost 12** (ليست جزءاً من EncryptionService).

---

## 5) السرعة والأداء

| خطر | أين | ملاحظة |
|-----|-----|--------|
| Throttle في الذاكرة | `throttler.guard.ts` | غير مشترك بين النسخ · يُفضّل Redis |
| إحصاءات دفع تسحب الكل | `getPaymentStats` | يُفضّل SQL aggregate |
| N+1 عند إلغاء الطلب | `orders.service.ts` cancel | تحديث مخزون بنداً بنداً |
| فهارس موجودة جزئياً | `userId` على الطلبات | جيدة لملكية القوائم |
| كاش كتالوج عام | غير ظاهر | اختياري بعد إثبات الحمل |

---

## 6) ما أُصلح في هذه الجولة (ورُفع مع التقرير)

1. `PATCH /orders/:id/status` → صلاحية أدمن/مشرف أو **صاحب المتجر فقط**.  
2. منع open redirect في صفحة تسجيل الدخول.  
3. Allowlist لـ `returnUrl` عند `processPayment`.  
4. إزالة `bhd_webhook_verify_token_2024` الثابت من واتساب.

---

## 7) المتبقي قبل إنتاج بأموال حقيقية

1. Docker + Postgres + Redis → `npm run smoke`.  
2. تفعيل CSRF للحركات المعتمدة على الكوكي (أو SameSite=Lax إن كان نفس الموقع).  
3. تحقق توقيع/تأكيد Telr عبر API.  
4. Throttle على Redis.  
5. مفاتيح sandbox Stripe/Thawani حقيقية + اختبار webhook.  
6. عدم تفعيل `NEXT_PUBLIC_DEMO_MODE` في صورة الإنتاج.

---

## 8) روابط ذات صلة

- الخطة الحية: [`ROADMAP.md`](../ROADMAP.md)  
- سجل الجلسة: [`SESSION-2026-07-21.md`](./SESSION-2026-07-21.md)  
- أمان (تصميم + تنويه صدق): [`SECURITY.md`](../SECURITY.md)

---

*آخر تحديث: 2026-07-23 — تدقيق + CSRF عالمي + إغلاق IDOR/returnUrl/واتساب.*
