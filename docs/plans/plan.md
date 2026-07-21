# خطة بناء منصة BHD التجارية العمانية - إعادة البناء

## الهدف
إعادة بناء مشروع BHD Marketplace كاملاً بعد فقدان المحادثة السابقة، وضغطه في ملف ZIP للمستخدم.

## المراحل

### المرحلة 1: Frontend (Next.js 14 + TypeScript + Tailwind CSS)
- package.json + tsconfig.json + tailwind.config.ts + next.config.js + postcss.config.js
- .env.example
- i18n.ts + middleware.ts (RTL/LTR)
- messages/ar.json + messages/en.json (500+ عبارة)
- styles/globals.css (تصميم BHD الفاخر)
- UI Components: Button, Card, Input, Toast
- Providers: Theme, Query, Auth
- Home Sections: Hero, Categories, FeaturedStores, TrendingProducts, SpecialOffers, WhyBHD
- AI Assistant Component
- Smart Cart Component
- Seller Dashboard Page
- lib/utils.ts (helpers, encryption, formatting)
- hooks/useToast.ts, hooks/useAuth.ts

### المرحلة 2: Backend (NestJS + TypeScript)
- package.json + tsconfig.json + nest-cli.json + main.ts + app.module.ts
- .env.example
- Config: database, redis, payment, shipping, ai
- Database Entities: user, address, store, product, category, review, order, order-item, payment, subscription, shipment, chat-message, currency, refresh-token
- Auth Module: service, controller, guards, strategies, dtos
- Users Module: service, controller, dtos
- Currency Module: service, controller, entity
- Common Module: filters, interceptors, decorators, logger

### المرحلة 3: التجميع والضغط
- نسخ جميع الملفات في الهيكل الصحيح
- ضغط المشروع في ملف ZIP
- تقديمه للمستخدم

## ملاحظات
- بناء كل الملفات دفعة واحدة باستخدام subagents متوازية
- كل agent يبني جزء محدد
- دمج كل الأجزاء في النهاية
