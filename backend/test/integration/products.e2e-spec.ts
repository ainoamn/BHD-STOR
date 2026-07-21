import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ProductsModule } from '../../src/modules/products/products.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { StoresModule } from '../../src/modules/stores/stores.module';
import { CategoriesModule } from '../../src/modules/categories/categories.module';

import { Product } from '../../src/modules/products/entities/product.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { Store } from '../../src/modules/stores/entities/store.entity';
import { Category } from '../../src/modules/categories/entities/category.entity';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';

/**
 * ============================================================================
 * Products E2E Tests
 * Tests: CRUD operations, search, filters, pagination, auth requirements
 * ============================================================================
 */

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let storeId: string;
  let categoryId: string;
  let createdProductId: string;

  const testUser = {
    email: `product-test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    firstName: 'Product',
    lastName: 'Tester',
    phone: '+96891234567',
  };

  const testStore = {
    name: 'Test Electronics Store',
    nameAr: 'متجر إلكترونيات تجريبي',
    description: 'A test store for products',
    descriptionAr: 'متجر تجريبي للمنتجات',
    email: `store-${Date.now()}@example.com`,
    phone: '+96891234567',
    crNumber: `CR-${Date.now()}`,
    city: 'Muscat',
    region: 'Muscat Governorate',
  };

  const testCategory = {
    name: 'Test Mobile Phones',
    nameAr: 'هواتف محمولة تجريبية',
    slug: `test-mobile-phones-${Date.now()}`,
    description: 'Test category for mobile phones',
  };

  const testProduct = {
    name: 'Test iPhone 15',
    nameAr: 'آيفون 15 تجريبي',
    slug: `test-iphone-15-${Date.now()}`,
    description: 'Test iPhone 15 for e2e testing',
    descriptionAr: 'آيفون 15 تجريبي للاختبار',
    sku: `SKU-${Date.now()}`,
    price: 450.000,
    compareAtPrice: 475.000,
    quantity: 50,
    weight: 0.206,
    status: 'active',
    isFeatured: true,
    images: [
      { url: '/uploads/products/test-iphone-1.jpg', alt: 'Test iPhone Front', order: 0 },
    ],
    attributes: { color: 'Blue', storage: '256GB' },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.get('DB_HOST', 'localhost'),
            port: config.get<number>('DB_PORT', 5432),
            username: config.get('DB_USER', 'test_user'),
            password: config.get('DB_PASSWORD', 'test_password'),
            database: config.get('DB_NAME', 'bhd_test'),
            entities: [Product, User, Store, Category, RefreshToken],
            synchronize: true,
            dropSchema: true,
            logging: false,
          }),
        }),
        TypeOrmModule.forFeature([Product, User, Store, Category]),
        UsersModule,
        AuthModule,
        StoresModule,
        CategoriesModule,
        ProductsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Register test user
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);
    accessToken = registerRes.body.tokens.accessToken;

    // Create test store
    const storeRes = await request(app.getHttpServer())
      .post('/api/v1/stores')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testStore);
    storeId = storeRes.body.id;

    // Create test category (as admin)
    const categoryRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testCategory);
    categoryId = categoryRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================================================
  // CREATE Product
  // ========================================================================
  describe('POST /api/v1/products', () => {
    it('should create a product with auth token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          storeId,
          categoryId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', testProduct.name);
      expect(response.body).toHaveProperty('slug', testProduct.slug);
      expect(response.body).toHaveProperty('price');
      expect(response.body.price).toBe(testProduct.price);
      expect(response.body).toHaveProperty('storeId', storeId);
      expect(response.body).toHaveProperty('categoryId', categoryId);
      expect(response.body).toHaveProperty('status', 'active');

      createdProductId = response.body.id;
    });

    it('should reject product creation without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          ...testProduct,
          storeId,
          categoryId,
          slug: `another-${Date.now()}`,
        })
        .expect(401);
    });

    it('should reject product with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          price: -10,
          storeId,
        })
        .expect(400);
    });

    it('should reject product with non-existent store', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          storeId: 'non-existent-store-id',
          categoryId,
          slug: `test-${Date.now()}`,
        })
        .expect(404);
    });

    it('should reject duplicate slug', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          storeId,
          categoryId,
        })
        .expect(409);
    });
  });

  // ========================================================================
  // READ Products (List)
  // ========================================================================
  describe('GET /api/v1/products', () => {
    it('should return paginated products list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should return products filtered by store', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products?storeId=${storeId}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((product: any) => {
        expect(product.storeId).toBe(storeId);
      });
    });

    it('should return products filtered by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products?categoryId=${categoryId}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((product: any) => {
        expect(product.categoryId).toBe(categoryId);
      });
    });

    it('should return products filtered by price range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?minPrice=100&maxPrice=500')
        .expect(200);

      response.body.data.forEach((product: any) => {
        expect(parseFloat(product.price)).toBeGreaterThanOrEqual(100);
        expect(parseFloat(product.price)).toBeLessThanOrEqual(500);
      });
    });

    it('should return only featured products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?isFeatured=true')
        .expect(200);

      response.body.data.forEach((product: any) => {
        expect(product.isFeatured).toBe(true);
      });
    });

    it('should search products by query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?search=iphone')
        .expect(200);

      // Should find our test product
      const found = response.body.data.some(
        (p: any) => p.name.toLowerCase().includes('iphone'),
      );
      expect(found).toBe(true);
    });

    it('should return products sorted by price ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?sortBy=price&sortOrder=ASC')
        .expect(200);

      const prices = response.body.data.map((p: any) => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should return paginated results with custom page and limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?status=active')
        .expect(200);

      response.body.data.forEach((product: any) => {
        expect(product.status).toBe('active');
      });
    });
  });

  // ========================================================================
  // READ Single Product
  // ========================================================================
  describe('GET /api/v1/products/:id', () => {
    it('should return a single product by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdProductId);
      expect(response.body).toHaveProperty('name', testProduct.name);
      expect(response.body).toHaveProperty('store');
      expect(response.body).toHaveProperty('category');
    });

    it('should return a product by slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/slug/${testProduct.slug}`)
        .expect(200);

      expect(response.body).toHaveProperty('slug', testProduct.slug);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/non-existent-id')
        .expect(404);
    });

    it('should include store and category relations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .expect(200);

      expect(response.body.store).toBeDefined();
      expect(response.body.category).toBeDefined();
      expect(response.body.store).toHaveProperty('id', storeId);
      expect(response.body.category).toHaveProperty('id', categoryId);
    });
  });

  // ========================================================================
  // UPDATE Product
  // ========================================================================
  describe('PATCH /api/v1/products/:id', () => {
    it('should update product with auth token', async () => {
      const updateData = {
        name: 'Updated iPhone 15 Pro',
        price: 439.000,
        quantity: 75,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdProductId);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(parseFloat(response.body.price)).toBe(updateData.price);
      expect(response.body.quantity).toBe(updateData.quantity);
    });

    it('should reject update without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/products/${createdProductId}`)
        .send({ name: 'Should Fail' })
        .expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Update' })
        .expect(404);
    });

    it('should reject invalid price update', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: -50 })
        .expect(400);
    });

    it('should update product images', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          images: [
            { url: '/uploads/products/updated-1.jpg', alt: 'Updated', order: 0 },
            { url: '/uploads/products/updated-2.jpg', alt: 'Updated 2', order: 1 },
          ],
        })
        .expect(200);

      expect(response.body.images).toHaveLength(2);
    });
  });

  // ========================================================================
  // DELETE Product (Soft Delete)
  // ========================================================================
  describe('DELETE /api/v1/products/:id', () => {
    it('should soft delete product with auth token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should not find deleted product in normal list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      const found = response.body.data.find(
        (p: any) => p.id === createdProductId,
      );
      expect(found).toBeUndefined();
    });

    it('should reject delete without auth', async () => {
      // Create another product to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testProduct,
          slug: `to-delete-${Date.now()}`,
          sku: `SKU-DEL-${Date.now()}`,
          storeId,
          categoryId,
        });

      await request(app.getHttpServer())
        .delete(`/api/v1/products/${createRes.body.id}`)
        .expect(401);
    });

    it('should return 404 for already deleted product', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ========================================================================
  // SEARCH Products
  // ========================================================================
  describe('GET /api/v1/products/search', () => {
    it('should search products by keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search?q=iphone')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search?q=xyznonexistent123')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  // ========================================================================
  // GET Featured Products
  // ========================================================================
  describe('GET /api/v1/products/featured', () => {
    it('should return featured products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/featured')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ========================================================================
  // GET Store Products
  // ========================================================================
  describe('GET /api/v1/products/store/:storeId', () => {
    it('should return products for a specific store', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/store/${storeId}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
