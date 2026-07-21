# تشغيل المشروع — اقرأ هذا أولاً

## المسار الوحيد الصحيح

```bat
C:\dev\bhd-app
```

أو الاختصار:

```bat
C:\dev\bhd-run   (يشير الآن إلى bhd-app)
```

## لماذا الشاشة البيضاء بعد الشعار؟

تشغيل Next.js من مسار فيه حروف عربية (مثل `مشروع المتجر` أو مجلد Downloads) يسبب عطل Webpack → يظهر الشعار لحظة ثم صفحة بيضاء.

## التشغيل

انقر نقراً مزدوجاً:

`C:\dev\bhd-app\start-dev.bat`

ثم افتح:

http://localhost:3000/ar

## GitHub

المستودع: https://github.com/ainoamn/BHD-STOR  
يجب أن يطابق `C:\dev\bhd-app` على فرع `main`.

لا تستخدم مجلدات `extracted-*` أو ملفات ZIP القديمة للتشغيل.
