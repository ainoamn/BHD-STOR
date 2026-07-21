# BHD Oman Marketplace - Complete API Documentation

<div align="center">

![API Documentation](https://img.shields.io/badge/API-DOCS-3498DB?style=for-the-badge)
![REST API](https://img.shields.io/badge/REST-JSON-2ECC71?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-v1.0.0-E67E22?style=for-the-badge)

**Complete REST API Reference for BHD Oman Marketplace**

Base URL: `https://api.bhd.om/api/v1`

</div>

---

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Authentication](#-authentication)
- [Users](#-users)
- [Stores](#-stores)
- [Products](#-products)
- [Categories](#-categories)
- [Orders](#-orders)
- [Cart](#-cart)
- [Wishlist](#-wishlist)
- [Payments](#-payments)
- [Shipping](#-shipping)
- [Subscriptions](#-subscriptions)
- [Chat](#-chat)
- [AI Services](#-ai-services)
- [Currency](#-currency)
- [Admin](#-admin)
- [Error Codes](#-error-codes)

---

## 🚀 Getting Started

### Base URL

```
Production:  https://api.bhd.om/api/v1
Staging:     https://staging-api.bhd.om/api/v1
Local:       http://localhost:3001/api/v1
```

### Request Format

All requests must include:
- `Content-Type: application/json` for POST/PUT/PATCH requests
- `Authorization: Bearer <token>` for authenticated endpoints
- `Accept-Language: ar|en` for localized responses

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Authentication

Most endpoints require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     https://api.bhd.om/api/v1/products
```

---

## 🔐 Authentication

### POST `/auth/register`

Register a new user account.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/register` |
| **Auth Required** | No |
| **Rate Limit** | 10 requests/minute |

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "محمد",
  "lastName": "الحسني",
  "phone": "+96891234567",
  "role": "buyer",
  "preferredLanguage": "ar",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Field Descriptions:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email, unique |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 number, 1 special |
| `firstName` | string | Yes | 2-50 characters |
| `lastName` | string | Yes | 2-50 characters |
| `phone` | string | Yes | Oman format: +968XXXXXXXX |
| `role` | string | No | buyer (default), seller |
| `preferredLanguage` | string | No | ar (default), en |
| `dateOfBirth` | string | No | ISO 8601 date |
| `gender` | string | No | male, female, other |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "محمد",
      "lastName": "الحسني",
      "phone": "+96891234567",
      "role": "buyer",
      "isVerified": false,
      "preferredLanguage": "ar",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `EMAIL_EXISTS` | Email already registered |
| 400 | `PHONE_EXISTS` | Phone number already registered |
| 400 | `INVALID_EMAIL` | Invalid email format |
| 400 | `WEAK_PASSWORD` | Password doesn't meet requirements |
| 429 | `RATE_LIMITED` | Too many requests |

---

### POST `/auth/login`

Authenticate user and receive access tokens.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/login` |
| **Auth Required** | No |
| **Rate Limit** | 10 requests/minute |

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "deviceId": "web-browser-123",
    "deviceType": "web",
    "deviceName": "Chrome on macOS",
    "fcmToken": "optional-firebase-token"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "firstName": "محمد",
      "lastName": "الحسني",
      "role": "buyer",
      "avatar": "https://cdn.bhd.om/avatars/uuid.jpg",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "preferredLanguage": "ar"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `INVALID_CREDENTIALS` | Email or password incorrect |
| 403 | `ACCOUNT_LOCKED` | Account temporarily locked |
| 403 | `ACCOUNT_SUSPENDED` | Account has been suspended |
| 403 | `EMAIL_NOT_VERIFIED` | Email verification required |

---

### POST `/auth/refresh`

Refresh access token using refresh token.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/refresh` |
| **Auth Required** | Refresh Token |

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

---

### POST `/auth/logout`

Logout user and invalidate tokens.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/logout` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "allDevices": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST `/auth/forgot-password`

Request password reset email.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/forgot-password` |
| **Auth Required** | No |
| **Rate Limit** | 5 requests/hour |

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### POST `/auth/reset-password`

Reset password using token from email.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/reset-password` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

---

### POST `/auth/verify-email`

Verify email address.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/verify-email` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

---

### POST `/auth/resend-verification`

Resend email verification link.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/resend-verification` |
| **Auth Required** | No |
| **Rate Limit** | 3 requests/hour |

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

---

### POST `/auth/otp/send`

Send OTP to phone number.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/otp/send` |
| **Auth Required** | No |
| **Rate Limit** | 5 requests/hour |

**Request Body:**

```json
{
  "phone": "+96891234567",
  "purpose": "login"
}
```

---

### POST `/auth/otp/verify`

Verify OTP code.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/otp/verify` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "phone": "+96891234567",
  "code": "123456",
  "purpose": "login"
}
```

---

### POST `/auth/social/:provider`

Social login callback (Google, Apple, Facebook).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/social/:provider` |
| **Auth Required** | No |

**Path Parameters:**

| Parameter | Values |
|-----------|--------|
| `provider` | `google`, `apple`, `facebook` |

**Request Body:**

```json
{
  "accessToken": "google-oauth-access-token",
  "idToken": "optional-id-token"
}
```

---

## 👤 Users

### GET `/users/me`

Get current authenticated user profile.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/users/me` |
| **Auth Required** | Yes (Bearer) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "محمد",
    "lastName": "الحسني",
    "phone": "+96891234567",
    "avatar": "https://cdn.bhd.om/avatars/uuid.jpg",
    "role": "buyer",
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "preferredLanguage": "ar",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "addresses": [
      {
        "id": "uuid",
        "type": "home",
        "label": "المنزل",
        "street": "شارع السلطان قابوس",
        "building": "مبنى 123",
        "city": "مسقط",
        "governorate": "مسقط",
        "postalCode": "100",
        "isDefault": true,
        "location": {
          "lat": 23.5859,
          "lng": 58.4059
        }
      }
    ],
    "store": null,
    "stats": {
      "totalOrders": 15,
      "totalSpent": 1250.500,
      "wishlistCount": 8,
      "reviewCount": 5
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-06-01T00:00:00.000Z"
  }
}
```

---

### PUT `/users/me`

Update current user profile.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/users/me` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "firstName": "محمد",
  "lastName": "الحسني",
  "phone": "+96891234567",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "preferredLanguage": "ar",
  "avatar": "https://cdn.bhd.om/avatars/new.jpg"
}
```

---

### DELETE `/users/me`

Delete current user account.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/users/me` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "password": "current-password-for-confirmation",
  "reason": "optional-deletion-reason"
}
```

---

### PUT `/users/me/password`

Change user password.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/users/me/password` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

---

### GET `/users/me/addresses`

Get all user addresses.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/users/me/addresses` |
| **Auth Required** | Yes (Bearer) |

---

### POST `/users/me/addresses`

Add new address.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/users/me/addresses` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "type": "home",
  "label": "المنزل",
  "street": "شارع السلطان قابوس",
  "building": "مبنى 123",
  "floor": "الطابق 2",
  "apartment": "205",
  "city": "مسقط",
  "governorate": "مسقط",
  "postalCode": "100",
  "phone": "+96891234567",
  "deliveryInstructions": "اترك الطرد عند البوابة",
  "isDefault": false,
  "location": {
    "lat": 23.5859,
    "lng": 58.4059
  }
}
```

---

### PUT `/users/me/addresses/:id`

Update an address.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/users/me/addresses/:id` |
| **Auth Required** | Yes (Bearer) |

---

### DELETE `/users/me/addresses/:id`

Delete an address.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/users/me/addresses/:id` |
| **Auth Required** | Yes (Bearer) |

---

### GET `/users/me/notifications`

Get user notifications.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/users/me/notifications` |
| **Auth Required** | Yes (Bearer) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `isRead` | boolean | - | Filter by read status |
| `type` | string | - | Filter by type |

---

### PUT `/users/me/notifications/:id/read`

Mark notification as read.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/users/me/notifications/:id/read` |
| **Auth Required** | Yes (Bearer) |

---

### GET `/users`

List all users (Admin only).

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/users` |
| **Auth Required** | Yes (Bearer + Admin) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `role` | string | - | Filter by role (buyer, seller, admin) |
| `isVerified` | boolean | - | Filter by verification status |
| `search` | string | - | Search by name or email |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | Sort order (asc, desc) |
| `dateFrom` | string | - | Filter from date |
| `dateTo` | string | - | Filter to date |

---

### GET `/users/:id`

Get user by ID (Admin only).

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/users/:id` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### PUT `/users/:id`

Update user by ID (Admin only).

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/users/:id` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### PUT `/users/:id/status`

Update user status (Admin only).

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/users/:id/status` |
| **Auth Required** | Yes (Bearer + Admin) |

**Request Body:**

```json
{
  "status": "active",
  "reason": "Reason for status change"
}
```

---

## 🏪 Stores

### GET `/stores`

List all stores.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/stores` |
| **Auth Required** | No |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | - | Search by store name |
| `category` | string | - | Filter by category |
| `city` | string | - | Filter by city |
| `isVerified` | boolean | - | Filter verified stores |
| `sortBy` | string | rating | Sort field |
| `sortOrder` | string | desc | Sort order |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "متجر التقنية العمانية",
      "nameEn": "Omani Tech Store",
      "slug": "omani-tech-store",
      "description": "أفضل المنتجات التقنية في عمان",
      "descriptionEn": "Best tech products in Oman",
      "logo": "https://cdn.bhd.om/stores/logo.jpg",
      "banner": "https://cdn.bhd.om/stores/banner.jpg",
      "owner": {
        "id": "uuid",
        "firstName": "أحمد",
        "lastName": "الراشدي",
        "avatar": "https://cdn.bhd.om/avatars/uuid.jpg"
      },
      "category": "electronics",
      "location": {
        "city": "مسقط",
        "governorate": "مسقط",
        "lat": 23.5859,
        "lng": 58.4059
      },
      "rating": 4.8,
      "reviewCount": 256,
      "productsCount": 142,
      "followersCount": 1205,
      "isVerified": true,
      "isFeatured": true,
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### GET `/stores/:id`

Get store details by ID or slug.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/stores/:id` |
| **Auth Required** | No |

---

### POST `/stores`

Create a new store (Seller role required).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/stores` |
| **Auth Required** | Yes (Bearer + Seller) |

**Request Body:**

```json
{
  "name": "متجري الجديد",
  "nameEn": "My New Store",
  "description": "وصف المتجر بالعربية",
  "descriptionEn": "Store description in English",
  "category": "electronics",
  "logo": "file-upload",
  "banner": "file-upload",
  "location": {
    "street": "شارع السلطان قابوس",
    "city": "مسقط",
    "governorate": "مسقط",
    "lat": 23.5859,
    "lng": 58.4059
  },
  "contact": {
    "email": "store@example.com",
    "phone": "+96891234567",
    "whatsapp": "+96891234567",
    "website": "https://mystore.om"
  },
  "socialMedia": {
    "instagram": "@mystore",
    "facebook": "mystore",
    "twitter": "@mystore"
  },
  "businessInfo": {
    "crNumber": "123456",
    "taxNumber": "789012",
    "businessType": "sole_proprietorship"
  },
  "workingHours": {
    "sunday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "monday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "tuesday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "wednesday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "thursday": { "open": "08:00", "close": "18:00", "isOpen": true },
    "friday": { "open": "16:00", "close": "20:00", "isOpen": true },
    "saturday": { "open": null, "close": null, "isOpen": false }
  }
}
```

---

### PUT `/stores/:id`

Update store details.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/stores/:id` |
| **Auth Required** | Yes (Bearer + Store Owner) |

---

### DELETE `/stores/:id`

Delete a store.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/stores/:id` |
| **Auth Required** | Yes (Bearer + Store Owner) |

---

### POST `/stores/:id/follow`

Follow a store.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/stores/:id/follow` |
| **Auth Required** | Yes (Bearer) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "followersCount": 1206
  }
}
```

---

### DELETE `/stores/:id/follow`

Unfollow a store.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/stores/:id/follow` |
| **Auth Required** | Yes (Bearer) |

---

### GET `/stores/:id/products`

Get store products.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/stores/:id/products` |
| **Auth Required** | No |

---

### GET `/stores/:id/reviews`

Get store reviews.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/stores/:id/reviews` |
| **Auth Required** | No |

---

### POST `/stores/:id/verify`

Submit store for verification.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/stores/:id/verify` |
| **Auth Required** | Yes (Bearer + Store Owner) |

**Request Body:**

```json
{
  "documents": [
    {
      "type": "commercial_registration",
      "file": "file-upload",
      "number": "123456789"
    },
    {
      "type": "tax_certificate",
      "file": "file-upload"
    },
    {
      "type": "id_card",
      "file": "file-upload"
    }
  ]
}
```

---

## 📦 Products

### GET `/products`

List all products with filtering and search.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/products` |
| **Auth Required** | No |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 24 | Items per page |
| `search` | string | - | Full-text search |
| `category` | string | - | Category ID or slug |
| `store` | string | - | Store ID or slug |
| `minPrice` | number | - | Minimum price (OMR) |
| `maxPrice` | number | - | Maximum price (OMR) |
| `rating` | number | - | Minimum rating (1-5) |
| `sortBy` | string | createdAt | createdAt, price, rating, sales, name |
| `sortOrder` | string | desc | asc, desc |
| `inStock` | boolean | - | Filter by stock availability |
| `isFeatured` | boolean | - | Filter featured products |
| `isOnSale` | boolean | - | Filter sale items |
| `attributes` | object | - | Filter by product attributes |
| `governorate` | string | - | Filter by seller location |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro Max",
      "nameAr": "آيفون 15 برو ماكس",
      "slug": "iphone-15-pro-max",
      "description": "أحدث هاتف من Apple",
      "descriptionAr": "أحدث هاتف من أبل",
      "price": 499.000,
      "compareAtPrice": 529.000,
      "currency": "OMR",
      "discount": {
        "type": "percentage",
        "value": 5.6,
        "endsAt": "2024-12-31T23:59:59Z"
      },
      "images": [
        {
          "id": "uuid",
          "url": "https://cdn.bhd.om/products/iphone15-1.jpg",
          "alt": "iPhone 15 Pro Max - Natural Titanium",
          "isPrimary": true
        }
      ],
      "category": {
        "id": "uuid",
        "name": "الهواتف الذكية",
        "slug": "smartphones"
      },
      "store": {
        "id": "uuid",
        "name": "متجر التقنية العمانية",
        "slug": "omani-tech-store",
        "isVerified": true
      },
      "rating": 4.9,
      "reviewCount": 128,
      "stock": {
        "quantity": 45,
        "lowStockThreshold": 5,
        "status": "in_stock"
      },
      "sku": "APL-IPH15PM-256",
      "variants": [
        {
          "id": "uuid",
          "name": "اللون",
          "options": [
            { "id": "uuid", "value": "Natural Titanium", "valueAr": "تيتانيوم طبيعي" },
            { "id": "uuid", "value": "Blue Titanium", "valueAr": "تيتانيوم أزرق" }
          ]
        }
      ],
      "attributes": {
        "brand": "Apple",
        "model": "iPhone 15 Pro Max",
        "storage": "256GB",
        "color": "Natural Titanium",
        "warranty": "1 year"
      },
      "shipping": {
        "freeShipping": true,
        "estimatedDelivery": "2-3 days",
        "weight": 0.221,
        "weightUnit": "kg"
      },
      "isFeatured": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-06-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 24,
    "total": 1542,
    "totalPages": 65,
    "filters": {
      "priceRange": { "min": 0.500, "max": 2500.000 },
      "categories": [
        { "id": "uuid", "name": "Electronics", "count": 523 },
        { "id": "uuid", "name": "Fashion", "count": 421 }
      ]
    }
  }
}
```

---

### GET `/products/:id`

Get product details by ID or slug.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/products/:id` |
| **Auth Required** | No |

---

### POST `/products`

Create a new product (Seller only).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/products` |
| **Auth Required** | Yes (Bearer + Seller) |

**Request Body:**

```json
{
  "name": "iPhone 15 Pro Max",
  "nameAr": "آيفون 15 برو ماكس",
  "description": "Detailed product description...",
  "descriptionAr": "وصف تفصيلي للمنتج...",
  "categoryId": "uuid",
  "price": 499.000,
  "compareAtPrice": 529.000,
  "costPrice": 450.000,
  "sku": "APL-IPH15PM-256",
  "barcode": "123456789012",
  "stock": {
    "quantity": 100,
    "trackQuantity": true,
    "allowOutOfStock": false,
    "lowStockThreshold": 10
  },
  "images": ["file-upload-1", "file-upload-2"],
  "variants": [
    {
      "name": "Storage",
      "nameAr": "السعة",
      "options": [
        { "value": "256GB", "valueAr": "256 جيجا", "priceAdjustment": 0 },
        { "value": "512GB", "valueAr": "512 جيجا", "priceAdjustment": 100 },
        { "value": "1TB", "valueAr": "1 تيرا", "priceAdjustment": 200 }
      ]
    }
  ],
  "attributes": {
    "brand": "Apple",
    "model": "iPhone 15 Pro Max",
    "color": "Natural Titanium",
    "screenSize": "6.7 inch",
    "battery": "4441 mAh",
    "warranty": "1 year"
  },
  "shipping": {
    "weight": 0.221,
    "weightUnit": "kg",
    "dimensions": {
      "length": 15.9,
      "width": 7.7,
      "height": 0.8,
      "unit": "cm"
    },
    "freeShipping": true
  },
  "seo": {
    "metaTitle": "iPhone 15 Pro Max - Buy in Oman",
    "metaDescription": "Buy iPhone 15 Pro Max in Oman. Best price guaranteed.",
    "keywords": ["iPhone", "Apple", "Oman", "smartphone"]
  },
  "tags": ["apple", "iphone", "smartphone", "5g"],
  "isFeatured": false,
  "status": "active"
}
```

---

### PUT `/products/:id`

Update a product.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/products/:id` |
| **Auth Required** | Yes (Bearer + Store Owner) |

---

### DELETE `/products/:id`

Delete a product (soft delete).

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/products/:id` |
| **Auth Required** | Yes (Bearer + Store Owner) |

---

### GET `/products/featured`

Get featured products.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/products/featured` |
| **Auth Required** | No |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 12 | Number of products |

---

### GET `/products/trending`

Get trending products.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/products/trending` |
| **Auth Required** | No |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 12 | Number of products |
| `period` | string | 7d | Period: 24h, 7d, 30d |

---

### GET `/products/search`

Search products (AI-powered).

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/products/search` |
| **Auth Required** | No |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | Required | Search query |
| `page` | number | 1 | Page number |
| `limit` | number | 24 | Items per page |
| `ai` | boolean | true | Use AI search |

---

### POST `/products/:id/reviews`

Add product review.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/products/:id/reviews` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very satisfied with this purchase. Fast delivery!",
  "images": ["file-upload-1"],
  "isAnonymous": false
}
```

---

## 📂 Categories

### GET `/categories`

Get all categories (tree structure).

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/categories` |
| **Auth Required** | No |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tree` | boolean | true | Return hierarchical tree |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "إلكترونيات",
      "nameEn": "Electronics",
      "slug": "electronics",
      "description": "أجهزة إلكترونية وحواسيب",
      "icon": "laptop",
      "image": "https://cdn.bhd.om/categories/electronics.jpg",
      "productCount": 523,
      "children": [
        {
          "id": "uuid",
          "name": "الهواتف الذكية",
          "nameEn": "Smartphones",
          "slug": "smartphones",
          "productCount": 156,
          "children": [
            {
              "id": "uuid",
              "name": "iPhone",
              "nameEn": "iPhone",
              "slug": "iphone",
              "productCount": 45
            }
          ]
        },
        {
          "id": "uuid",
          "name": "الحواسيب المحمولة",
          "nameEn": "Laptops",
          "slug": "laptops",
          "productCount": 89
        }
      ]
    },
    {
      "id": "uuid",
      "name": "أزياء",
      "nameEn": "Fashion",
      "slug": "fashion",
      "productCount": 421,
      "children": [
        {
          "id": "uuid",
          "name": "رجالي",
          "nameEn": "Men",
          "slug": "men",
          "productCount": 198
        },
        {
          "id": "uuid",
          "name": "نسائي",
          "nameEn": "Women",
          "slug": "women",
          "productCount": 223
        }
      ]
    }
  ]
}
```

---

### GET `/categories/:id`

Get category by ID.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/categories/:id` |
| **Auth Required** | No |

---

### GET `/categories/:id/products`

Get products in a category.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/categories/:id/products` |
| **Auth Required** | No |

---

### POST `/categories` (Admin)

Create a new category.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/categories` |
| **Auth Required** | Yes (Bearer + Admin) |

**Request Body:**

```json
{
  "name": "ألعاب الفيديو",
  "nameEn": "Video Games",
  "slug": "video-games",
  "description": "ألعاب فيديو وإكسسوارات",
  "descriptionEn": "Video games and accessories",
  "parentId": "electronics-category-uuid",
  "icon": "gamepad",
  "image": "file-upload",
  "isActive": true,
  "sortOrder": 10,
  "metaTitle": "Video Games - BHD Oman",
  "metaDescription": "Shop video games in Oman",
  "attributes": [
    { "name": "Platform", "type": "select", "required": true },
    { "name": "Genre", "type": "select", "required": false }
  ]
}
```

---

### PUT `/categories/:id` (Admin)

Update a category.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/categories/:id` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### DELETE `/categories/:id` (Admin)

Delete a category.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/categories/:id` |
| **Auth Required** | Yes (Bearer + Admin) |

---

## 📋 Orders

### GET `/orders`

Get user's orders.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/orders` |
| **Auth Required** | Yes (Bearer) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | - | Filter by status |
| `sortBy` | string | createdAt | Sort field |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "ORD-2024-001234",
      "status": "delivered",
      "statusAr": "تم التوصيل",
      "paymentStatus": "paid",
      "paymentMethod": "thawani",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "productName": "iPhone 15 Pro Max",
          "productNameAr": "آيفون 15 برو ماكس",
          "productImage": "https://cdn.bhd.om/products/iphone15-1.jpg",
          "variant": "256GB - Natural Titanium",
          "quantity": 1,
          "unitPrice": 499.000,
          "totalPrice": 499.000,
          "storeId": "uuid",
          "storeName": "متجر التقنية العمانية"
        }
      ],
      "subtotal": 499.000,
      "shippingCost": 0.000,
      "discount": 25.000,
      "total": 474.000,
      "currency": "OMR",
      "shippingAddress": {
        "label": "المنزل",
        "street": "شارع السلطان قابوس",
        "city": "مسقط",
        "governorate": "مسقط"
      },
      "tracking": {
        "carrier": "aramex",
        "trackingNumber": "ARAMEX123456",
        "status": "delivered",
        "estimatedDelivery": "2024-01-05",
        "events": [
          {
            "status": "picked_up",
            "description": "تم استلام الشحنة من البائع",
            "timestamp": "2024-01-02T09:00:00Z"
          },
          {
            "status": "in_transit",
            "description": "الشحنة في الطريق",
            "timestamp": "2024-01-03T14:00:00Z"
          },
          {
            "status": "delivered",
            "description": "تم التسليم",
            "timestamp": "2024-01-04T11:00:00Z"
          }
        ]
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-04T11:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

---

### GET `/orders/:id`

Get order details.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/orders/:id` |
| **Auth Required** | Yes (Bearer + Order Owner) |

---

### POST `/orders`

Create a new order.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/orders` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid",
      "quantity": 1
    }
  ],
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethod": "thawani",
  "couponCode": "SAVE10",
  "notes": "Please call before delivery",
  "giftOptions": {
    "isGift": false,
    "message": "",
    "wrap": false
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "ORD-2024-001235",
    "status": "pending_payment",
    "items": [...],
    "subtotal": 499.000,
    "shippingCost": 2.000,
    "discount": 49.900,
    "total": 451.100,
    "currency": "OMR",
    "payment": {
      "method": "thawani",
      "sessionId": "thawani-session-id",
      "checkoutUrl": "https://checkout.thawani.om/pay/thawani-session-id"
    },
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### PUT `/orders/:id/status` (Admin/Seller)

Update order status.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/orders/:id/status` |
| **Auth Required** | Yes (Bearer + Admin/Seller) |

**Request Body:**

```json
{
  "status": "shipped",
  "trackingNumber": "ARAMEX123456",
  "carrier": "aramex",
  "notes": "Order has been shipped"
}
```

**Status Values:**

| Status | Description | Who Can Update |
|--------|-------------|----------------|
| `pending_payment` | Awaiting payment | System |
| `payment_received` | Payment confirmed | System |
| `processing` | Being prepared | Seller |
| `shipped` | In transit | Seller |
| `out_for_delivery` | Out for delivery | Carrier |
| `delivered` | Delivered | Carrier |
| `cancelled` | Cancelled | Buyer/Admin |
| `refunded` | Refunded | Admin |

---

### POST `/orders/:id/cancel`

Cancel an order.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/orders/:id/cancel` |
| **Auth Required** | Yes (Bearer + Order Owner) |

**Request Body:**

```json
{
  "reason": "changed_my_mind",
  "comment": "Found a better price elsewhere"
}
```

**Cancel Reasons:**

| Reason | Description |
|--------|-------------|
| `changed_my_mind` | Changed my mind |
| `wrong_item` | Ordered wrong item |
| `delivery_time` | Delivery time too long |
| `found_better_price` | Found better price |
| `other` | Other reason |

---

### GET `/orders/:id/invoice`

Download order invoice.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/orders/:id/invoice` |
| **Auth Required** | Yes (Bearer + Order Owner) |

---

### POST `/orders/:id/refund` (Admin)

Process order refund.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/orders/:id/refund` |
| **Auth Required** | Yes (Bearer + Admin) |

**Request Body:**

```json
{
  "amount": 499.000,
  "reason": "customer_request",
  "type": "full"
}
```

---

## 🛒 Cart

### GET `/cart`

Get current user's cart.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/cart` |
| **Auth Required** | Yes (Bearer) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "iPhone 15 Pro Max",
        "productNameAr": "آيفون 15 برو ماكس",
        "productImage": "https://cdn.bhd.om/products/iphone15-1.jpg",
        "variant": "256GB - Natural Titanium",
        "quantity": 1,
        "unitPrice": 499.000,
        "totalPrice": 499.000,
        "storeId": "uuid",
        "storeName": "متجر التقنية العمانية",
        "maxQuantity": 45,
        "isAvailable": true
      },
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "AirPods Pro 2",
        "productNameAr": "AirPods Pro 2",
        "productImage": "https://cdn.bhd.om/products/airpods-1.jpg",
        "variant": null,
        "quantity": 2,
        "unitPrice": 89.000,
        "totalPrice": 178.000,
        "storeId": "uuid",
        "storeName": "متجر التقنية العمانية",
        "maxQuantity": 100,
        "isAvailable": true
      }
    ],
    "summary": {
      "itemCount": 3,
      "storeCount": 1,
      "subtotal": 677.000,
      "shippingEstimate": 0.000,
      "discount": 0.000,
      "total": 677.000,
      "currency": "OMR"
    },
    "coupon": null
  }
}
```

---

### POST `/cart/items`

Add item to cart.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/cart/items` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

---

### PUT `/cart/items/:id`

Update cart item quantity.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/cart/items/:id` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "quantity": 3
}
```

---

### DELETE `/cart/items/:id`

Remove item from cart.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/cart/items/:id` |
| **Auth Required** | Yes (Bearer) |

---

### DELETE `/cart`

Clear entire cart.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/cart` |
| **Auth Required** | Yes (Bearer) |

---

### POST `/cart/coupon`

Apply coupon to cart.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/cart/coupon` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "code": "SAVE10"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "coupon": {
      "code": "SAVE10",
      "type": "percentage",
      "value": 10,
      "discount": 67.700,
      "minimumPurchase": 50.000
    },
    "newTotal": 609.300
  }
}
```

---

### DELETE `/cart/coupon`

Remove coupon from cart.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/cart/coupon` |
| **Auth Required** | Yes (Bearer) |

---

### POST `/cart/merge`

Merge guest cart with user cart (after login).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/cart/merge` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "guestCartId": "guest-cart-uuid"
}
```

---

## ❤️ Wishlist

### GET `/wishlist`

Get user's wishlist.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/wishlist` |
| **Auth Required** | Yes (Bearer) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "iPhone 15 Pro Max",
        "productNameAr": "آيفون 15 برو ماكس",
        "productImage": "https://cdn.bhd.om/products/iphone15-1.jpg",
        "price": 499.000,
        "compareAtPrice": 529.000,
        "storeName": "متجر التقنية العمانية",
        "storeSlug": "omani-tech-store",
        "isInStock": true,
        "addedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 8
  }
}
```

---

### POST `/wishlist`

Add product to wishlist.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/wishlist` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "productId": "uuid"
}
```

---

### DELETE `/wishlist/:productId`

Remove product from wishlist.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/wishlist/:productId` |
| **Auth Required** | Yes (Bearer) |

---

### POST `/wishlist/toggle`

Toggle product in wishlist (add if not exists, remove if exists).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/wishlist/toggle` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "productId": "uuid"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "isInWishlist": true,
    "total": 9
  }
}
```

---

### POST `/wishlist/move-to-cart`

Move wishlist item to cart.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/wishlist/move-to-cart` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "productId": "uuid",
  "variantId": "uuid"
}
```

---

## 💳 Payments

### POST `/payments/process`

Process a payment.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/payments/process` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "orderId": "ORD-2024-001234",
  "method": "thawani",
  "amount": 474.000,
  "currency": "OMR",
  "metadata": {
    "customerName": "محمد الحسني",
    "customerEmail": "user@example.com",
    "customerPhone": "+96891234567"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "pending",
    "method": "thawani",
    "amount": 474.000,
    "currency": "OMR",
    "checkoutUrl": "https://checkout.thawani.om/pay/session-id",
    "sessionId": "thawani-session-id",
    "expiresAt": "2024-01-01T11:00:00Z"
  }
}
```

---

### POST `/payments/verify`

Verify payment status.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/payments/verify` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "paymentId": "uuid",
  "sessionId": "thawani-session-id"
}
```

---

### POST `/payments/refund`

Request a refund (Admin only).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/payments/refund` |
| **Auth Required** | Yes (Bearer + Admin) |

**Request Body:**

```json
{
  "paymentId": "uuid",
  "amount": 474.000,
  "reason": "customer_request",
  "type": "full"
}
```

---

### GET `/payments/history`

Get payment history.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/payments/history` |
| **Auth Required** | Yes (Bearer) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | - | Filter by status |

---

### POST `/payments/webhooks/:provider`

Payment webhook handler (called by payment providers).

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/payments/webhooks/:provider` |
| **Auth Required** | Webhook Signature |

**Supported Providers:** `stripe`, `thawani`, `paypal`, `omannet`

---

## 🚚 Shipping

### POST `/shipping/rates`

Get shipping rates for an order.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/shipping/rates` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "destination": {
    "city": "مسقط",
    "governorate": "مسقط",
    "postalCode": "100"
  },
  "packages": [
    {
      "weight": 0.5,
      "weightUnit": "kg",
      "dimensions": {
        "length": 20,
        "width": 15,
        "height": 10,
        "unit": "cm"
      }
    }
  ],
  "storeIds": ["uuid"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "carrier": "aramex",
        "carrierName": "Aramex",
        "carrierNameAr": "أرامكس",
        "service": "express",
        "serviceName": "Express Delivery",
        "price": 2.500,
        "currency": "OMR",
        "estimatedDays": 2,
        "estimatedDelivery": "2024-01-03",
        "isDefault": true
      },
      {
        "carrier": "dhl",
        "carrierName": "DHL",
        "carrierNameAr": "دي إتش إل",
        "service": "standard",
        "serviceName": "Standard Delivery",
        "price": 3.000,
        "currency": "OMR",
        "estimatedDays": 3,
        "estimatedDelivery": "2024-01-04"
      }
    ]
  }
}
```

---

### POST `/shipping/shipments`

Create a shipment.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/shipping/shipments` |
| **Auth Required** | Yes (Bearer + Seller) |

**Request Body:**

```json
{
  "orderId": "ORD-2024-001234",
  "carrier": "aramex",
  "service": "express",
  "package": {
    "weight": 0.5,
    "weightUnit": "kg",
    "dimensions": {
      "length": 20,
      "width": 15,
      "height": 10,
      "unit": "cm"
    },
    "description": "iPhone 15 Pro Max",
    "value": 499.000,
    "currency": "OMR"
  },
  "pickup": {
    "address": "Warehouse Address",
    "city": "مسقط",
    "contactName": "أحمد الراشدي",
    "contactPhone": "+96891234567"
  },
  "delivery": {
    "addressId": "uuid"
  }
}
```

---

### GET `/shipping/track/:trackingNumber`

Track a shipment.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/shipping/track/:trackingNumber` |
| **Auth Required** | No (public tracking) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "trackingNumber": "ARAMEX123456",
    "carrier": "aramex",
    "status": "in_transit",
    "statusAr": "في transit",
    "estimatedDelivery": "2024-01-05",
    "events": [
      {
        "status": "picked_up",
        "statusAr": "تم الاستلام",
        "description": "Shipment picked up from sender",
        "descriptionAr": "تم استلام الشحنة من المرسل",
        "location": "مسقط",
        "timestamp": "2024-01-02T09:00:00Z"
      }
    ]
  }
}
```

---

### GET `/shipping/carriers`

List available shipping carriers.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/shipping/carriers` |
| **Auth Required** | No |

---

## 💎 Subscriptions

### GET `/subscriptions/plans`

Get all subscription plans.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/subscriptions/plans` |
| **Auth Required** | No |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Basic",
      "nameAr": "أساسي",
      "description": "Perfect for small sellers",
      "descriptionAr": "مثالي للبائعين الصغار",
      "price": 0,
      "currency": "OMR",
      "interval": "month",
      "features": [
        { "name": "Products", "nameAr": "المنتجات", "value": "50", "included": true },
        { "name": "Commission", "nameAr": "العمولة", "value": "8%", "included": true },
        { "name": "Analytics", "nameAr": "التحليلات", "value": "Basic", "included": true }
      ],
      "limits": {
        "products": 50,
        "staff": 1,
        "storage": 1024
      },
      "isPopular": false
    },
    {
      "id": "uuid",
      "name": "Pro",
      "nameAr": "احترافي",
      "description": "For growing businesses",
      "descriptionAr": "للأعمال النامية",
      "price": 15.000,
      "currency": "OMR",
      "interval": "month",
      "features": [
        { "name": "Products", "nameAr": "المنتجات", "value": "Unlimited", "included": true },
        { "name": "Commission", "nameAr": "العمولة", "value": "5%", "included": true },
        { "name": "Analytics", "nameAr": "التحليلات", "value": "Advanced", "included": true },
        { "name": "Priority Support", "nameAr": "دعم أولوي", "value": "24/7", "included": true }
      ],
      "limits": {
        "products": -1,
        "staff": 5,
        "storage": 10240
      },
      "isPopular": true
    },
    {
      "id": "uuid",
      "name": "Enterprise",
      "nameAr": "مؤسسي",
      "description": "For large-scale operations",
      "descriptionAr": "للعمليات واسعة النطاق",
      "price": 50.000,
      "currency": "OMR",
      "interval": "month",
      "features": [
        { "name": "Products", "nameAr": "المنتجات", "value": "Unlimited", "included": true },
        { "name": "Commission", "nameAr": "العمولة", "value": "3%", "included": true },
        { "name": "API Access", "nameAr": "وصول API", "value": "Full", "included": true }
      ],
      "limits": {
        "products": -1,
        "staff": -1,
        "storage": -1
      },
      "isPopular": false
    }
  ]
}
```

---

### POST `/subscriptions/subscribe`

Subscribe to a plan.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/subscriptions/subscribe` |
| **Auth Required** | Yes (Bearer + Seller) |

**Request Body:**

```json
{
  "planId": "uuid",
  "paymentMethod": "thawani",
  "autoRenew": true
}
```

---

### POST `/subscriptions/cancel`

Cancel subscription.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/subscriptions/cancel` |
| **Auth Required** | Yes (Bearer + Seller) |

**Request Body:**

```json
{
  "reason": "switching_platform",
  "cancelAtEnd": true
}
```

---

### GET `/subscriptions/current`

Get current subscription.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/subscriptions/current` |
| **Auth Required** | Yes (Bearer) |

---

## 💬 Chat

### GET `/chat/conversations`

Get user's conversations.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/chat/conversations` |
| **Auth Required** | Yes (Bearer) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "participant": {
        "id": "uuid",
        "name": "متجر التقنية العمانية",
        "avatar": "https://cdn.bhd.om/stores/logo.jpg",
        "isOnline": true,
        "lastSeen": "2024-01-01T10:00:00Z"
      },
      "lastMessage": {
        "content": "شكراً لطلبك!",
        "timestamp": "2024-01-01T09:30:00Z",
        "isRead": false
      },
      "unreadCount": 3,
      "updatedAt": "2024-01-01T09:30:00Z"
    }
  ]
}
```

---

### GET `/chat/conversations/:id`

Get conversation messages.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/chat/conversations/:id` |
| **Auth Required** | Yes (Bearer) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Messages per page |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "uuid",
      "participant": { ... },
      "product": {
        "id": "uuid",
        "name": "iPhone 15 Pro Max",
        "image": "https://cdn.bhd.om/products/iphone15-1.jpg",
        "price": 499.000
      },
      "order": null
    },
    "messages": [
      {
        "id": "uuid",
        "senderId": "uuid",
        "content": "مرحباً! هل هذا المنتج متوفر؟",
        "contentType": "text",
        "attachments": [],
        "isRead": true,
        "createdAt": "2024-01-01T09:00:00Z"
      },
      {
        "id": "uuid",
        "senderId": "other-uuid",
        "content": "نعم، متوفر! يمكنك الطلب مباشرة.",
        "contentType": "text",
        "attachments": [],
        "isRead": false,
        "createdAt": "2024-01-01T09:05:00Z"
      }
    ]
  }
}
```

---

### POST `/chat/conversations`

Create or get conversation.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/chat/conversations` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "recipientId": "store-owner-uuid",
  "productId": "uuid",
  "orderId": "optional-order-uuid",
  "initialMessage": "مرحباً، عندي سؤال عن هذا المنتج"
}
```

---

### POST `/chat/conversations/:id/messages`

Send a message.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/chat/conversations/:id/messages` |
| **Auth Required** | Yes (Bearer) |

**Request Body:**

```json
{
  "content": "هل يوجد خصم للكميات؟",
  "contentType": "text",
  "attachments": [
    {
      "type": "image",
      "url": "https://cdn.bhd.om/chat/image.jpg"
    }
  ]
}
```

---

### PUT `/chat/messages/:id/read`

Mark message as read.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/chat/messages/:id/read` |
| **Auth Required** | Yes (Bearer) |

---

### DELETE `/chat/conversations/:id`

Delete conversation.

| Property | Value |
|----------|-------|
| **Method** | `DELETE` |
| **Path** | `/api/v1/chat/conversations/:id` |
| **Auth Required** | Yes (Bearer) |

---

## 🤖 AI Services

### POST `/ai/chat`

Chat with AI assistant.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/ai/chat` |
| **Auth Required** | Optional |
| **Rate Limit** | 50 requests/minute |

**Request Body:**

```json
{
  "message": "أبحث عن هاتف آيفون بسعر أقل من 500 ريال",
  "conversationId": "optional-existing-conversation-id",
  "language": "ar",
  "context": {
    "currentPage": "search",
    "viewedProducts": ["product-uuid-1", "product-uuid-2"]
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "وجدت هذه الخيارات لك! iPhone 15 Pro Max بـ 499 ريال و iPhone 15 بـ 429 ريال. هل تريد مقارنتها؟",
    "conversationId": "uuid",
    "suggestions": [
      "قارن بين iPhone 15 و iPhone 15 Pro",
      "أرني هواتف سامسونج بنفس السعر",
      "هل يوجد خصم إضافي؟"
    ],
    "products": [
      {
        "id": "uuid",
        "name": "iPhone 15 Pro Max",
        "price": 499.000,
        "image": "https://cdn.bhd.om/products/iphone15-1.jpg"
      }
    ],
    "actions": [
      {
        "type": "filter_products",
        "params": { "maxPrice": 500, "category": "smartphones" }
      }
    ]
  }
}
```

---

### POST `/ai/recommendations`

Get AI-powered product recommendations.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/ai/recommendations` |
| **Auth Required** | Optional |

**Request Body:**

```json
{
  "type": "personalized",
  "productId": "optional-current-product-id",
  "category": "optional-category-slug",
  "limit": 10,
  "context": {
    "recentViews": ["product-uuid-1"],
    "recentPurchases": ["product-uuid-2"],
    "cartItems": ["product-uuid-3"]
  }
}
```

**Recommendation Types:**

| Type | Description |
|------|-------------|
| `personalized` | Based on user history |
| `similar` | Similar to given product |
| `frequently_bought` | Frequently bought together |
| `trending` | Trending in category |
| `seasonal` | Seasonal picks |

---

### POST `/ai/search`

AI-powered semantic search.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/ai/search` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "query": "هاتف ممتاز للتصوير",
  "filters": {
    "category": "smartphones",
    "minPrice": 200,
    "maxPrice": 600
  },
  "limit": 20
}
```

---

## 💱 Currency

### GET `/currency/list`

Get supported currencies.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/currency/list` |
| **Auth Required** | No |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "code": "OMR",
      "name": "Omani Rial",
      "nameAr": "ريال عماني",
      "symbol": "ر.ع.",
      "symbolEn": "OMR",
      "decimals": 3,
      "isDefault": true,
      "exchangeRate": 1.000
    },
    {
      "code": "USD",
      "name": "US Dollar",
      "nameAr": "دولار أمريكي",
      "symbol": "$",
      "symbolEn": "USD",
      "decimals": 2,
      "isDefault": false,
      "exchangeRate": 2.597
    },
    {
      "code": "AED",
      "name": "UAE Dirham",
      "nameAr": "درهم إماراتي",
      "symbol": "د.إ",
      "symbolEn": "AED",
      "decimals": 2,
      "isDefault": false,
      "exchangeRate": 9.541
    },
    {
      "code": "SAR",
      "name": "Saudi Riyal",
      "nameAr": "ريال سعودي",
      "symbol": "ر.س",
      "symbolEn": "SAR",
      "decimals": 2,
      "isDefault": false,
      "exchangeRate": 9.750
    }
  ]
}
```

---

### POST `/currency/convert`

Convert between currencies.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/currency/convert` |
| **Auth Required** | No |

**Request Body:**

```json
{
  "amount": 100,
  "from": "OMR",
  "to": "USD"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "amount": 100,
    "from": "OMR",
    "to": "USD",
    "convertedAmount": 259.740,
    "exchangeRate": 2.597,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

## 👑 Admin

### GET `/admin/dashboard`

Get admin dashboard statistics.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/dashboard` |
| **Auth Required** | Yes (Bearer + Admin) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 15420,
      "totalStores": 850,
      "totalProducts": 45120,
      "totalOrders": 25340,
      "totalRevenue": 1250000.000,
      "pendingVerifications": 23
    },
    "charts": {
      "revenue": {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "data": [120000, 150000, 180000, 210000, 240000, 350000]
      },
      "orders": {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "data": [1200, 1500, 1800, 2100, 2400, 3400]
      }
    },
    "recentActivity": [
      {
        "type": "new_order",
        "description": "New order #ORD-2024-001235",
        "timestamp": "2024-01-01T10:00:00Z"
      }
    ],
    "alerts": [
      {
        "type": "verification_pending",
        "message": "23 stores pending verification",
        "severity": "warning"
      }
    ]
  }
}
```

---

### GET `/admin/users`

Manage users (list, filter, export).

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/users` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### PUT `/admin/users/:id/status`

Update user status (suspend/activate).

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/admin/users/:id/status` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### GET `/admin/stores`

Manage stores.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/stores` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### POST `/admin/stores/:id/verify`

Verify a store.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/admin/stores/:id/verify` |
| **Auth Required** | Yes (Bearer + Admin) |

**Request Body:**

```json
{
  "verified": true,
  "badge": "verified",
  "notes": "CR and tax certificate verified"
}
```

---

### GET `/admin/orders`

Manage all orders.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/orders` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### GET `/admin/finance`

Financial overview.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/finance` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### GET `/admin/commissions`

Commission transactions.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/commissions` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### POST `/admin/payouts`

Process seller payouts.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/admin/payouts` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### GET `/admin/reviews`

Moderate reviews.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/reviews` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### PUT `/admin/reviews/:id/moderate`

Moderate a review.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/admin/reviews/:id/moderate` |
| **Auth Required** | Yes (Bearer + Admin) |

**Request Body:**

```json
{
  "status": "approved",
  "reason": "Review meets guidelines"
}
```

---

### GET `/admin/settings`

Get platform settings.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/settings` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### PUT `/admin/settings`

Update platform settings.

| Property | Value |
|----------|-------|
| **Method** | `PUT` |
| **Path** | `/api/v1/admin/settings` |
| **Auth Required** | Yes (Bearer + Admin) |

---

### GET `/admin/audit-log`

View audit log.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/admin/audit-log` |
| **Auth Required** | Yes (Bearer + Admin) |

---

## ❌ Error Codes

### HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | OK - Request succeeded |
| `201` | Created - Resource created |
| `204` | No Content - Request succeeded, no body |
| `400` | Bad Request - Invalid request parameters |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource conflict |
| `422` | Unprocessable Entity - Validation failed |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server error |
| `502` | Bad Gateway - Upstream error |
| `503` | Service Unavailable - Service temporarily down |

### Application Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `EMAIL_EXISTS` | Email already registered | 400 |
| `PHONE_EXISTS` | Phone already registered | 400 |
| `INVALID_CREDENTIALS` | Wrong email/password | 401 |
| `ACCOUNT_LOCKED` | Account temporarily locked | 403 |
| `ACCOUNT_SUSPENDED` | Account suspended | 403 |
| `EMAIL_NOT_VERIFIED` | Email not verified | 403 |
| `TOKEN_EXPIRED` | JWT token expired | 401 |
| `TOKEN_INVALID` | Invalid JWT token | 401 |
| `REFRESH_TOKEN_EXPIRED` | Refresh token expired | 401 |
| `INSUFFICIENT_PERMISSIONS` | Not enough permissions | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource not found | 404 |
| `VALIDATION_ERROR` | Input validation failed | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `PAYMENT_FAILED` | Payment processing failed | 400 |
| `INSUFFICIENT_STOCK` | Not enough stock available | 400 |
| `COUPON_INVALID` | Invalid or expired coupon | 400 |
| `SHIPPING_UNAVAILABLE` | Shipping to location unavailable | 400 |
| `FILE_TOO_LARGE` | Uploaded file exceeds limit | 400 |
| `INVALID_FILE_TYPE` | Unsupported file type | 400 |
| `ORDER_ALREADY_CANCELLED` | Order already cancelled | 409 |
| `ORDER_NOT_CANCELABLE` | Order cannot be cancelled | 400 |

### Validation Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "rule": "email"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "rule": "minLength"
      }
    ]
  }
}
```

---

## 📊 API Rate Limits

| Endpoint Group | Rate Limit |
|----------------|------------|
| Authentication | 10 requests/minute |
| User Registration | 5 requests/minute |
| Password Reset | 5 requests/hour |
| OTP | 5 requests/hour |
| General API | 100 requests/minute |
| Search | 50 requests/minute |
| AI Chat | 50 requests/minute |
| File Upload | 20 requests/minute |
| Admin Endpoints | 200 requests/minute |

---

## 🌐 Localization

Use the `Accept-Language` header to specify response language:

```bash
curl -H "Accept-Language: ar" https://api.bhd.om/api/v1/products
curl -H "Accept-Language: en" https://api.bhd.om/api/v1/products
```

Supported languages: `ar` (Arabic), `en` (English)

---

<div align="center">

**[⬅️ Back to README](./README.md)** | **[📖 Setup Guide](./SETUP.md)** | **[🚀 Deployment](./DEPLOYMENT.md)**

Made with ❤️ in 🇴🇲 Oman

</div>
