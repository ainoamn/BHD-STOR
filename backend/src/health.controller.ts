import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Public } from './common/decorators/public.decorator';
import { featureFlags } from './config/feature-flags';

@Controller()
export class HealthController {
  constructor(
    @Optional() @InjectDataSource() private readonly dataSource?: DataSource,
    @Optional() @InjectRedis() private readonly redis?: Redis,
  ) {}

  @Public()
  @Get('health')
  check() {
    return {
      status: 'ok',
      service: 'bhd-marketplace-api',
      timestamp: new Date().toISOString(),
      features: featureFlags,
    };
  }

  /**
   * Readiness probe — Postgres + Redis must respond.
   * Liveness stays on GET /health (always ok if process is up).
   */
  @Public()
  @Get('health/ready')
  async ready() {
    const checks: Record<string, { ok: boolean; detail?: string }> = {
      postgres: { ok: false },
      redis: { ok: false },
    };

    if (this.dataSource?.isInitialized) {
      try {
        await this.dataSource.query('SELECT 1');
        checks.postgres = { ok: true };
      } catch (err: any) {
        checks.postgres = { ok: false, detail: err?.message || 'query failed' };
      }
    } else {
      checks.postgres = { ok: false, detail: 'DataSource not initialized' };
    }

    if (this.redis) {
      try {
        const pong = await Promise.race([
          this.redis.ping(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('redis ping timeout')), 2000),
          ),
        ]);
        checks.redis = {
          ok: pong === 'PONG' || pong === 'pong',
          detail: String(pong),
        };
      } catch (err: any) {
        checks.redis = { ok: false, detail: err?.message || 'ping failed' };
      }
    } else {
      checks.redis = { ok: false, detail: 'Redis client not available' };
    }

    const ready = checks.postgres.ok && checks.redis.ok;
    const body = {
      status: ready ? 'ready' : 'not_ready',
      service: 'bhd-marketplace-api',
      timestamp: new Date().toISOString(),
      checks,
    };

    if (!ready) {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }
}
