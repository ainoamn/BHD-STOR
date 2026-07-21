import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { WinstonLoggerService } from '@common/services/logger.service';

async function bootstrap() {
  const logger = new WinstonLoggerService();
  
  const app = await NestFactory.create(AppModule, {
    logger,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", frontendUrl],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://www.paypal.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: nodeEnv === 'production' 
      ? [frontendUrl, /\.bhdoman\.com$/] 
      : [frontendUrl, 'http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Request-ID',
      'X-Client-Version',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });

  // Canonical routes: /api/v1/...
  // Do NOT put "api" inside the version prefix — that causes /api/api/v1/...
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/(.*)'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Rate limiting
  const rateLimitWindowMs = configService.get<number>('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
  const rateLimitMaxRequests = configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100);
  
  app.use(
    rateLimit({
      windowMs: rateLimitWindowMs,
      max: rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Too many requests, please try again later.',
        error: 'Too Many Requests',
      },
      skip: (req) => {
        const path = (req.originalUrl || req.url || '').split('?')[0];
        return (
          path === '/health' ||
          path.endsWith('/health') ||
          path.startsWith('/api/docs') ||
          path.includes('/api/docs')
        );
      },
    }),
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Global interceptors
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
    new LoggingInterceptor(logger),
  );

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BHD Oman Marketplace API')
      .setDescription(
        'Complete e-commerce marketplace API for BHD Oman. Supports multi-vendor, multi-currency, AI-powered features, and real-time communication.',
      )
      .setVersion('1.0.0')
      .setContact('BHD Support', 'https://bhdoman.com/support', 'support@bhdoman.com')
      .setLicense('Proprietary', 'https://bhdoman.com/license')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'access-token',
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'X-Refresh-Token',
          description: 'Enter JWT refresh token',
          in: 'header',
        },
        'refresh-token',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API key for external integrations',
        },
        'api-key',
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('Stores', 'Store/vendor management')
      .addTag('Products', 'Product catalog management')
      .addTag('Orders', 'Order processing and management')
      .addTag('Payments', 'Payment processing (Stripe, PayPal, Oman Net, Thawani, Telr)')
      .addTag('Shipping', 'Shipping and logistics')
      .addTag('Subscriptions', 'Subscription plans and billing')
      .addTag('Chat', 'Real-time messaging')
      .addTag('Currency', 'Multi-currency support')
      .addTag('AI', 'AI-powered features and recommendations')
      .addTag('Analytics', 'Reports and analytics')
      .addTag('Notifications', 'Email, SMS, and push notifications')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
    });

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'BHD Oman API Documentation',
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  
  logger.log(
    `🚀 BHD Oman Marketplace API is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `📚 API Documentation: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
  logger.log(
    `🔧 Environment: ${nodeEnv}`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
