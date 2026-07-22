import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { featureFlags } from './config/feature-flags';

@Controller()
export class HealthController {
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
}
