# BHD Oman Marketplace - Complete Setup Guide

<div align="center">

![Setup Guide](https://img.shields.io/badge/SETUP-GUIDE-2ECC71?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-3498DB?style=for-the-badge)
![Difficulty](https://img.shields.io/badge/Difficulty-Intermediate-E67E22?style=for-the-badge)

**Step-by-step guide to get BHD Oman Marketplace running on your local machine**

</div>

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Clone Repository](#-clone-the-repository)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [Docker Setup](#-docker-setup)
- [Verify Installation](#-verify-installation)
- [Common Issues](#-common-issues-and-solutions)
- [Next Steps](#-next-steps)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Node.js** | >= 20.x LTS | [Download](https://nodejs.org/en/download) | JavaScript runtime |
| **npm** | >= 10.x | Included with Node.js | Package manager |
| **PostgreSQL** | >= 16.x | [Download](https://www.postgresql.org/download/) | Primary database |
| **Redis** | >= 7.x | [Download](https://redis.io/download/) | Cache & sessions |
| **Git** | >= 2.40 | [Download](https://git-scm.com/downloads) | Version control |

### Verify Prerequisites

Run these commands to verify your environment:

```bash
# Check Node.js version
node --version
# Expected: v20.x.x or higher

# Check npm version
npm --version
# Expected: 10.x.x or higher

# Check PostgreSQL version
psql --version
# Expected: 16.x or higher

# Check Redis version
redis-server --version
# Expected: v=7.x.x or higher

# Check Git version
git --version
# Expected: 2.40.x or higher
```

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 20 GB SSD | 50 GB SSD |
| OS | macOS / Linux / WSL2 | Ubuntu 22.04 LTS |

### macOS Prerequisites Setup

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install all prerequisites using Homebrew
brew install node@20 postgresql@16 redis git

# Start services
brew services start postgresql@16
brew services start redis

# Verify PostgreSQL is running
brew services list | grep postgresql
```

### Ubuntu/Debian Prerequisites Setup

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16

# Install Redis
sudo apt install -y redis-server

# Install Git
sudo apt install -y git

# Start and enable services
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Windows Prerequisites Setup

> **Note**: We strongly recommend using WSL2 (Windows Subsystem for Linux) for development.

```powershell
# Install WSL2 (run in PowerShell as Administrator)
wsl --install -d Ubuntu-22.04

# Then follow the Ubuntu/Debian setup instructions above
```

---

## 📥 Clone the Repository

```bash
# Clone the repository
git clone https://github.com/bhd-oman/marketplace.git

# Navigate to the project directory
cd marketplace

# The project structure should look like:
# marketplace/
# ├── backend/
# ├── frontend/
# ├── docker-compose.yml
# ├── README.md
# └── ...
```

---

## 🖥️ Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
# Install all required npm packages
npm install

# If you encounter permission errors, try:
# npm install --unsafe-perm

# The installation may take 2-5 minutes depending on your connection
```

**Expected output:**
```
added 1847 packages in 45s

> @bhd/marketplace-backend@1.0.0 postinstall
> prisma generate

Prisma Client generated successfully.
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Open .env in your editor and update the values
# For development, you typically need to change:
# - DB_PASSWORD
# - JWT_SECRET
# - REDIS_PASSWORD (if using password)
```

**Required environment variables for local development:**

```env
# Application
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000

# Database (update with your PostgreSQL credentials)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bhd_marketplace
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/bhd_marketplace?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379/0

# JWT (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-different-super-secret-refresh-key-min-32-chars

# Encryption
ENCRYPTION_KEY=your-256-bit-encryption-key-32-characters!

# Email (for development, you can use Mailtrap or similar)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password

# Stripe (optional - for payment testing)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# File Upload (use local storage for development)
# Leave AWS/Cloudinary configs empty for local file storage

# AI Services (optional)
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
```

### Step 4: Create the Database

```bash
# Create the PostgreSQL database
# Log into PostgreSQL
sudo -u postgres psql

# In the psql prompt:
CREATE DATABASE bhd_marketplace;
CREATE USER bhd_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bhd_marketplace TO bhd_user;
\q

# Or on macOS with Homebrew:
createdb bhd_marketplace
```

### Step 5: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npm run migration:run

# Or using Prisma directly:
npx prisma migrate deploy
```

**Expected output:**
```
Prisma Client generated at ./node_modules/@prisma/client

Applying migration `20240101000001_init`
Applying migration `20240101000002_add_users`
Applying migration `20240101000003_add_stores`
...

All migrations have been successfully applied.
```

### Step 6: Seed the Database

```bash
# Run database seeders to populate initial data
npm run seed
```

**This will create:**
- Default admin user (`admin@bhd.om` / `Admin@123`)
- Default seller user (`seller@bhd.om` / `Seller@123`)
- Default buyer user (`buyer@bhd.om` / `Buyer@123`)
- Product categories (Electronics, Fashion, Home, etc.)
- Sample products
- Sample orders
- Subscription plans

**Expected output:**
```
🌱 Starting database seed...
✅ Admin user created: admin@bhd.om
✅ Seller user created: seller@bhd.om
✅ Buyer user created: buyer@bhd.om
✅ 12 categories created
✅ 50 products created
✅ 10 orders created
✅ 3 subscription plans created
🎉 Database seeding completed successfully!
```

### Step 7: Start the Development Server

```bash
# Start in development mode (with hot reload)
npm run start:dev

# Or start normally
npm run start

# Or start in debug mode
npm run start:debug
```

**Expected output:**
```
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2024, 10:00:01 AM     LOG [PrismaService] Connected to PostgreSQL
[Nest] 12345  - 01/01/2024, 10:00:01 AM     LOG [RedisService] Connected to Redis
[Nest] 12345  - 01/01/2024, 10:00:02 AM     LOG [RoutesResolver] AuthController {/api/auth}
[Nest] 12345  - 01/01/2024, 10:00:02 AM     LOG [RoutesResolver] UsersController {/api/users}
[Nest] 12345  - 01/01/2024, 10:00:02 AM     LOG [RoutesResolver] ProductsController {/api/products}
[Nest] 12345  - 01/01/2024, 10:00:02 AM     LOG [RoutesResolver] OrdersController {/api/orders}
...
[Nest] 12345  - 01/01/2024, 10:00:03 AM     LOG [NestApplication] Server running on http://localhost:3001
```

The backend API is now running at **http://localhost:3001**.

---

## 🎨 Frontend Setup

### Step 1: Open a New Terminal

Keep the backend server running and open a new terminal window/tab.

### Step 2: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 3: Install Dependencies

```bash
# Install all required npm packages
npm install

# If you encounter peer dependency warnings, you can use:
# npm install --legacy-peer-deps
```

**Expected output:**
```
added 2456 packages in 60s
```

### Step 4: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Open .env.local and update:
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Required environment variables for local development:**

```env
# Core
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEFAULT_LOCALE=ar

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-development-secret-key

# Payments (Stripe test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# AI (optional)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your_key
NEXT_PUBLIC_ENABLE_AI_CHAT=true

# Features
NEXT_PUBLIC_FEATURE_MARKETPLACE=true
NEXT_PUBLIC_FEATURE_CHAT=true
NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=true
```

### Step 5: Start the Development Server

```bash
# Start in development mode (with hot reload)
npm run dev

# Or start with Turbopack (faster, experimental)
npm run dev:turbo
```

**Expected output:**
```
> @bhd/marketplace-frontend@1.0.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local
  - Experiments (use at your own risk):
     · turbo

 ✓ Ready in 3.2s
```

The frontend is now running at **http://localhost:3000**.

---

## 🐳 Docker Setup (Alternative)

If you prefer using Docker, you can set up the entire stack with a single command.

### Prerequisites for Docker

| Software | Version | Download |
|----------|---------|----------|
| **Docker** | >= 24.x | [Download](https://docs.docker.com/get-docker/) |
| **Docker Compose** | >= 2.20 | Included with Docker Desktop |

### Step 1: Verify Docker Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 24.x.x or higher

# Check Docker Compose version
docker compose version
# Expected: Docker Compose version v2.20.x or higher
```

### Step 2: Configure Environment Variables

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit the files with your preferred editor
# The Docker setup uses service names as hostnames:
# DB_HOST=postgres
# REDIS_HOST=redis
```

### Step 3: Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# Or build fresh images before starting
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

**Expected output:**
```
[+] Building 3/3
 ✔ Service backend    Built                                  45.2s
 ✔ Service frontend   Built                                  30.1s
[+] Running 5/5
 ✔ Network marketplace_default    Created                     0.1s
 ✔ Container marketplace-postgres Started                     1.2s
 ✔ Container marketplace-redis    Started                     1.0s
 ✔ Container marketplace-backend  Started                     2.5s
 ✔ Container marketplace-frontend Started                     2.8s

🎉 BHD Oman Marketplace is running!
   Frontend: http://localhost:3000
   Backend API: http://localhost:3001
   API Docs: http://localhost:3001/api/docs
   PostgreSQL: localhost:5432
   Redis: localhost:6379
```

### Step 4: Run Migrations and Seed (First Time Only)

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database
docker-compose exec backend npm run seed
```

### Step 5: Stopping Docker Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (resets database!)
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### Docker Services Overview

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| PostgreSQL | marketplace-postgres | 5432 | Primary database |
| Redis | marketplace-redis | 6379 | Cache & sessions |
| Backend API | marketplace-backend | 3001 | NestJS API server |
| Frontend | marketplace-frontend | 3000 | Next.js web app |

---

## ✅ Verify Installation

### 1. Health Check Endpoints

```bash
# Check backend health
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai_service": "available"
  },
  "version": "1.0.0"
}
```

### 2. API Documentation (Swagger UI)

Open your browser and navigate to:
- **http://localhost:3001/api/docs**

You should see the Swagger UI with all available API endpoints.

### 3. Test Authentication Endpoints

```bash
# Register a new user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+96812345678"
  }'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'

# Expected response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### 4. Test Product Endpoints

```bash
# List products
curl http://localhost:3001/api/v1/products

# Get product by ID
curl http://localhost:3001/api/v1/products/1

# Search products
curl "http://localhost:3001/api/v1/products?search=laptop&category=electronics"
```

### 5. Test Frontend

Open **http://localhost:3000** in your browser. You should see:

- [ ] Homepage with product listings
- [ ] Navigation with categories
- [ ] Search bar
- [ ] Login/Register buttons
- [ ] Language switcher (AR/EN)
- [ ] Shopping cart icon

### 6. Login with Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bhd.om` | `Admin@123` |
| Seller | `seller@bhd.om` | `Seller@123` |
| Buyer | `buyer@bhd.om` | `Buyer@123` |

---

## 🐛 Common Issues and Solutions

### Issue 1: `npm install` fails with permission errors

**Problem:** EACCES permission errors during npm install

**Solution:**
```bash
# Change npm's default directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use npx without installing globally
npx <package-name>
```

### Issue 2: PostgreSQL connection refused

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Start PostgreSQL if not running
sudo systemctl start postgresql  # Linux
brew services start postgresql@16  # macOS

# Verify database exists
sudo -u postgres psql -l | grep bhd_marketplace

# Create database if missing
sudo -u postgres createdb bhd_marketplace
```

### Issue 3: Redis connection failed

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Check Redis status
redis-cli ping

# Start Redis
redis-server --daemonize yes  # Linux/macOS
brew services start redis  # macOS with Homebrew

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Issue 4: Prisma migration fails

**Problem:** Migration fails with database error

**Solution:**
```bash
# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# Or reset and apply migrations fresh
npx prisma migrate dev --name init

# Check database connection
npx prisma db pull
```

### Issue 5: Port already in use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using the port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
# Or change the port in .env
PORT=3002
```

### Issue 6: CORS errors in browser

**Problem:** `Access to fetch at 'http://localhost:3001/api/...' blocked by CORS policy`

**Solution:**
```bash
# Ensure CORS_ORIGIN in backend .env includes your frontend URL
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Restart the backend after changing .env
npm run start:dev
```

### Issue 7: JWT token errors

**Problem:** `Unauthorized: Invalid or expired token`

**Solution:**
```bash
# Check JWT_SECRET is set correctly in backend .env
# Ensure JWT_SECRET is at least 32 characters long
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Clear browser localStorage and cookies
# Login again to get fresh tokens
```

### Issue 8: Frontend build errors

**Problem:** TypeScript or build errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build the application
npm run build
```

### Issue 9: File upload fails

**Problem:** `413 Payload Too Large` or upload timeout

**Solution:**
```bash
# In backend .env, increase file size limit
MAX_FILE_SIZE=52428800  # 50MB

# For local development, files are stored in ./uploads
# Ensure the directory exists and is writable
mkdir -p uploads/products uploads/avatars uploads/stores
```

### Issue 10: Environment variables not loading

**Problem:** Application says env vars are missing

**Solution:**
```bash
# Ensure .env file exists in the correct location
ls backend/.env
ls frontend/.env.local

# Restart the server after creating .env
# Environment variables are loaded at startup only

# Check variable names match exactly (case-sensitive!)
```

---

## 🚀 Next Steps

Congratulations! Your BHD Oman Marketplace is now running locally.

### Explore the Application

- 🌐 **Web App**: http://localhost:3000
- 📚 **API Docs**: http://localhost:3001/api/docs
- 📊 **Admin Panel**: http://localhost:3000/admin

### Create Your First Store

1. Login as `seller@bhd.om`
2. Navigate to "My Store" in the dashboard
3. Click "Create Store"
4. Fill in store details and upload a logo
5. Start adding products!

### Place a Test Order

1. Register a new buyer account
2. Browse products and add to cart
3. Proceed to checkout
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete the order!

### Read More Documentation

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | Complete API reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [SECURITY.md](./SECURITY.md) | Security features & policies |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Detailed troubleshooting |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |

---

## 💬 Need Help?

If you encounter issues not covered here:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed fixes
2. Search existing [GitHub Issues](https://github.com/bhd-oman/marketplace/issues)
3. Join our [Discord Community](https://discord.gg/bhdoman)
4. Email us at **support@bhd.om**

---

<div align="center">

**Happy Coding!** 🎉

Made with ❤️ in 🇴🇲 Oman

</div>
