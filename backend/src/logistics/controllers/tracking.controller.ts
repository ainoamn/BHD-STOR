import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TrackingService } from '../services/tracking.service';

@ApiTags('Logistics - Tracking')
@Controller('logistics/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':trackingNumber')
  @ApiOperation({ summary: 'Get public tracking info by tracking number' })
  async getTracking(@Param('trackingNumber') trackingNumber: string) {
    return this.trackingService.getPublicTracking(trackingNumber);
  }
}
