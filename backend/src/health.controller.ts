import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      service: 'bhd-marketplace-api',
      timestamp: new Date().toISOString(),
    };
  }
}
