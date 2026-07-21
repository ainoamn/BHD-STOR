import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

/**
 * ============================================================================
 * BHD Oman Marketplace - Test Setup
 * Global beforeAll/afterAll, database setup/teardown, test data fixtures
 * ============================================================================
 */

// Test database configuration
export const TEST_DB_CONFIG = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'test_user',
  password: process.env.DB_PASSWORD || 'test_password',
  database: process.env.DB_NAME || 'bhd_test',
  synchronize: true,
  dropSchema: true,
  logging: false,
};

// Test data fixtures
export const TEST_FIXTURES = {
  users: [
    {
      email: 'admin@test.com',
      password: 'Admin@123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
    },
    {
      email: 'store@test.com',
      password: 'Store@123!',
      firstName: 'Store',
      lastName: 'Owner',
      role: 'store_owner',
      status: 'active',
      emailVerified: true,
    },
    {
      email: 'customer@test.com',
      password: 'Customer@123!',
      firstName: 'Regular',
      lastName: 'Customer',
      role: 'customer',
      status: 'active',
      emailVerified: true,
    },
  ],
  categories: [
    { name: 'Test Electronics', nameAr: 'إلكترونيات تجريبية', slug: 'test-electronics' },
    { name: 'Test Fashion', nameAr: 'أزياء تجريبية', slug: 'test-fashion' },
  ],
  currencies: [
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', exchangeRate: 1.0, isDefault: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 2.6, isDefault: false },
  ],
};

// Global test state
let testDataSource: DataSource | null = null;
let testApp: INestApplication | null = null;

/**
 * Initialize test database connection
 */
export async function initTestDatabase(): Promise<DataSource> {
  if (testDataSource?.isInitialized) {
    return testDataSource;
  }

  testDataSource = new DataSource({
    ...TEST_DB_CONFIG,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  });

  await testDataSource.initialize();
  return testDataSource;
}

/**
 * Clean database - truncate all tables
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}

/**
 * Seed test fixtures
 */
export async function seedFixtures(dataSource: DataSource): Promise<Record<string, any>> {
  const fixtures: Record<string, any> = {};

  // Seed currencies
  const currencyRepo = dataSource.getRepository('Currency');
  fixtures.currencies = await currencyRepo.save(TEST_FIXTURES.currencies);

  // Seed users
  const { hashSync } = require('bcrypt');
  const userRepo = dataSource.getRepository('User');
  const usersWithHashedPasswords = TEST_FIXTURES.users.map((u) => ({
    ...u,
    password: hashSync(u.password, 12),
  }));
  fixtures.users = await userRepo.save(usersWithHashedPasswords);

  // Seed categories
  const categoryRepo = dataSource.getRepository('Category');
  fixtures.categories = await categoryRepo.save(TEST_FIXTURES.categories);

  return fixtures;
}

/**
 * Create test NestJS application
 */
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [module],
  }).compile();

  testApp = moduleRef.createNestApplication();
  await testApp.init();
  return testApp;
}

/**
 * Close test application
 */
export async function closeTestApp(): Promise<void> {
  if (testApp) {
    await testApp.close();
    testApp = null;
  }
}

/**
 * Mock external services for tests
 */
export function mockExternalServices(): void {
  // Mock email service
  jest.mock('../src/modules/mail/mail.service', () => ({
    MailService: jest.fn().mockImplementation(() => ({
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendOrderShippedEmail: jest.fn().mockResolvedValue(true),
    })),
  }));

  // Mock file upload service
  jest.mock('../src/modules/uploads/uploads.service', () => ({
    UploadsService: jest.fn().mockImplementation(() => ({
      uploadFile: jest.fn().mockResolvedValue({
        url: '/uploads/test-file.jpg',
        key: 'test-file-key',
      }),
      deleteFile: jest.fn().mockResolvedValue(true),
    })),
  }));

  // Mock payment gateway
  jest.mock('../src/modules/payments/payment.service', () => ({
    PaymentService: jest.fn().mockImplementation(() => ({
      createPaymentIntent: jest.fn().mockResolvedValue({
        clientSecret: 'test_secret',
        paymentIntentId: 'pi_test_123',
      }),
      processRefund: jest.fn().mockResolvedValue({ status: 'refunded' }),
      verifyPayment: jest.fn().mockResolvedValue({ status: 'completed' }),
    })),
  }));

  // Mock Redis
  jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      expire: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(3600),
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
  });

  // Mock Elasticsearch
  jest.mock('@nestjs/elasticsearch', () => ({
    ElasticsearchModule: {
      register: jest.fn().mockReturnValue({
        module: class MockElasticsearchModule {},
        providers: [],
      }),
    },
    ElasticsearchService: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockResolvedValue({ result: 'created' }),
      search: jest.fn().mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] },
      }),
      delete: jest.fn().mockResolvedValue({ result: 'deleted' }),
      update: jest.fn().mockResolvedValue({ result: 'updated' }),
    })),
  }));
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);

  return {
    email: `test-${timestamp}-${randomStr}@example.com`,
    password: 'Test@123!',
    firstName: 'Test',
    lastName: 'User',
    phone: `+9689${Math.floor(1000000 + Math.random() * 9000000)}`,
    storeName: `Test Store ${timestamp}`,
    storeSlug: `test-store-${timestamp}-${randomStr}`,
    productName: `Test Product ${timestamp}`,
    productSlug: `test-product-${timestamp}-${randomStr}`,
    sku: `SKU-${timestamp}-${randomStr}`,
    categoryName: `Test Category ${timestamp}`,
    categorySlug: `test-category-${timestamp}-${randomStr}`,
    orderNumber: `ORD-${timestamp}-${randomStr}`,
  };
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeout: number = 5000,
  interval: number = 100,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-do-not-use-in-production';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.JWT_EXPIRATION = '15m';
  process.env.JWT_REFRESH_EXPIRATION = '7d';

  // Mock external services
  mockExternalServices();

  console.log('Test environment initialized');
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(async () => {
  // Clean up database connection
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }

  // Close test app
  await closeTestApp();

  console.log('Test environment cleaned up');
});

/**
 * Reset mocks after each test
 */
afterEach(() => {
  jest.clearAllMocks();
});

// Export for use in test files
export { testDataSource, testApp };
