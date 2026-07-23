import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from './throttler.guard';
import { ThrottleLevel, THROTTLE_KEY } from '@common/decorators/throttle.decorator';

function mockContext(path = '/payments/webhook/stripe') {
  const headers: Record<string, string | number> = {};
  const request = {
    ip: '203.0.113.10',
    path,
    route: { path },
    user: undefined,
  };
  const response = {
    setHeader: (k: string, v: string | number) => {
      headers[k] = v;
    },
  };
  const ctx = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return { ctx, headers, request };
}

describe('ThrottlerGuard', () => {
  it('allows requests under the limit using memory store', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(ThrottleLevel.WEBHOOK),
    } as unknown as Reflector;
    const guard = new ThrottlerGuard(reflector);
    const { ctx, headers } = mockContext(`/rl-test-${Date.now()}-ok`);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(headers['X-RateLimit-Limit']).toBe(120);
    expect(headers['X-RateLimit-Store']).toBe('memory');
  });

  it('blocks when memory limit is exceeded', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(ThrottleLevel.STRICT),
    } as unknown as Reflector;
    const guard = new ThrottlerGuard(reflector);
    const path = `/rl-test-${Date.now()}-block`;
    const { ctx } = mockContext(path);

    for (let i = 0; i < 5; i++) {
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    }

    try {
      await guard.canActivate(ctx);
      fail('expected rate limit HttpException');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });

  it('uses Redis when available', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(ThrottleLevel.WEBHOOK),
    } as unknown as Reflector;

    const redis = {
      incr: jest.fn().mockResolvedValue(1),
      pexpire: jest.fn().mockResolvedValue(1),
      pttl: jest.fn().mockResolvedValue(60_000),
    };

    const guard = new ThrottlerGuard(reflector, redis as any);
    const { ctx, headers } = mockContext(`/rl-redis-${Date.now()}`);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.incr).toHaveBeenCalled();
    expect(headers['X-RateLimit-Store']).toBe('redis');
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      THROTTLE_KEY,
      expect.any(Array),
    );
  });

  it('falls back to memory when Redis throws', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(ThrottleLevel.LENIENT),
    } as unknown as Reflector;

    const redis = {
      incr: jest.fn().mockRejectedValue(new Error('redis down')),
      pexpire: jest.fn(),
      pttl: jest.fn(),
    };

    const guard = new ThrottlerGuard(reflector, redis as any);
    const { ctx, headers } = mockContext(`/rl-fallback-${Date.now()}`);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(headers['X-RateLimit-Store']).toBe('memory');
  });
});
