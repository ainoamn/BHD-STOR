import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ShippingCalculatorService } from './services/shipping-calculator.service';
import { TrackingService } from './services/tracking.service';
import { OmanPostService } from './services/oman-post.service';
import { AramexService } from './services/aramex.service';
import { DHLService } from './services/dhl.service';
import { FedExService } from './services/fedex.service';
import { UPSService } from './services/ups.service';
import { CreateShipmentDto, ShippingCarrier } from './dto/create-shipment.dto';
import { RateRequestDto, RateComparisonResult } from './dto/rate-request.dto';
import { TrackingRequestDto, TrackingResult } from './dto/tracking-request.dto';
import { ShippingAddress } from './dto/create-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(
    private readonly shippingCalculator: ShippingCalculatorService,
    private readonly trackingService: TrackingService,
    private readonly omanPostService: OmanPostService,
    private readonly aramexService: AramexService,
    private readonly dhlService: DHLService,
    private readonly fedExService: FedExService,
    private readonly upsService: UPSService,
  ) {}

  /**
   * Get shipping rates (compare all carriers)
   */
  @Post('rates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Compare shipping rates',
    description: 'Get shipping rates from all carriers for a given origin, destination, and weight. Returns rates sorted by price.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rates retrieved successfully',
    schema: {
      example: {
        rates: [
          {
            carrier: 'aramex',
            carrierName: 'Aramex',
            service: 'express',
            serviceName: 'Aramex Express Parcel',
            totalAmount: 5.5,
            currency: 'OMR',
            estimatedDelivery: '2024-01-18',
            estimatedDays: 1,
            trackingAvailable: true,
          },
        ],
        cheapest: {},
        fastest: {},
        recommended: {},
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid rate request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRates(@Body() dto: RateRequestDto): Promise<RateComparisonResult> {
    this.logger.log(`Rate comparison request: ${dto.origin.city} -> ${dto.destination.city}, ${dto.weight}kg`);

    if (!dto.origin || !dto.destination || !dto.weight) {
      throw new BadRequestException('Origin, destination, and weight are required');
    }

    return this.shippingCalculator.compareRates(
      dto.origin,
      dto.destination,
      dto.weight,
      dto.dimensions,
    );
  }

  /**
   * Create a shipment
   */
  @Post('shipments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create shipment',
    description: 'Create a shipment with the selected carrier. Returns tracking number and label.',
  })
  @ApiResponse({ status: 201, description: 'Shipment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid shipment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createShipment(@Body() dto: CreateShipmentDto) {
    this.logger.log(`Shipment creation request: order ${dto.orderId} via ${dto.carrierId}`);

    const { orderId, carrierId, senderAddress, recipientAddress, weight, dimensions, shippingMethod, insuranceAmount, signatureRequired, description, codAmount } = dto;

    switch (carrierId) {
      case 'oman_post': {
        return this.omanPostService.createShipment(orderId, senderAddress, recipientAddress, weight, dimensions, {
          shippingMethod,
          insuranceAmount,
          signatureRequired,
          description,
          codAmount,
        });
      }
      case 'aramex': {
        return this.aramexService.createShipment({
          orderId,
          sender: senderAddress,
          recipient: recipientAddress,
          weight,
          dimensions,
          description,
          insuranceAmount,
          codAmount,
          service: shippingMethod === 'express' ? 'PPX' : 'ONP',
        });
      }
      case 'dhl': {
        return this.dhlService.createShipment({
          orderId,
          sender: senderAddress,
          recipient: recipientAddress,
          weight,
          dimensions,
          description,
          insuranceAmount,
          service: shippingMethod === 'express' ? 'P' : 'D',
        });
      }
      case 'fedex': {
        return this.fedExService.createShipment({
          orderId,
          sender: senderAddress,
          recipient: recipientAddress,
          weight,
          dimensions,
          description,
          insuranceAmount,
          service: shippingMethod === 'express' ? 'INTERNATIONAL_PRIORITY' : 'INTERNATIONAL_ECONOMY',
        });
      }
      case 'ups': {
        return this.upsService.createShipment({
          orderId,
          sender: senderAddress,
          recipient: recipientAddress,
          weight,
          dimensions,
          description,
          insuranceAmount,
          service: shippingMethod === 'express' ? '07' : '08',
        });
      }
      default:
        throw new BadRequestException(`Unsupported carrier: ${carrierId}`);
    }
  }

  /**
   * Track shipment (with carrier in query params)
   */
  @Get('track')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Track shipment',
    description: 'Get tracking information for a shipment using carrier and tracking number.',
  })
  @ApiQuery({ name: 'trackingNumber', required: true, example: '1234567890' })
  @ApiQuery({ name: 'carrier', required: true, enum: ['oman_post', 'aramex', 'dhl', 'fedex', 'ups'] })
  @ApiResponse({ status: 200, description: 'Tracking information retrieved' })
  @ApiResponse({ status: 400, description: 'Missing tracking parameters' })
  async trackShipment(
    @Query('trackingNumber') trackingNumber: string,
    @Query('carrier') carrier: string,
  ): Promise<TrackingResult> {
    if (!trackingNumber || !carrier) {
      throw new BadRequestException('trackingNumber and carrier query parameters are required');
    }

    this.logger.log(`Tracking request: ${carrier} #${trackingNumber}`);
    return this.trackingService.trackShipment(trackingNumber, carrier);
  }

  /**
   * Track shipment (with carrier in URL)
   */
  @Get('track/:carrier/:number')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Track shipment (URL path)',
    description: 'Get tracking information using carrier and tracking number in the URL path.',
  })
  @ApiParam({ name: 'carrier', enum: ['oman_post', 'aramex', 'dhl', 'fedex', 'ups'] })
  @ApiParam({ name: 'number', description: 'Tracking/AWB number' })
  @ApiResponse({ status: 200, description: 'Tracking information retrieved' })
  async trackWithCarrier(
    @Param('carrier') carrier: string,
    @Param('number') number: string,
  ): Promise<TrackingResult> {
    this.logger.log(`Tracking request: ${carrier} #${number}`);
    return this.trackingService.trackShipment(number, carrier);
  }

  /**
   * Download shipping label
   */
  @Get('shipments/:id/label')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download shipping label',
    description: 'Download the shipping label for a shipment as PDF.',
  })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiQuery({ name: 'carrier', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'zpl', 'png'], example: 'pdf' })
  @ApiResponse({ status: 200, description: 'Label PDF' })
  async downloadLabel(
    @Param('id') shipmentId: string,
    @Query('carrier') carrier: string,
    @Query('format') format: string = 'pdf',
    @Res() res: Response,
  ) {
    this.logger.log(`Label download request: ${carrier} shipment ${shipmentId}`);

    let result: { labelData: string; contentType: string };

    switch (carrier.toLowerCase()) {
      case 'oman_post':
        result = await this.omanPostService.generateLabel(shipmentId, format as any);
        break;
      case 'aramex':
        result = await this.aramexService.generateLabel(shipmentId, format as any);
        break;
      case 'dhl':
        result = await this.dhlService.generateLabel(shipmentId, format as any);
        break;
      case 'fedex':
        result = await this.fedExService.generateLabel(shipmentId, format as any);
        break;
      case 'ups':
        result = await this.upsService.generateLabel(shipmentId, format as any);
        break;
      default:
        throw new BadRequestException(`Unsupported carrier for label generation: ${carrier}`);
    }

    if (!result.labelData) {
      throw new NotFoundException('Label not available');
    }

    const buffer = Buffer.from(result.labelData, 'base64');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
    res.send(buffer);
  }

  /**
   * Cancel a shipment
   */
  @Post('shipments/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel shipment',
    description: 'Cancel a previously created shipment.',
  })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  @ApiQuery({ name: 'carrier', required: true })
  @ApiResponse({ status: 200, description: 'Shipment cancelled' })
  @ApiResponse({ status: 400, description: 'Cancellation failed' })
  async cancelShipment(
    @Param('id') shipmentId: string,
    @Query('carrier') carrier: string,
  ) {
    this.logger.log(`Shipment cancellation request: ${carrier} #${shipmentId}`);

    switch (carrier.toLowerCase()) {
      case 'oman_post':
        return this.omanPostService.cancelShipment(shipmentId);
      case 'aramex':
        return this.aramexService.cancelShipment(shipmentId);
      case 'dhl':
        // DHL cancellation would be implemented
        return { success: false, error: 'DHL cancellation not yet implemented' };
      case 'fedex':
        // FedEx cancellation would be implemented
        return { success: false, error: 'FedEx cancellation not yet implemented' };
      case 'ups':
        // UPS cancellation would be implemented
        return { success: false, error: 'UPS cancellation not yet implemented' };
      default:
        throw new BadRequestException(`Unsupported carrier: ${carrier}`);
    }
  }

  /**
   * Validate shipping address
   */
  @Post('validate-address')
  @ApiOperation({
    summary: 'Validate address',
    description: 'Validate a shipping address for deliverability.',
  })
  @ApiResponse({ status: 200, description: 'Address validation result' })
  async validateAddress(@Body() address: ShippingAddress) {
    this.logger.log(`Address validation request for ${address.country}`);
    return this.shippingCalculator.validateAddress(address);
  }

  /**
   * List available carriers
   */
  @Get('carriers')
  @ApiOperation({
    summary: 'List carriers',
    description: 'Get a list of all available shipping carriers.',
  })
  @ApiResponse({ status: 200, description: 'List of carriers' })
  async listCarriers() {
    return {
      carriers: [
        {
          id: 'oman_post',
          name: 'Oman Post',
          services: ['standard', 'express', 'registered'],
          domestic: true,
          international: true,
          tracking: true,
          codAvailable: true,
          logo: '/assets/carriers/oman-post.svg',
        },
        {
          id: 'aramex',
          name: 'Aramex',
          services: ['express', 'domestic'],
          domestic: true,
          international: true,
          tracking: true,
          codAvailable: true,
          logo: '/assets/carriers/aramex.svg',
        },
        {
          id: 'dhl',
          name: 'DHL Express',
          services: ['express', 'economy'],
          domestic: true,
          international: true,
          tracking: true,
          codAvailable: false,
          logo: '/assets/carriers/dhl.svg',
        },
        {
          id: 'fedex',
          name: 'FedEx',
          services: ['priority', 'economy'],
          domestic: true,
          international: true,
          tracking: true,
          codAvailable: false,
          logo: '/assets/carriers/fedex.svg',
        },
        {
          id: 'ups',
          name: 'UPS',
          services: ['express', 'expedited'],
          domestic: true,
          international: true,
          tracking: true,
          codAvailable: false,
          logo: '/assets/carriers/ups.svg',
        },
      ],
    };
  }

  /**
   * List shipping zones
   */
  @Get('zones')
  @ApiOperation({
    summary: 'List shipping zones',
    description: 'Get all configured shipping zones.',
  })
  @ApiResponse({ status: 200, description: 'List of shipping zones' })
  async listZones() {
    return {
      zones: [
        { id: 'muscat', name: 'Muscat Capital Area', cities: ['Muscat', 'Seeb', 'Bawshar', 'Quriyat'], baseRate: 1.0 },
        { id: 'batinah', name: 'Al Batinah', cities: ['Barka', 'Sohar', 'Rustaq', 'Shinas', 'Suwayq'], baseRate: 1.5 },
        { id: 'dhofar', name: 'Dhofar', cities: ['Salalah', 'Marmul', 'Thumrait'], baseRate: 2.5 },
        { id: 'dakhiliyah', name: 'Ad Dakhiliyah', cities: ['Nizwa', 'Bahla', 'Izki', 'Samail', 'Manah', 'Adam'], baseRate: 1.5 },
        { id: 'sharqiyah', name: 'Ash Sharqiyah', cities: ['Sur', 'Ibra', 'Mudhaibi', 'Jalan'], baseRate: 2.0 },
        { id: 'dhahirah', name: 'Ad Dhahirah', cities: ['Ibri'], baseRate: 2.0 },
        { id: 'buraimi', name: 'Al Buraimi', cities: ['Al Buraimi'], baseRate: 2.0 },
        { id: 'gcc', name: 'GCC Countries', countries: ['AE', 'SA', 'QA', 'BH', 'KW'], baseRate: 5.0 },
        { id: 'international', name: 'International', countries: ['*'], baseRate: 10.0 },
      ],
    };
  }

  /**
   * Create shipping zone (admin only)
   */
  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create shipping zone',
    description: 'Create a new shipping zone. Admin access required.',
  })
  @ApiResponse({ status: 201, description: 'Zone created' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async createZone(@Body() body: { name: string; cities?: string[]; countries?: string[]; baseRate: number }) {
    this.logger.log(`Zone creation request: ${body.name}`);
    // In production: save to database
    return {
      id: `zone-${Date.now()}`,
      ...body,
      created: true,
    };
  }

  /**
   * Create shipping rate (admin only)
   */
  @Post('rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create shipping rate',
    description: 'Create a shipping rate for a zone. Admin access required.',
  })
  @ApiResponse({ status: 201, description: 'Rate created' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async createRate(
    @Body() body: {
      zoneId: string;
      carrier: string;
      service: string;
      weightFrom: number;
      weightTo: number;
      rate: number;
      currency?: string;
    },
  ) {
    this.logger.log(`Rate creation request for zone ${body.zoneId}`);
    // In production: save to database
    return {
      id: `rate-${Date.now()}`,
      ...body,
      currency: body.currency || 'OMR',
      created: true,
    };
  }

  /**
   * Get available shipping methods for a store
   */
  @Get('methods/:storeId')
  @ApiOperation({
    summary: 'Get store shipping methods',
    description: 'Get available shipping methods for a specific store and destination.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({ name: 'country', required: true, example: 'OM' })
  @ApiQuery({ name: 'city', required: false })
  @ApiResponse({ status: 200, description: 'Available shipping methods' })
  async getStoreMethods(
    @Param('storeId') storeId: string,
    @Query('country') country: string,
    @Query('city') city?: string,
  ) {
    return this.shippingCalculator.getAvailableMethods(storeId, {
      country: country || 'OM',
      city: city || '',
    });
  }

  /**
   * Calculate shipping cost for an order
   */
  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate shipping',
    description: 'Calculate shipping cost for an order with items.',
  })
  @ApiResponse({ status: 200, description: 'Shipping calculation result' })
  async calculateShipping(
    @Body() body: {
      items: Array<{ weight: number; quantity: number; dimensions?: { length: number; width: number; height: number } }>;
      destination: ShippingAddress;
      preferredCarrier?: string;
    },
  ) {
    return this.shippingCalculator.calculateShipping(
      body.items,
      body.destination,
      body.preferredCarrier,
    );
  }

  /**
   * Estimate delivery date
   */
  @Post('estimate-delivery')
  @ApiOperation({
    summary: 'Estimate delivery',
    description: 'Get estimated delivery date for a carrier and route.',
  })
  @ApiResponse({ status: 200, description: 'Delivery estimate' })
  async estimateDelivery(
    @Body() body: {
      carrier: string;
      originCountry: string;
      originCity: string;
      destinationCountry: string;
      destinationCity: string;
    },
  ) {
    return this.shippingCalculator.estimateDelivery(
      body.carrier,
      { country: body.originCountry, city: body.originCity },
      { country: body.destinationCountry, city: body.destinationCity },
    );
  }

  /**
   * Subscribe to tracking updates
   */
  @Post('track/subscribe')
  @ApiOperation({
    summary: 'Subscribe to tracking',
    description: 'Subscribe to real-time tracking updates for a shipment.',
  })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async subscribeTracking(
    @Body() body: {
      trackingNumber: string;
      carrier: string;
      email?: string;
      webhookUrl?: string;
    },
  ) {
    return this.trackingService.subscribeToUpdates(
      body.trackingNumber,
      body.carrier,
      undefined,
      { email: body.email, webhookUrl: body.webhookUrl },
    );
  }

  /**
   * Get tracking history
   */
  @Get('track/:number/history')
  @ApiOperation({
    summary: 'Get tracking history',
    description: 'Get full tracking event history for a shipment.',
  })
  @ApiParam({ name: 'number', description: 'Tracking number' })
  @ApiResponse({ status: 200, description: 'Tracking history' })
  async getTrackingHistory(@Param('number') trackingNumber: string) {
    return this.trackingService.getTrackingHistory(trackingNumber);
  }
}
