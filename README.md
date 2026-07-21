<div align="center">

<!-- Logo Placeholder - Replace with your actual logo -->
<p align="center">
  <img src="./docs/assets/logo.png" alt="BHD Oman Logo" width="200" height="200" style="border-radius: 20px;"/>
</p>

<h1>BHD Oman Marketplace</h1>
<p align="center">
  <strong>منصة ب_HD_ للتجارة الإلكترونية في سلطنة عمان</strong><br/>
  <strong>Oman's Premier E-Commerce Marketplace Platform</strong>
</p>

<!-- Badges -->
<p align="center">
  <a href="https://github.com/bhd-oman/marketplace/actions">
    <img src="https://img.shields.io/github/workflow/status/bhd-oman/marketplace/CI?style=for-the-badge&logo=github&color=2ECC71" alt="Build Status"/>
  </a>
  <a href="https://github.com/bhd-oman/marketplace/actions/workflows/tests.yml">
    <img src="https://img.shields.io/github/workflow/status/bhd-oman/marketplace/Tests?label=TESTS&style=for-the-badge&logo=jest&color=3498DB" alt="Tests"/>
  </a>
  <a href="https://coveralls.io/github/bhd-oman/marketplace">
    <img src="https://img.shields.io/coveralls/github/bhd-oman/marketplace?style=for-the-badge&color=9B59B6" alt="Coverage"/>
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge&color=E74C3C" alt="License"/>
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-14.x-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  </a>
</p>

<p align="center">
  <a href="https://bhd.om"><strong>🌐 Visit bhd.om</strong></a> •
  <a href="./SETUP.md"><strong>📖 Setup Guide</strong></a> •
  <a href="./API.md"><strong>🔌 API Docs</strong></a> •
  <a href="./DEPLOYMENT.md"><strong>🚀 Deploy</strong></a> •
  <a href="./CONTRIBUTING.md"><strong>🤝 Contribute</strong></a>
</p>

</div>

---

## 📋 Table of Contents

- [حالة المشروع](#حالة-المشروع-اقرأ-أولاً)
- [Overview](#-overview)
- [Features](#-features-honest-status)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [Roadmap (single source)](#roadmap)
- [Folder Structure](#-folder-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## حالة المشروع (اقرأ أولاً)

| البند | الواقع |
|-------|--------|
| المستودع | [ainoamn/BHD-STOR](https://github.com/ainoamn/BHD-STOR) |
| ما هو هذا؟ | منصة سوق عمانية متعددة البائعين (B2B/B2C/…) — **هيكل احترافي واسع** وليس منتج إنتاج مكتمل |
| التشغيل المعتمد على Windows | `C:\dev\bhd-app` فقط (مسارات عربية تكسر Webpack لـ Next.js) |
| الخطة والنواقص | **[`ROADMAP.md`](./ROADMAP.md)** — المصدر الوحيد؛ لا تكرر الخطط في ملفات أخرى |
| مراجعة أمنية/هندسية كاملة | **[`docs/FULL_AUDIT.md`](./docs/FULL_AUDIT.md)** |
| أرشيف تقارير خارجية (ChatGPT/DeepSeek/جيميني/كيمي) | **[`docs/external-reviews/`](./docs/external-reviews/)** |
| لقطة حالة GitHub (2026-07-21) | **[`docs/external-reviews/STATUS-2026-07-21.md`](./docs/external-reviews/STATUS-2026-07-21.md)** |
| سجل جلسة 2026-07-21 (سياق أجهزة متعددة) | **[`docs/SESSION-2026-07-21.md`](./docs/SESSION-2026-07-21.md)** |
| أرشيف الخطط القديمة | `docs/plans/` (مرجع تاريخي فقط) |
| الأمان | طبقات متعددة في الكود (JWT، RBAC، bcrypt، AES-256-GCM، rate limit، CSRF/XSS/CSP، audit) — راجع [`SECURITY.md`](./SECURITY.md) وقسم الأمان في `ROADMAP.md` |

---

## 🌍 Overview

**BHD Oman** is a multi-vendor e-commerce marketplace codebase for the Omani market: Arabic/English (RTL/LTR), multi-currency (GCC + USD/EUR/GBP), subscriptions + commission model, seller/admin dashboards, shipping/logistics modules, AI/WhatsApp scaffolds, and mobile/iOS stubs.

**ب_HD_** كود منصة تجارة إلكترونية عمانية متعددة البائعين. كثير من الشاشات والخدمات **موجودة كملفات**؛ الإطلاق الحقيقي يحتاج اتباع [`ROADMAP.md`](./ROADMAP.md).

### Key Highlights

- 🌐 **Bilingual** — Arabic & English (RTL/LTR)
- 🏪 **Multi-Vendor** — Stores with B2B/B2C/C2C/hybrid types
- 💳 **Payments** — Gateway services (Stripe, PayPal, local configs) — need real keys
- 🚚 **Shipping + logistics** — Carrier adapters + internal fleet module
- 🤖 **AI / WhatsApp** — Service layer present; needs API keys
- 📱 **PWA / Mobile / iOS** — Scaffold present
- 🔒 **Security modules** — Multi-layer Nest security package (see honest assessment in ROADMAP)
- 📊 **Admin / seller dashboards** — UI present; demo fallbacks on frontend

---

## ✨ Features (honest status)

Legend: **Code** = implemented in repo · **Demo** = UI works without full backend · **Needs keys** = integration code exists · **Later** = not launch-critical

### For Buyers

| Feature | Status |
|---------|--------|
| Catalog / home / i18n | Code + Demo |
| Cart / wishlist UI | Code + Demo |
| AI assistant / smart cart UI | Code · Needs keys |
| PWA / notifications | Code · Needs ops |
| Live chat / reviews APIs | Code · Needs DB + test |

### For Sellers

| Feature | Status |
|---------|--------|
| Store / product / order dashboards | Code + Demo |
| Shipping / payouts | Code · Needs keys |
| Mobile seller (iOS stub) | Later |

### For Admins

| Feature | Status |
|---------|--------|
| Users / stores / orders / payments UIs | Code + Demo |
| Subscriptions / commissions / logistics admin | Code · Needs wiring |
| Accounting / HR / CRM / drones | Later (feature-flag) |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="16"/> Next.js | 14.x | React Framework (App Router) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="16"/> TypeScript | 5.x | Type Safety |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="16"/> Tailwind CSS | 3.x | Styling |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="16"/> React Query | 5.x | Server State Management |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg" width="16"/> Zustand | 4.x | Client State Management |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="16"/> Socket.io | 4.x | Real-time Communication |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="16"/> React Hook Form | 7.x | Form Management |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg" width="16"/> Zod | 3.x | Schema Validation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg" width="16"/> NestJS | 10.x | API Framework |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="16"/> TypeScript | 5.x | Type Safety |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="16"/> PostgreSQL | 16.x | Primary Database |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="16"/> Redis | 7.x | Cache & Sessions |
| TypeORM | 0.3.x | Database Access (PostgreSQL) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="16"/> Socket.io | 4.x | WebSocket Gateway |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg" width="16"/> AWS S3 | - | File Storage |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="16"/> Bull MQ | - | Job Queue |

### AI & Integrations

| Technology | Purpose |
|------------|---------|
| 🤖 OpenAI GPT-4 | AI Chat Assistant |
| 🔍 Pinecone | Vector Search |
| 💳 Stripe / Thawani | Payment Processing |
| 📦 Aramex / DHL | Shipping Integration |
| 📧 SendGrid | Email Service |
| 📱 Twilio | SMS Service |

### DevOps

| Technology | Purpose |
|------------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="16"/> Docker | Containerization |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-original.svg" width="16"/> Kubernetes | Orchestration |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="16"/> GitHub Actions | CI/CD |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg" width="16"/> Prometheus | Monitoring |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg" width="16"/> Grafana | Visualization |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" width="16"/> Nginx | Reverse Proxy |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web App    │  │   PWA App    │  │   Admin Dashboard    │  │
│  │   (Next.js)  │  │   (Next.js)  │  │   (Next.js)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          └──────────────────┼─────────────────────┘
                             │ HTTPS/HTTP2
┌────────────────────────────┼──────────────────────────────────┐
│                    API Gateway (Nginx)                        │
│              Rate Limiting │ SSL │ Load Balancing             │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                   Application Layer (NestJS)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Auth    │ │  Users   │ │  Stores  │ │   Products       │ │
│  │ Module   │ │ Module   │ │ Module   │ │   Module         │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Orders  │ │ Payments │ │ Shipping │ │   Chat/AI        │ │
│  │ Module   │ │ Module   │ │ Module   │ │   Module         │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
└────────────────────────────┬──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │   AWS S3         │   │
│  │  (Primary)   │  │  (Cache/Session)│  │  (File Storage) │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────┐        ┌──────────────────────┐
│  AI Services     │        │  External APIs       │
│  OpenAI/Pinecone │        │  Payment/Shipping/Email│
└──────────────────┘        └──────────────────────┘
```

### Data Flow

1. **Client** sends HTTP/WebSocket request
2. **Nginx** validates, rate-limits, and routes
3. **NestJS Guards** authenticate & authorize
4. **Service Layer** processes business logic
5. **TypeORM** queries PostgreSQL
6. **Redis** caches frequently accessed data
7. **Response** flows back through the stack

---

## Roadmap

الخطة والنواقص خطوة بخطوة — ملف واحد فقط:

→ **[ROADMAP.md](./ROADMAP.md)**

لا تُحدَّث الخطط في `docs/plans/`؛ تلك ملفات أرشيف.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x ([Download](https://nodejs.org/))
- **PostgreSQL** >= 16 ([Download](https://www.postgresql.org/download/))
- **Redis** >= 7 ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/))
- On Windows: prefer ASCII path `C:\dev\bhd-app` (Arabic folder paths break Next.js webpack)

### 1. Clone Repository

```bash
git clone https://github.com/ainoamn/BHD-STOR.git
cd BHD-STOR
```

Or work from the synced local tree:

```bat
cd /d C:\dev\bhd-app
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
```

Backend will be running at `http://localhost:3001`

### 3. Start Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend will be running at `http://localhost:3000`

### 4. Verify

Open your browser and navigate to:
- 🌐 **Web App**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3001/api/docs (Swagger UI)
- 📊 **Admin Panel**: http://localhost:3000/admin

---

## 📁 Folder Structure

```
bhd-marketplace/
├── 📄 README.md              # Project documentation
├── 📄 SETUP.md               # Detailed setup guide
├── 📄 API.md                 # API documentation
├── 📄 DEPLOYMENT.md          # Deployment guide
├── 📄 SECURITY.md            # Security documentation
├── 📄 TROUBLESHOOTING.md     # Common issues & fixes
├── 📄 CONTRIBUTING.md        # Contribution guidelines
├── 📄 CHANGELOG.md           # Version history
│
├── 🐳 docker-compose.yml     # Docker orchestration
├── 📦 package.json           # Root workspace config
├── 🧪 jest.config.js         # Test configuration
│
├── 📂 backend/               # NestJS API Server
│   ├── 📂 src/
│   │   ├── 📂 modules/
│   │   │   ├── 📂 auth/      # Authentication & JWT
│   │   │   ├── 📂 users/     # User management
│   │   │   ├── 📂 stores/    # Store management
│   │   │   ├── 📂 products/  # Product catalog
│   │   │   ├── 📂 categories/# Category tree
│   │   │   ├── 📂 orders/    # Order processing
│   │   │   ├── 📂 cart/      # Shopping cart
│   │   │   ├── 📂 wishlist/  # Wishlist
│   │   │   ├── 📂 payments/  # Payment gateway
│   │   │   ├── 📂 shipping/  # Shipping & logistics
│   │   │   ├── 📂 chat/      # Real-time chat
│   │   │   ├── 📂 ai/        # AI services
│   │   │   ├── 📂 admin/     # Admin operations
│   │   │   └── 📂 currency/  # Currency conversion
│   │   ├── 📂 common/        # Shared utilities
│   │   ├── 📂 config/        # Configuration files
│   │   ├── 📂 database/      # Migrations & seeds
│   │   ├── 📂 guards/        # Auth guards
│   │   ├── 📂 decorators/    # Custom decorators
│   │   ├── 📂 pipes/         # Validation pipes
│   │   ├── 📂 filters/       # Exception filters
│   │   ├── 📂 interceptors/  # Request/Response interceptors
│   │   └── main.ts           # Application entry point
│   ├── 📂 prisma/
│   │   └── schema.prisma     # Database schema
│   ├── 📂 test/
│   ├── .env.example          # Environment template
│   └── package.json
│
├── 📂 frontend/              # Next.js Frontend
│   ├── 📂 src/
│   │   ├── 📂 app/           # App Router (Next.js 14)
│   │   │   ├── 📂 (shop)/    # Shop pages
│   │   │   ├── 📂 (auth)/    # Auth pages
│   │   │   ├── 📂 (dashboard)/# Seller dashboard
│   │   │   ├── 📂 admin/     # Admin panel
│   │   │   └── 📂 api/       # API routes
│   │   ├── 📂 components/    # React components
│   │   │   ├── 📂 ui/        # UI primitives
│   │   │   ├── 📂 shared/    # Shared components
│   │   │   ├── 📂 layout/    # Layout components
│   │   │   └── 📂 forms/     # Form components
│   │   ├── 📂 hooks/         # Custom React hooks
│   │   ├── 📂 lib/           # Utility functions
│   │   ├── 📂 stores/        # Zustand stores
│   │   ├── 📂 types/         # TypeScript types
│   │   ├── 📂 styles/        # Global styles
│   │   └── 📂 public/        # Static assets
│   ├── .env.example          # Environment template
│   └── package.json
│
├── 📂 docs/                  # Additional documentation
│   ├── 📂 assets/            # Images & logos
│   ├── 📂 diagrams/          # Architecture diagrams
│   └── 📂 guides/            # User guides
│
├── 📂 infrastructure/        # Infrastructure as Code
│   ├── 📂 docker/            # Docker configurations
│   ├── 📂 k8s/               # Kubernetes manifests
│   ├── 📂 terraform/         # Terraform configs
│   └── 📂 monitoring/        # Prometheus/Grafana
│
└── 📂 scripts/               # Automation scripts
    ├── setup.sh              # One-click setup
    ├── deploy.sh             # Deployment script
    └── backup.sh             # Backup script
```

---

## 🔌 API Documentation

Complete API documentation is available in [API.md](./API.md).

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create new account |
| `/auth/login` | POST | Authenticate user |
| `/products` | GET | List all products |
| `/products/:id` | GET | Get product details |
| `/cart` | GET | Get user's cart |
| `/orders` | POST | Create new order |
| `/payments/process` | POST | Process payment |

Interactive API documentation (Swagger UI) is available at `/api/docs` when running the backend server.

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Branch naming conventions
- Commit message format
- Pull request process

### Quick Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 BHD Oman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 Contact

<div align="center">

### BHD Oman

**Email**: support@bhd.om

**Phone**: +968 1234 5678

**Website**: [https://bhd.om](https://bhd.om)

**Address**: Sultan Qaboos Street, Muscat, Sultanate of Oman

---

<p align="center">
  <a href="https://twitter.com/bhdoman">
    <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter"/>
  </a>
  <a href="https://instagram.com/bhdoman">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"/>
  </a>
  <a href="https://linkedin.com/company/bhd-oman">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
  <a href="https://wa.me/96812345678">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp"/>
  </a>
</p>

<p align="center">
  <sub>Built with ❤️ in 🇴🇲 Oman</sub>
</p>

</div>
