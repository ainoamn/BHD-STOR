import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@nestjs-modules/ioredis';

import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';
import { PasswordResetToken } from '../../src/modules/auth/entities/password-reset-token.entity';

/**
 * ============================================================================
 * Auth E2E Tests
 * Tests: POST /auth/register, POST /auth/login, POST /auth/refresh,
 *        POST /auth/forgot-password, GET /auth/me, Auth guards
 * ============================================================================
 */

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  let registeredUserId: string;

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+96891234567',
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
            entities: [User, RefreshToken, PasswordResetToken],
            synchronize: true,
            dropSchema: true,
            logging: false,
          }),
        }),
        TypeOrmModule.forFeature([User, RefreshToken, PasswordResetToken]),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET', 'test-secret'),
            signOptions: { expiresIn: '15m' },
          }),
        }),
        UsersModule,
        AuthModule,
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
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================================================
  // POST /auth/register
  // ========================================================================
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.firstName).toBe(testUser.firstName);
      expect(response.body.user.lastName).toBe(testUser.lastName);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens).toHaveProperty('expiresIn');

      // Save for later tests
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
      registeredUserId = response.body.user.id;
    });

    it('should not register user with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400);
    });

    it('should not register user with weak password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: `new-${Date.now()}@example.com`, password: 'weak' })
        .expect(400);
    });

    it('should not register user with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should not allow duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should not return password in response', async () => {
      const newEmail = `secure-${Date.now()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: newEmail })
        .expect(201);

      const responseBody = JSON.stringify(response.body);
      expect(responseBody).not.toContain('password');
      expect(responseBody).not.toContain(testUser.password);
    });
  });

  // ========================================================================
  // POST /auth/login
  // ========================================================================
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.tokens.accessToken).toBeTruthy();

      // Update tokens for later tests
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should reject login with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: testUser.password })
        .expect(400);
    });
  });

  // ========================================================================
  // POST /auth/refresh
  // ========================================================================
  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.accessToken).not.toBe(accessToken);

      // Update tokens
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should reject with missing refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should reject with reused refresh token', async () => {
      // First use
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Reuse should fail (token rotation)
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  // ========================================================================
  // POST /auth/forgot-password
  // ========================================================================
  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset email has been sent');
    });

    it('should return same message for non-existent email (security)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('reset email has been sent');
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  // ========================================================================
  // GET /auth/me
  // ========================================================================
  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      // Get fresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.tokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('role');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject without authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject with expired token', async () => {
      // Use an old token that should be expired
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
        .expect(401);
    });

    it('should reject with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'NotBearer token123')
        .expect(401);
    });
  });

  // ========================================================================
  // POST /auth/logout
  // ========================================================================
  describe('POST /api/v1/auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.tokens.accessToken}`)
        .send({ refreshToken: loginRes.body.tokens.refreshToken })
        .expect(200);
    });

    it('should not fail with invalid refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.tokens.accessToken}`)
        .send({ refreshToken: 'invalid-token' })
        .expect(200);
    });
  });

  // ========================================================================
  // Auth Guards
  // ========================================================================
  describe('Auth Guards', () => {
    it('should allow access to protected route with valid JWT', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.tokens.accessToken}`)
        .expect(200);
    });

    it('should deny access to protected route without JWT', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should deny access with tampered JWT', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });

  // ========================================================================
  // POST /auth/reset-password
  // ========================================================================
  describe('POST /api/v1/auth/reset-password', () => {
    it('should reject invalid reset token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(400);
    });

    it('should reject weak new password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'some-token',
          newPassword: 'weak',
        })
        .expect(400);
    });

    it('should reject missing new password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'some-token' })
        .expect(400);
    });
  });

  // ========================================================================
  // Rate Limiting
  // ========================================================================
  describe('Rate Limiting', () => {
    it('should handle rapid login attempts', async () => {
      const attempts = Array.from({ length: 15 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: testUser.email, password: 'wrong' }),
      );

      const results = await Promise.all(attempts);
      // After rate limit, some should be 429
      const tooManyRequests = results.filter((r) => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
