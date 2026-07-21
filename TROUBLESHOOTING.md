# BHD Oman Marketplace - Troubleshooting Guide

<div align="center">

![Troubleshooting](https://img.shields.io/badge/TROUBLESHOOTING-GUIDE-F39C12?style=for-the-badge)
![Issues](https://img.shields.io/badge/Common-Issues-E74C3C?style=for-the-badge)
![Solutions](https://img.shields.io/badge/Debug-Solutions-2ECC71?style=for-the-badge)

**Comprehensive debugging guide for common issues and solutions**

</div>

---

## 📋 Table of Contents

- [npm install fails](#1-npm-install-fails)
- [Database connection errors](#2-database-connection-errors)
- [Redis connection errors](#3-redis-connection-errors)
- [TypeScript compilation errors](#4-typescript-compilation-errors)
- [CORS errors](#5-cors-errors)
- [JWT token errors](#6-jwt-token-errors)
- [File upload errors](#7-file-upload-errors)
- [Payment gateway errors](#8-payment-gateway-errors)
- [Shipping API errors](#9-shipping-api-errors)
- [AI service errors](#10-ai-service-errors)
- [Docker issues](#11-docker-issues)
- [Memory issues](#12-memory-issues)
- [Performance issues](#13-performance-issues)

---

## 1. npm install fails

### Problem

Running `npm install` fails with various error messages and dependencies are not installed.

### Symptoms

```
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules/...
npm ERR! errno -13
```

```
npm ERR! code ECONNREFUSED
npm ERR! errno ECONNREFUSED
npm ERR! FetchError: request to https://registry.npmjs.org/... failed
```

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! Found: react@18.2.0
npm ERR! Could not resolve dependency: peer react@"^17.0.0"
```

### Causes

| Cause | Description |
|-------|-------------|
| Permission issues | npm lacks write permission to global directories |
| Network issues | Connection to npm registry failed |
| Proxy/VPN | Corporate proxy blocking npm registry |
| Node version | Incompatible Node.js version |
| Corrupted cache | npm cache contains corrupted data |
| Peer dependencies | Conflicting peer dependency versions |

### Solutions

#### Fix 1: Fix npm permissions

```bash
# Option A: Change npm prefix to user directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option B: Change Node.js installation ownership
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Option C: Use npx instead of global install
npx <package-name> instead of npm install -g <package-name>
```

#### Fix 2: Clear npm cache

```bash
# Clear npm cache
npm cache clean --force

# Verify cache
npm cache verify

# Try install again
npm install
```

#### Fix 3: Fix network issues

```bash
# Check internet connectivity
ping registry.npmjs.org

# Use different registry
npm config set registry https://registry.npmmirror.com  # China mirror
npm config set registry https://registry.npmjs.org       # Default

# Configure proxy (if behind corporate firewall)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

#### Fix 4: Fix peer dependency conflicts

```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or force install
npm install --force

# Check Node.js version
node --version  # Should be >= 20.x

# Use nvm to switch Node versions
nvm install 20
nvm use 20
```

#### Fix 5: Delete and reinstall

```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clear cache
npm cache clean --force

# Reinstall
npm install
```

### Prevention

- Use `.nvmrc` file to specify Node version
- Use `package-lock.json` to lock dependency versions
- Run `npm ci` in CI/CD pipelines instead of `npm install`
- Keep npm updated: `npm install -g npm@latest`

---

## 2. Database connection errors

### Problem

The application cannot connect to PostgreSQL database.

### Symptoms

```
Error: connect ECONNREFUSED 127.0.0.1:5432
PrismaClientInitializationError: Can't reach database server at localhost:5432
```

```
Error: P1001: Can't reach database server at postgres:5432
Error: authentication failed for user "bhd_user"
```

```
Error: P1003: Database bhd_marketplace does not exist
Error: timeout trying to connect
```

### Causes

| Cause | Description |
|-------|-------------|
| PostgreSQL not running | Database server is stopped |
| Wrong host/port | DATABASE_URL points to wrong server |
| Wrong credentials | Username or password incorrect |
| Database doesn't exist | Target database not created |
| Connection limit | Max connections reached |
| Firewall blocking | Firewall preventing connection |
| SSL required | SSL mode mismatch |

### Solutions

#### Fix 1: Check if PostgreSQL is running

```bash
# Check PostgreSQL status
sudo systemctl status postgresql        # Linux
brew services list | grep postgresql    # macOS

# Start PostgreSQL
sudo systemctl start postgresql         # Linux
brew services start postgresql@16       # macOS
pg_ctl -D /usr/local/var/postgres start # Direct start

# Check port
sudo lsof -i :5432                      # Check if port is in use
netstat -tlnp | grep 5432               # Alternative
```

#### Fix 2: Verify connection details

```bash
# Test connection with psql
psql -h localhost -U postgres -d bhd_marketplace -c "SELECT 1;"

# If connection fails, try with default user
sudo -u postgres psql -c "SELECT 1;"

# Check .env configuration
# DATABASE_URL should be:
# postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
```

#### Fix 3: Create database and user

```bash
# Log in as postgres superuser
sudo -u postgres psql

# In PostgreSQL prompt:
-- Create database
CREATE DATABASE bhd_marketplace;

-- Create user
CREATE USER bhd_user WITH ENCRYPTED PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bhd_marketplace TO bhd_user;

-- For Prisma migrations, grant schema creation
\c bhd_marketplace
GRANT ALL ON SCHEMA public TO bhd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bhd_user;

-- Exit
\q
```

#### Fix 4: Fix connection limit

```bash
# Check current connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Increase max connections in postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
# max_connections = 200

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Fix 5: SSL configuration

```env
# If SSL is not required (development)
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public&sslmode=disable"

# If SSL is required
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public&sslmode=require"
```

### Prevention

- Use connection pooling (PgBouncer) in production
- Set appropriate `max_connections` based on workload
- Monitor connection count with alerts
- Use environment-specific `.env` files
- Keep PostgreSQL updated

---

## 3. Redis connection errors

### Problem

The application cannot connect to Redis server.

### Symptoms

```
Error: Redis connection to localhost:6379 failed
ECONNREFUSED 127.0.0.1:6379
```

```
ReplyError: NOAUTH Authentication required
Error: Connection is closed
```

```
MaxRetriesPerRequestError: Reached the max retries per request limit
```

### Causes

| Cause | Description |
|-------|-------------|
| Redis not running | Server is stopped |
| Wrong host/port | Configuration points to wrong server |
| Authentication failed | Password incorrect or missing |
| Connection timeout | Network latency or firewall |
| Max clients reached | Connection limit reached |

### Solutions

#### Fix 1: Check Redis status

```bash
# Check if Redis is running
redis-cli ping
# Expected: PONG

# Check Redis server info
redis-cli info server

# Start Redis
redis-server --daemonize yes
brew services start redis  # macOS
sudo systemctl start redis # Linux

# Check port
lsof -i :6379
```

#### Fix 2: Fix authentication

```bash
# Test with password
redis-cli -a your_password ping

# Or authenticate after connection
redis-cli
AUTH your_password
PING

# If no password set but required, update redis.conf
sudo nano /etc/redis/redis.conf
# Set: requirepass your_password
# Or comment out to disable auth: # requirepass

# Restart Redis
sudo systemctl restart redis
```

#### Fix 3: Update application config

```env
# Ensure REDIS_URL matches your Redis configuration
REDIS_URL=redis://:password@localhost:6379/0       # With password
REDIS_URL=redis://localhost:6379/0                 # Without password
REDIS_URL=redis://:password@redis:6379/0           # Docker
```

#### Fix 4: Increase timeout and retries

```typescript
// In your Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000,    // 10 seconds
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});
```

### Prevention

- Use Redis Sentinel or Cluster for high availability
- Configure proper connection timeouts
- Monitor Redis memory usage
- Set up Redis persistence (RDB + AOF)

---

## 4. TypeScript compilation errors

### Problem

TypeScript compilation fails with type errors.

### Symptoms

```
TS2322: Type 'X' is not assignable to type 'Y'
TS2304: Cannot find name '...'
TS2307: Cannot find module '...' or its corresponding type declarations
TS2345: Argument of type '...' is not assignable to parameter of type '...'
```

### Causes

| Cause | Description |
|-------|-------------|
| Missing types | @types package not installed |
| Strict mode | Strict TypeScript settings |
| Version mismatch | TypeScript version incompatible |
| Import errors | Module resolution issues |
| Type definitions | Outdated or missing .d.ts files |

### Solutions

#### Fix 1: Install missing types

```bash
# Common missing type packages
npm install -D @types/node @types/react @types/react-dom
npm install -D @types/express @types/cors @types/bcrypt
npm install -D @types/jsonwebtoken @types/multer

# For Prisma
generate = ["npx prisma generate"]
```

#### Fix 2: Check tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

#### Fix 3: Fix module resolution

```bash
# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo

# Restart TypeScript service (VS Code)
Cmd+Shift+P → TypeScript: Restart TS Server

# Check for circular dependencies
deptree-circular src/
```

#### Fix 4: Skip library check

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Prevention

- Run `tsc --noEmit` in pre-commit hooks
- Use strict mode for better type safety
- Keep @types packages updated
- Use path mapping consistently

---

## 5. CORS errors

### Problem

Browser blocks API requests due to CORS policy.

### Symptoms

```
Access to fetch at 'http://localhost:3001/api/...' from origin 
'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

```
CORS policy: Response to preflight request doesn't pass access control check
CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response 
must not be the wildcard '*' when the request's credentials mode is 'include'
```

### Causes

| Cause | Description |
|-------|-------------|
| Missing CORS config | Server not configured for CORS |
| Wrong origin | Request origin not in allowed list |
| Credentials conflict | Wildcard with credentials |
| Preflight failure | OPTIONS request not handled |
| Missing headers | Required headers not allowed |

### Solutions

#### Fix 1: Configure CORS in NestJS

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://bhd.om',
      'https://www.bhd.om',
      'https://admin.bhd.om',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'Accept-Language',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
  
  await app.listen(3001);
}
bootstrap();
```

#### Fix 2: Environment-based CORS

```env
# .env (development)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# .env (production)
CORS_ORIGIN=https://bhd.om,https://www.bhd.om
```

#### Fix 3: Handle preflight

```typescript
// Ensure OPTIONS requests are handled
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    next();
  }
});
```

### Prevention

- Always specify explicit origins in production
- Never use wildcard with credentials
- Test CORS in different environments
- Use environment variables for origins

---

## 6. JWT token errors

### Problem

Authentication fails due to JWT token issues.

### Symptoms

```
Error: invalid token
Error: jwt expired
Error: invalid signature
Unauthorized: Invalid or expired token
```

```
JsonWebTokenError: invalid algorithm
TokenExpiredError: jwt expired at 2024-01-01T00:00:00.000Z
NotBeforeError: jwt not active
```

### Causes

| Cause | Description |
|-------|-------------|
| Token expired | Access token lifetime exceeded |
| Wrong secret | JWT_SECRET doesn't match |
| Token malformed | Corrupted or incomplete token |
| Wrong algorithm | Token uses unexpected algorithm |
| Clock skew | Server/client time difference |
| Token blacklisted | Token revoked in Redis |

### Solutions

#### Fix 1: Check JWT secret

```bash
# Ensure JWT_SECRET is set and matches
# Backend .env:
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-different-super-secret-refresh-key

# Verify token signature
node -e "
const jwt = require('jsonwebtoken');
const token = 'your-token-here';
try {
  const decoded = jwt.verify(token, 'your-secret-here');
  console.log('Valid:', decoded);
} catch (e) {
  console.error('Invalid:', e.message);
}
"
```

#### Fix 2: Handle token expiration

```typescript
// Frontend: Intercept 401 and refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });
        
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

#### Fix 3: Regenerate secrets

```bash
# Generate new JWT secrets
openssl rand -base64 64

# Update .env and restart server
```

#### Fix 4: Check token format

```bash
# Decode token (without verification) to inspect
node -e "
const jwt = require('jsonwebtoken');
const decoded = jwt.decode('your-token');
console.log(JSON.stringify(decoded, null, 2));
"

# Check expiry
node -e "
const jwt = require('jsonwebtoken');
const decoded = jwt.decode('your-token');
console.log('Expires:', new Date(decoded.exp * 1000));
console.log('Now:', new Date());
"
```

### Prevention

- Use token refresh mechanism
- Store tokens securely (HttpOnly cookies preferred)
- Implement proper logout (token blacklist)
- Keep server time synchronized (NTP)

---

## 7. File upload errors

### Problem

File uploads fail with various errors.

### Symptoms

```
Error: Request entity too large (413)
MulterError: File too large
Error: Unsupported file type
```

```
Error: EACCES: permission denied, open '/app/uploads/...'
MulterError: Unexpected field
```

### Causes

| Cause | Description |
|-------|-------------|
| File too large | Exceeds max file size limit |
| Wrong file type | File type not in allowed list |
| Permission denied | Upload directory not writable |
| Missing directory | Upload path doesn't exist |
| Disk full | Server disk space exhausted |

### Solutions

#### Fix 1: Increase file size limit

```typescript
// NestJS - main.ts
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Or in Multer config
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 5,                    // Max 5 files
  },
});
```

#### Fix 2: Fix upload directory

```bash
# Create upload directories
mkdir -p uploads/products uploads/avatars uploads/stores

# Set proper permissions
chmod 755 uploads uploads/*
chown -R $(whoami):$(whoami) uploads

# For Docker
chmod 777 uploads  # Quick fix (not for production)
```

#### Fix 3: Update Multer configuration

```typescript
const upload = multer({
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
});
```

### Prevention

- Validate file types before upload
- Set reasonable size limits
- Use cloud storage (S3/Cloudinary) for production
- Scan uploads for malware
- Implement image optimization

---

## 8. Payment gateway errors

### Problem

Payment processing fails.

### Symptoms

```
Error: Payment failed
StripeError: No such payment_intent: 'pi_...'
Error: Invalid API key
```

```
ThawaniError: Session expired
Error: Payment method not supported
Webhook verification failed
```

### Causes

| Cause | Description |
|-------|-------------|
| Wrong API keys | Using sandbox keys in production |
| Expired session | Payment session timeout |
| Invalid card | Test card in production |
| Currency mismatch | Unsupported currency |
| Webhook failure | Webhook endpoint not accessible |

### Solutions

#### Fix 1: Verify API keys

```env
# Use correct environment keys
# Development (sandbox):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Same for Thawani
THAWANI_ENV=uat        # Development
THAWANI_ENV=production # Production
```

#### Fix 2: Check webhook configuration

```bash
# List Stripe webhooks
stripe listen --print-secret

# Test webhook locally
stripe listen --forward-to localhost:3001/api/v1/payments/webhooks/stripe
```

#### Fix 3: Debug payment flow

```typescript
// Add detailed logging
@Injectable()
export class PaymentService {
  async processPayment(data: PaymentDto) {
    try {
      console.log('Payment request:', JSON.stringify(data, null, 2));
      
      const payment = await this.stripe.paymentIntents.create({
        amount: data.amount * 1000, // Convert to baisa
        currency: 'omr',
        payment_method: data.paymentMethodId,
        confirm: true,
      });
      
      console.log('Stripe response:', JSON.stringify(payment, null, 2));
      return payment;
    } catch (error) {
      console.error('Payment error:', {
        message: error.message,
        code: error.code,
        type: error.type,
      });
      throw error;
    }
  }
}
```

### Prevention

- Use webhook signatures for verification
- Implement idempotency keys
- Log all payment attempts
- Test with sandbox thoroughly

---

## 9. Shipping API errors

### Problem

Shipping rate calculation or label creation fails.

### Symptoms

```
Error: Shipping carrier not available
AramexError: Invalid credentials
Error: Shipping address not serviceable
```

### Solutions

#### Fix 1: Verify carrier credentials

```env
# Check API credentials
ARAMEX_USERNAME=your_username
ARAMEX_PASSWORD=your_password
ARAMEX_ACCOUNT_NUMBER=your_account

# Test credentials
curl -X POST https://ws.aramex.net/ShippingAPI.V2/Service_1_0.svc/json/ValidateAccount \
  -H "Content-Type: application/json" \
  -d '{
    "ClientInfo": {
      "UserName": "your_username",
      "Password": "your_password",
      "AccountNumber": "your_account"
    }
  }'
```

#### Fix 2: Check address format

```typescript
// Ensure address has all required fields
const shippingAddress = {
  line1: 'شارع السلطان قابوس',
  line2: 'مبنى 123',
  city: 'مسقط',        // Required
  governorate: 'مسقط',  // Required
  postalCode: '100',    // Required
  country: 'OM',        // Required (OM for Oman)
};
```

### Prevention

- Validate addresses before rate request
- Cache shipping rates
- Handle carrier downtime gracefully
- Provide multiple carrier options

---

## 10. AI service errors

### Problem

AI chat or recommendations fail.

### Symptoms

```
Error: OpenAI API request failed
Error: Rate limit exceeded
Error: Invalid API key
```

### Solutions

#### Fix 1: Verify OpenAI API key

```env
# Check API key
OPENAI_API_KEY=sk-...

# Test with curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

#### Fix 2: Handle rate limits

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
});

// Implement exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Prevention

- Implement request caching
- Use circuit breaker pattern
- Monitor API usage and costs
- Have fallback responses

---

## 11. Docker issues

### Problem

Docker containers fail to build or run.

### Symptoms

```
Error: Cannot connect to Docker daemon
Container exits immediately
Error: port already allocated
```

### Solutions

#### Fix 1: Docker daemon

```bash
# Check Docker status
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

#### Fix 2: Port conflicts

```bash
# Find port usage
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :6379

# Kill process or change port
kill -9 <PID>
```

#### Fix 3: Container logs

```bash
# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis

# Check container status
docker-compose ps

# Restart containers
docker-compose restart
```

#### Fix 4: Rebuild

```bash
# Clean build
docker-compose down -v  # Warning: removes volumes!
docker-compose build --no-cache
docker-compose up -d
```

### Prevention

- Use specific image tags (not `latest`)
- Define health checks
- Use Docker networks
- Set resource limits

---

## 12. Memory issues

### Problem

Application crashes due to memory exhaustion.

### Symptoms

```
FATAL ERROR: Reached heap limit Allocation failed
JavaScript heap out of memory
Error: ENOMEM: not enough memory
Container killed (OOM)
```

### Solutions

#### Fix 1: Increase Node.js memory

```bash
# Increase heap size
export NODE_OPTIONS="--max-old-space-size=4096"
npm run start

# Or in package.json
{
  "scripts": {
    "start": "NODE_OPTIONS='--max-old-space-size=4096' node dist/main"
  }
}
```

#### Fix 2: Optimize code

```typescript
// Avoid memory leaks
// Bad: Event listeners not removed
emitter.on('event', handler); // Never removed!

// Good: Remove listeners when done
emitter.on('event', handler);
emitter.removeListener('event', handler);

// Bad: Large arrays in memory
const allProducts = await prisma.product.findMany(); // All products!

// Good: Paginate results
const products = await prisma.product.findMany({
  take: 100,
  skip: offset,
});

// Bad: Circular references
class Node {
  parent: Node;
  children: Node[]; // Circular!
}

// Use WeakRef for caches
const cache = new WeakMap();
```

#### Fix 3: Monitor memory

```bash
# Monitor Node.js memory
node --inspect dist/main
# Open chrome://inspect in Chrome

# Check memory usage
ps aux | grep node
free -h
docker stats
```

### Prevention

- Implement pagination
- Use streams for large files
- Set memory limits in Docker
- Monitor with Prometheus/Grafana
- Profile memory usage regularly

---

## 13. Performance issues

### Problem

Application is slow or unresponsive.

### Symptoms

- API response time > 500ms
- Page load time > 3 seconds
- High CPU usage
- Database queries taking long

### Solutions

#### Fix 1: Database optimization

```typescript
// Add indexes
// migration.sql
CREATE INDEX idx_products_category ON products(categoryId);
CREATE INDEX idx_products_store ON products(storeId);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);

// Optimize queries
// Bad: N+1 queries
const stores = await prisma.store.findMany();
for (const store of stores) {
  const products = await prisma.product.findMany({
    where: { storeId: store.id },
  });
}

// Good: Include in single query
const stores = await prisma.store.findMany({
  include: { products: true },
});
```

#### Fix 2: Add caching

```typescript
// Redis caching
@Injectable()
export class ProductService {
  async getProducts(filter: ProductFilter) {
    const cacheKey = `products:${JSON.stringify(filter)}`;
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Fetch from DB
    const products = await this.prisma.product.findMany({
      where: filter,
    });
    
    // Store in cache (TTL: 5 minutes)
    await this.redis.setex(cacheKey, 300, JSON.stringify(products));
    
    return products;
  }
}
```

#### Fix 3: CDN for static assets

```typescript
// Upload to S3/Cloudinary
const uploadToCDN = async (file: Buffer, key: string) => {
  await s3.upload({
    Bucket: 'bhd-marketplace',
    Key: key,
    Body: file,
    ContentType: 'image/jpeg',
    // Enable CloudFront CDN
  }).promise();
};
```

### Prevention

- Use database indexes
- Implement caching layers
- Use CDN for static assets
- Enable compression (gzip/brotli)
- Monitor query performance
- Use connection pooling

---

## Quick Reference: Common Error Codes

| Error Code | Meaning | Quick Fix |
|------------|---------|-----------|
| `EACCES` | Permission denied | Fix file/directory permissions |
| `ECONNREFUSED` | Connection refused | Start the service |
| `ECONNRESET` | Connection reset | Retry with exponential backoff |
| `ETIMEDOUT` | Connection timeout | Check network/firewall |
| `ENOENT` | File not found | Create missing file/directory |
| `EADDRINUSE` | Port in use | Kill process or change port |
| `ENOSPC` | No disk space | Free up disk space |
| `ENOMEM` | Out of memory | Increase memory or optimize |
| `ERESOLVE` | npm dependency conflict | Use `--legacy-peer-deps` |
| `EPERM` | Operation not permitted | Run with sudo or fix permissions |

---

<div align="center">

**[⬅️ Back to README](./README.md)** | **[📖 Setup Guide](./SETUP.md)** | **[🔐 Security](./SECURITY.md)**

Made with ❤️ in 🇴🇲 Oman

</div>
