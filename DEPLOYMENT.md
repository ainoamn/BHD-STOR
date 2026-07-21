# BHD Oman Marketplace - Deployment Guide

<div align="center">

![Deployment](https://img.shields.io/badge/DEPLOYMENT-GUIDE-E74C3C?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![Kubernetes](https://img.shields.io/badge/K8s-Supported-326CE5?style=for-the-badge&logo=kubernetes)

**Complete deployment guide for production environments**

</div>

---

## 📋 Table of Contents

- [Server Requirements](#-server-requirements)
- [Docker Deployment](#-docker-deployment)
- [Domain & SSL](#-domain-and-ssl-setup)
- [Environment Variables](#-production-environment-variables)
- [Database Migration](#-database-migration-on-production)
- [Monitoring](#-monitoring-setup)
- [Backup Strategy](#-backup-strategy)
- [Scaling](#-scaling-strategy)
- [Security Checklist](#-security-checklist)
- [Rollback Procedure](#-rollback-procedure)

---

## 🖥️ Server Requirements

### Minimum Requirements (Development / Small Production)

| Resource | Minimum | Notes |
|----------|---------|-------|
| **CPU** | 4 cores | Intel Xeon or AMD EPYC |
| **RAM** | 8 GB | DDR4 ECC recommended |
| **Disk** | 100 GB SSD | NVMe preferred |
| **Network** | 1 Gbps | Dedicated bandwidth |
| **OS** | Ubuntu 22.04 LTS | Or Debian 12 / CentOS 9 |

### Recommended Requirements (Production)

| Resource | Recommended | Notes |
|----------|-------------|-------|
| **CPU** | 8+ cores | For high-traffic workloads |
| **RAM** | 32 GB | With Redis and PostgreSQL on same node |
| **Disk** | 500 GB SSD | For media storage and database |
| **Network** | 10 Gbps | For high-availability setups |
| **OS** | Ubuntu 24.04 LTS | Latest LTS with 10-year support |

### High Availability Requirements (Enterprise)

| Component | Specification | Count |
|-----------|--------------|-------|
| **Load Balancer** | Nginx Plus / HAProxy | 2 (active-passive) |
| **App Servers** | 8 cores, 16 GB RAM | 3+ (auto-scaling) |
| **Database** | 8 cores, 32 GB RAM | 2 (primary-replica) |
| **Cache** | 4 cores, 8 GB RAM | 2 (Redis Cluster) |
| **File Storage** | S3-compatible | 1 (clustered) |

### Supported Cloud Providers

| Provider | Recommended Instance | Cost/Month (est.) |
|----------|---------------------|-------------------|
| **AWS** | c6i.2xlarge + RDS | $300-500 |
| **GCP** | e2-standard-8 + Cloud SQL | $250-400 |
| **Azure** | D8s_v5 + Azure Database | $300-500 |
| **DigitalOcean** | 8 GB RAM Droplet + Managed DB | $100-200 |
| **Linode** | Dedicated 8 GB + Managed DB | $100-200 |
| **OVH** | Advance-2-8GB | $80-150 |

---

## 🐳 Docker Deployment

### Single Server Deployment

#### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 2. Prepare the Server

```bash
# Create application directory
sudo mkdir -p /opt/bhd-marketplace
cd /opt/bhd-marketplace

# Create necessary directories
sudo mkdir -p {uploads,logs,backups,postgres-data,redis-data}
sudo chmod 755 uploads logs backups

# Set proper permissions
sudo chown -R 1000:1000 uploads logs backups
```

#### 3. Create Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: bhd-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: bhd_marketplace
      POSTGRES_USER: bhd_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - bhd-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bhd_user -d bhd_marketplace"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: bhd-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - ./redis-data:/data
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - bhd-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bhd-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://bhd_user:${DB_PASSWORD}@postgres:5432/bhd_marketplace?schema=public
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      THAWANI_SECRET_KEY: ${THAWANI_SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      S3_BUCKET_NAME: ${S3_BUCKET_NAME}
    env_file:
      - ./backend/.env
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "127.0.0.1:3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - bhd-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bhd-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.bhd.om
      NEXT_PUBLIC_APP_URL: https://bhd.om
    env_file:
      - ./frontend/.env.local
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - backend
    networks:
      - bhd-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: bhd-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/www:/var/www:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - bhd-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

  # Queue Workers
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bhd-worker
    restart: unless-stopped
    command: npm run worker
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bhd_user:${DB_PASSWORD}@postgres:5432/bhd_marketplace?schema=public
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
    networks:
      - bhd-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

networks:
  bhd-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

#### 4. Create Nginx Configuration

```nginx
# nginx/conf.d/bhd.om.conf
server {
    listen 80;
    server_name bhd.om www.bhd.om api.bhd.om;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl http2;
    server_name bhd.om www.bhd.om;
    
    # SSL Certificates (will be created by Certbot)
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.thawani.om; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.bhd.om https://api.openai.com; frame-src https://js.stripe.com https://checkout.thawani.om;" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Static files caching
    location /_next/static {
        proxy_pass http://frontend:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
    
    location /static {
        proxy_pass http://frontend:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Next.js frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}

server {
    listen 443 ssl http2;
    server_name api.bhd.om;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # API rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://bhd.om' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Proxy to NestJS backend
    location / {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
    
    # WebSocket support for chat
    location /socket.io/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
```

#### 5. Deploy

```bash
# Pull latest code
cd /opt/bhd-marketplace
git pull origin main

# Create production environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit environment files with production values
nano backend/.env
nano frontend/.env.local

# Build and start containers
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔒 Domain and SSL Setup

### DNS Configuration

Add these DNS records for your domain:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | Your Server IP | 3600 |
| A | `www` | Your Server IP | 3600 |
| A | `api` | Your Server IP | 3600 |
| A | `admin` | Your Server IP | 3600 |
| CNAME | `cdn` | `your-cdn.bhd.om` | 3600 |

### Let's Encrypt SSL (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (standalone method)
sudo certbot certonly --standalone -d bhd.om -d www.bhd.om -d api.bhd.om -d admin.bhd.om

# Copy certificates to nginx directory
sudo mkdir -p /opt/bhd-marketplace/nginx/ssl
sudo cp /etc/letsencrypt/live/bhd.om/fullchain.pem /opt/bhd-marketplace/nginx/ssl/
sudo cp /etc/letsencrypt/live/bhd.om/privkey.pem /opt/bhd-marketplace/nginx/ssl/

# Set proper permissions
sudo chmod 600 /opt/bhd-marketplace/nginx/ssl/*.pem

# Auto-renewal (Certbot sets up a cron job automatically)
# Verify renewal works:
sudo certbot renew --dry-run

# Restart nginx container
docker-compose -f docker-compose.prod.yml restart nginx
```

### SSL Certificate Auto-Renewal

```bash
# Add to crontab
sudo crontab -e

# Add this line for automatic renewal
0 3 * * * certbot renew --quiet --deploy-hook "docker restart bhd-nginx"
```

---

## ⚙️ Production Environment Variables

### Backend `.env` (Production)

```env
# Application
NODE_ENV=production
PORT=3001
API_PREFIX=/api
API_VERSION=v1
APP_URL=https://bhd.om
ADMIN_URL=https://bhd.om/admin

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=bhd_marketplace
DB_USER=bhd_user
DB_PASSWORD=STRONG_DATABASE_PASSWORD_HERE
DATABASE_URL="postgresql://bhd_user:STRONG_DATABASE_PASSWORD_HERE@postgres:5432/bhd_marketplace?schema=public"

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD_HERE
REDIS_URL=redis://:STRONG_REDIS_PASSWORD_HERE@redis:6379/0
REDIS_CACHE_TTL=3600
REDIS_SESSION_TTL=604800

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_STRING
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_64_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=REPLACE_WITH_32_CHAR_RANDOM_STRING

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10

# CORS
CORS_ORIGIN=https://bhd.om
CORS_CREDENTIALS=true

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Thawani
THAWANI_SECRET_KEY=YOUR_LIVE_THAWANI_SECRET
THAWANI_PUBLISHABLE_KEY=YOUR_LIVE_THAWANI_PUBLIC
THAWANI_ENV=production
THAWANI_API_URL=https://checkout.thawani.om

# OpenAI
OPENAI_API_KEY=sk-YOUR_LIVE_OPENAI_KEY

# SendGrid
SENDGRID_API_KEY=SG.YOUR_LIVE_SENDGRID_KEY

# AWS S3
AWS_REGION=me-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
S3_BUCKET_NAME=bhd-marketplace-production
S3_PUBLIC_URL=https://cdn.bhd.om

# Email
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@bhd.om
EMAIL_FROM_NAME="BHD Oman Marketplace"

# SMS
TWILIO_ACCOUNT_SID=AC_YOUR_LIVE_SID
TWILIO_AUTH_TOKEN=YOUR_LIVE_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+968XXXXXXX

# Monitoring
PROMETHEUS_ENABLED=true
SENTRY_ENABLED=true
SENTRY_DSN=https://YOUR_SENTRY_DSN.ingest.sentry.io/PROJECT_ID

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/app.log
```

### Frontend `.env.local` (Production)

```env
NEXT_PUBLIC_API_URL=https://api.bhd.om
NEXT_PUBLIC_APP_URL=https://bhd.om
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEFAULT_LOCALE=ar

NEXTAUTH_URL=https://bhd.om
NEXTAUTH_SECRET=REPLACE_WITH_STRONG_SECRET

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
NEXT_PUBLIC_THAWANI_PUBLIC_KEY=YOUR_LIVE_THAWANI_PUBLIC
NEXT_PUBLIC_THAWANI_ENV=production

NEXT_PUBLIC_OPENAI_API_KEY=sk-YOUR_LIVE_OPENAI_KEY
NEXT_PUBLIC_ENABLE_AI_CHAT=true

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY=YOUR_API_KEY

NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX
NEXT_PUBLIC_ENABLE_ANALYTICS=true

NEXT_PUBLIC_FEATURE_MARKETPLACE=true
NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS=true
NEXT_PUBLIC_FEATURE_CHAT=true
NEXT_PUBLIC_FEATURE_AI_ASSISTANT=true

NEXT_PUBLIC_PUSHER_APP_KEY=YOUR_PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=mt1

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY
```

---

## 🗄️ Database Migration on Production

### Pre-Migration Checklist

- [ ] Create full database backup
- [ ] Test migrations on staging environment
- [ ] Schedule maintenance window
- [ ] Notify users of potential downtime
- [ ] Prepare rollback plan

### Migration Steps

```bash
# 1. Create backup before migration
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U bhd_user -d bhd_marketplace > backups/pre-migration-$(date +%Y%m%d-%H%M%S).sql

# 2. Put application in maintenance mode
docker-compose -f docker-compose.prod.yml exec backend touch /app/maintenance.on

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 4. Verify migrations applied successfully
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# 5. If migrations succeed, restart backend
docker-compose -f docker-compose.prod.yml restart backend

# 6. Remove maintenance mode
docker-compose -f docker-compose.prod.yml exec backend rm /app/maintenance.on

# 7. Verify application health
curl -f https://api.bhd.om/health || echo "Health check failed!"
```

### Rollback Procedure (if migration fails)

```bash
# 1. Stop the backend
docker-compose -f docker-compose.prod.yml stop backend

# 2. Restore database from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
  -U bhd_user -d bhd_marketplace < backups/pre-migration-YYYYMMDD-HHMMSS.sql

# 3. Restart backend
docker-compose -f docker-compose.prod.yml start backend

# 4. Verify
curl -f https://api.bhd.om/health
```

---

## 📊 Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'bhd-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'bhd-frontend'
    static_configs:
      - targets: ['frontend:3000']
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 15s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 15s

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    scrape_interval: 15s
```

### Add to Docker Compose

```yaml
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: bhd-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"
    networks:
      - bhd-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: bhd-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "127.0.0.1:3003:3000"
    networks:
      - bhd-network

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: bhd-node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - bhd-network

volumes:
  prometheus-data:
  grafana-data:
```

### Grafana Dashboard

Access Grafana at `http://localhost:3003` (configure Nginx for external access).

**Key Metrics to Monitor:**

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| API Response Time (p95) | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 80% | > 95% |
| Disk Usage | > 80% | > 90% |
| Database Connections | > 80% pool | > 95% pool |
| Redis Memory | > 80% maxmemory | > 95% maxmemory |
| Queue Size | > 100 | > 1000 |

### Health Check Endpoint

```bash
# Check application health
curl https://api.bhd.om/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai_service": "available"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

---

## 💾 Backup Strategy

### Automated Daily Backups

```bash
#!/bin/bash
# /opt/bhd-marketplace/scripts/backup.sh

BACKUP_DIR="/opt/bhd-marketplace/backups"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30
S3_BUCKET="s3://bhd-marketplace-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker-compose -f /opt/bhd-marketplace/docker-compose.prod.yml exec -T postgres \
  pg_dump -U bhd_user -d bhd_marketplace | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Backup Redis
echo "Backing up Redis..."
docker-compose -f /opt/bhd-marketplace/docker-compose.prod.yml exec -T redis \
  redis-cli BGSAVE
docker cp bhd-redis:/data/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Backup uploads
echo "Backing up uploads..."
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz -C /opt/bhd-marketplace uploads/

# Upload to S3
echo "Uploading to S3..."
aws s3 sync $BACKUP_DIR/ $S3_BUCKET/backups/ --exclude "*" --include "db-*.sql.gz" --include "redis-*.rdb" --include "uploads-*.tar.gz"

# Clean old local backups
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "redis-*.rdb" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Clean old S3 backups
aws s3 ls $S3_BUCKET/backups/ | awk '{print $4}' | sort -r | tail -n +31 | xargs -I {} aws s3 rm $S3_BUCKET/backups/{}

echo "Backup completed: $DATE"
```

### Add to Crontab

```bash
# Edit crontab
sudo crontab -e

# Run backup daily at 3 AM
0 3 * * * /opt/bhd-marketplace/scripts/backup.sh >> /var/log/bhd-backup.log 2>&1
```

### Manual Backup Commands

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U bhd_user -d bhd_marketplace > backup.sql

# Redis backup
docker-compose -f docker-compose.prod.yml exec redis redis-cli SAVE
docker cp bhd-redis:/data/dump.rdb redis-backup.rdb

# Uploads backup
tar -czf uploads-backup.tar.gz uploads/
```

---

## 📈 Scaling Strategy

### Vertical Scaling (Scale Up)

Increase resources on existing servers:

```yaml
# docker-compose.prod.yml - increase limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 4G  # Increase from 1G
          cpus: '2.0'  # Increase from 1.0
```

### Horizontal Scaling (Scale Out)

Run multiple backend instances behind load balancer:

```yaml
# docker-compose.scale.yml
services:
  backend-1:
    extends:
      file: docker-compose.prod.yml
      service: backend
    ports:
      - "3001:3001"

  backend-2:
    extends:
      file: docker-compose.prod.yml
      service: backend
    ports:
      - "3002:3001"

  backend-3:
    extends:
      file: docker-compose.prod.yml
      service: backend
    ports:
      - "3003:3001"

  nginx:
    # Update upstream to use all backends
    # backend 127.0.0.1:3001;
    # backend 127.0.0.1:3002;
    # backend 127.0.0.1:3003;
```

### Kubernetes Deployment (Enterprise)

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bhd-backend
  namespace: bhd-marketplace
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bhd-backend
  template:
    metadata:
      labels:
        app: bhd-backend
    spec:
      containers:
        - name: backend
          image: bhd/marketplace-backend:latest
          ports:
            - containerPort: 3001
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          envFrom:
            - configMapRef:
                name: bhd-backend-config
            - secretRef:
                name: bhd-backend-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bhd-backend-hpa
  namespace: bhd-marketplace
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bhd-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Scaling Checklist

- [ ] Implement Redis clustering for session sharing
- [ ] Configure PostgreSQL read replicas
- [ ] Set up load balancer health checks
- [ ] Implement database connection pooling (PgBouncer)
- [ ] Configure CDN for static assets
- [ ] Enable application-level caching
- [ ] Set up queue workers on separate instances
- [ ] Monitor and alert on resource usage

---

## ✅ Security Checklist

### Pre-Deployment Security Checks

- [ ] **Environment Variables**
  - [ ] All secrets use strong random values (min 32 chars)
  - [ ] JWT secrets different for access and refresh tokens
  - [ ] Database password strong and unique
  - [ ] No default passwords in production
  - [ ] `.env` file not committed to git

- [ ] **SSL/TLS**
  - [ ] Valid SSL certificate installed
  - [ ] HTTPS enforced (HTTP redirects to HTTPS)
  - [ ] TLS 1.2+ only (disable older versions)
  - [ ] HSTS header enabled
  - [ ] SSL certificate auto-renewal configured

- [ ] **Headers**
  - [ ] X-Frame-Options: DENY or SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy configured
  - [ ] Referrer-Policy: strict-origin-when-cross-origin

- [ ] **Authentication**
  - [ ] Strong password policy enforced
  - [ ] Rate limiting on auth endpoints
  - [ ] Account lockout after failed attempts
  - [ ] JWT tokens have short expiry
  - [ ] Refresh tokens rotate on use

- [ ] **Database**
  - [ ] Strong database password
  - [ ] Database not exposed to internet
  - [ ] Connection SSL enforced
  - [ ] Regular backups configured
  - [ ] Sensitive data encrypted at rest

- [ ] **API Security**
  - [ ] Rate limiting enabled
  - [ ] CORS properly configured
  - [ ] Input validation on all endpoints
  - [ ] SQL injection prevention (Prisma/ORM)
  - [ ] XSS prevention (output encoding)

- [ ] **Infrastructure**
  - [ ] Firewall configured (ufw/iptables)
  - [ ] Only necessary ports open (80, 443)
  - [ ] SSH key authentication only
  - [ ] Automatic security updates enabled
  - [ ] Intrusion detection (Fail2ban)

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Audit logging enabled
  - [ ] Suspicious activity alerts
  - [ ] Failed login monitoring
  - [ ] Database access monitoring

### Security Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Install Fail2ban
sudo apt install -y fail2ban

# Configure SSH security
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## ↩️ Rollback Procedure

### Quick Rollback (Emergency)

```bash
#!/bin/bash
# /opt/bhd-marketplace/scripts/rollback.sh

VERSION=$1  # Version tag to rollback to (e.g., v1.0.0)

echo "Starting rollback to $VERSION..."

# 1. Put in maintenance mode
docker-compose -f docker-compose.prod.yml exec backend touch /app/maintenance.on

# 2. Stop current containers
docker-compose -f docker-compose.prod.yml stop backend frontend worker

# 3. Checkout previous version
cd /opt/bhd-marketplace
git checkout $VERSION

# 4. Rebuild containers with previous code
docker-compose -f docker-compose.prod.yml build backend frontend worker

# 5. Start containers
docker-compose -f docker-compose.prod.yml up -d backend frontend worker

# 6. Run any necessary migrations (downgrade if needed)
# docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --rolled-back "migration_name"

# 7. Verify health
sleep 10
curl -f https://api.bhd.om/health

if [ $? -eq 0 ]; then
  echo "Rollback successful! Removing maintenance mode..."
  docker-compose -f docker-compose.prod.yml exec backend rm -f /app/maintenance.on
else
  echo "Rollback verification failed! Check logs immediately."
  docker-compose -f docker-compose.prod.yml logs backend
fi
```

### Rollback Commands

```bash
# Emergency rollback to previous version
./scripts/rollback.sh v1.0.0

# Rollback database (use with caution!)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --rolled-back "20240101000000_migration_name"

# Restore database from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
  -U bhd_user -d bhd_marketplace < backups/db-YYYYMMDD-HHMMSS.sql.gz

# View previous deployment versions
git tag --sort=-version:refname

# Rollback Docker images (if using tagged images)
docker pull bhd/marketplace-backend:v1.0.0
docker pull bhd/marketplace-frontend:v1.0.0
```

### Blue-Green Deployment (Zero Downtime)

```bash
#!/bin/bash
# Blue-Green deployment script

# Deploy to green environment
docker-compose -f docker-compose.green.yml up -d

# Run health checks
sleep 30
curl -f http://green:3001/health

# Switch load balancer to green
# Update Nginx upstream to point to green
sudo sed -i 's/blue:3001/green:3001/' /etc/nginx/conf.d/upstream.conf
sudo nginx -s reload

# Keep blue running for quick rollback
# After 1 hour of stability, stop blue
sleep 3600
docker-compose -f docker-compose.blue.yml down
```

---

<div align="center">

**[⬅️ Back to README](./README.md)** | **[📖 Setup Guide](./SETUP.md)** | **[🔐 Security](./SECURITY.md)**

Made with ❤️ in 🇴🇲 Oman

</div>
