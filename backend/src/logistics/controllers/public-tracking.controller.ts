import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ShipmentService } from '../services/shipment.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  matchesReceiverPhoneLast4,
  sanitizePublicTimeline,
} from '../utils/public-tracking';

@ApiTags('Public - Tracking')
@Public()
@Controller('tracking')
export class PublicTrackingController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get(':trackingNumber')
  @ApiOperation({
    summary:
      'Track shipment by tracking number (public — PII/cost redacted unless phone last-4 matches)',
  })
  @ApiQuery({
    name: 'phoneLast4',
    required: false,
    description: 'Last 4 digits of receiver phone to unlock limited recipient details',
  })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async trackShipment(
    @Param('trackingNumber') trackingNumber: string,
    @Query('phoneLast4') phoneLast4?: string,
  ) {
    try {
      const shipment = await this.shipmentService.findByTracking(trackingNumber);
      const verified = matchesReceiverPhoneLast4(
        shipment.receiverPhone,
        phoneLast4,
      );

      const base = {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        promisedDeliveryDate: shipment.promisedDeliveryDate,
        deliveryDate: shipment.deliveryDate,
        serviceType: shipment.serviceType,
        createdAt: shipment.createdAt,
        verified,
      };

      if (!verified) {
        return base;
      }

      return {
        ...base,
        receiverName: shipment.receiverName,
      };
    } catch {
      throw new NotFoundException(
        `No shipment found with tracking number: ${trackingNumber}`,
      );
    }
  }

  @Get(':trackingNumber/timeline')
  @ApiOperation({ summary: 'Get shipment timeline (public, sanitized)' })
  @ApiResponse({ status: 200, description: 'Timeline found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async getTimeline(@Param('trackingNumber') trackingNumber: string) {
    try {
      const shipment = await this.shipmentService.findByTracking(trackingNumber);
      return {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        timeline: sanitizePublicTimeline(shipment.timeline),
      };
    } catch {
      throw new NotFoundException(
        `No shipment found with tracking number: ${trackingNumber}`,
      );
    }
  }
}
