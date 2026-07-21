import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShipmentService } from '../services/shipment.service';

@ApiTags('Public - Tracking')
@Controller('tracking')
export class PublicTrackingController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get(':trackingNumber')
  @ApiOperation({ summary: 'Track shipment by tracking number (Public)' })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    try {
      const shipment = await this.shipmentService.findByTracking(trackingNumber);
      return {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        senderName: shipment.senderName,
        receiverName: shipment.receiverName,
        promisedDeliveryDate: shipment.promisedDeliveryDate,
        deliveryDate: shipment.deliveryDate,
        serviceType: shipment.serviceType,
        totalCost: shipment.totalCost,
        createdAt: shipment.createdAt,
      };
    } catch (error) {
      throw new NotFoundException(
        `No shipment found with tracking number: ${trackingNumber}`,
      );
    }
  }

  @Get(':trackingNumber/timeline')
  @ApiOperation({ summary: 'Get shipment timeline (Public)' })
  @ApiResponse({ status: 200, description: 'Timeline found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  async getTimeline(@Param('trackingNumber') trackingNumber: string) {
    try {
      const shipment = await this.shipmentService.findByTracking(trackingNumber);
      return {
        trackingNumber: shipment.trackingNumber,
        timeline: shipment.timeline,
      };
    } catch (error) {
      throw new NotFoundException(
        `No shipment found with tracking number: ${trackingNumber}`,
      );
    }
  }
}
