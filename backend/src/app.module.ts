import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';
import { LoggerModule } from 'nestjs-pino';

// ─── Configuration ──────────────────────────────────────────

import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import appConfig from './config/app.config';

// ─── Core Modules ───────────────────────────────────────────

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { HealthController } from './health.controller';

// ─── Logistics Module ───────────────────────────────────────
import { LogisticsModule } from './logistics/logistics.module';

// ─── Returns & Exchanges ────────────────────────────────────
import { ReturnsModule } from './returns/returns.module';

// ─── Loyalty & Rewards ──────────────────────────────────────
import { LoyaltyModule } from './loyalty/loyalty.module';

// ─── Gamification ───────────────────────────────────────────
import { GamificationModule } from './gamification/gamification.module';

// ─── Blockchain Tracking ────────────────────────────────────
import { BlockchainModule } from './blockchain/blockchain.module';

// ─── Accounting System ──────────────────────────────────────
import { AccountingModule } from './accounting/accounting.module';

// ─── HR Management ──────────────────────────────────────────
import { HrModule } from './hr/hr.module';

// ─── CRM System ─────────────────────────────────────────────
import { CrmModule } from './crm/crm.module';

// ─── Commission System ──────────────────────────────────────
import { CommissionModule } from './commission/commission.module';

// ─── Advanced Analytics ─────────────────────────────────────
import { AdvancedAnalyticsModule } from './analytics/advanced-analytics.module';

// ─── Drone Delivery ─────────────────────────────────────────
import { DroneModule } from './drone/drone.module';

// ─── Security Module ────────────────────────────────────────
import { SecurityModule } from './security/security.module';

// ─── Middleware ─────────────────────────────────────────────

import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

// ─── Module ─────────────────────────────────────────────────

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, appConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // Logger
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', 'info'),
          transport:
            config.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'bhd_marketplace'),
        schema: config.get('DB_SCHEMA', 'public'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: config.get('DB_MIGRATIONS_RUN', 'false') === 'true',
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
        extra: {
          max: 20, // connection pool max size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
      inject: [ConfigService],
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL', 'redis://localhost:6379'),
        options: {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        },
      }),
      inject: [ConfigService],
    }),

    // Event Emitter
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 50,
      verboseMemoryLeak: true,
    }),

    // Bull Queue (for background jobs)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // ─── Feature Modules ──────────────────────────

    AuthModule,
    UsersModule,
    NotificationsModule,
    MarketplaceModule,

    // ─── Logistics Module ─────────────────────────
    LogisticsModule,

    // ─── Returns & Exchanges ──────────────────────
    ReturnsModule,

    // ─── Loyalty & Rewards ────────────────────────
    LoyaltyModule,

    // ─── Gamification ─────────────────────────────
    GamificationModule,

    // ─── Blockchain Tracking ──────────────────────
    BlockchainModule,

    // ─── Accounting System ────────────────────────
    AccountingModule,

    // ─── HR Management ────────────────────────────
    HrModule,

    // ─── CRM System ───────────────────────────────
    CrmModule,

    // ─── Commission System ────────────────────────
    CommissionModule,

    // ─── Advanced Analytics ───────────────────────
    AdvancedAnalyticsModule,

    // ─── Drone Delivery ───────────────────────────
    DroneModule,

    // ─── Security Module ──────────────────────────
    SecurityModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}
