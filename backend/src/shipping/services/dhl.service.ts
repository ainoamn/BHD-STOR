import { Injectable, Logger, InternalServerErrorException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ShippingAddress } from '../dto/create-shipment.dto';
import { LocationDto, ShippingRate } from '../dto/rate-request.dto';
import { TrackingResult, TrackingEvent } from '../dto/tracking-request.dto';
import { shippingMockAllowed } from './shipping-provider.util';

export interface DHLShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  labelData?: string;
  estimatedDelivery?: string;
  totalAmount?: number;
  currency?: string;
  documents?: any[];
  error?: string;
}

export interface DHLRateRequest {
  shipperDetails: {
    postalCode: string;
    cityName: string;
    countryCode: string;
  };
  receiverDetails: {
    postalCode: string;
    cityName: string;
    countryCode: string;
  };
  packages: Array<{
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  }>;
}

@Injectable()
export class DHLService {
  private readonly logger = new Logger(DHLService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly accountNumber: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DHL_API_KEY') || '';
    this.accountNumber = this.configService.get<string>('DHL_ACCOUNT_NUMBER') || '';
    this.isSandbox = this.configService.get<string>('DHL_ENVIRONMENT') !== 'production';

    if (!this.isConfigured()) {
      this.logger.warn(
        'DHL credentials not fully configured — mock rates only (set DHL_API_KEY + DHL_ACCOUNT_NUMBER)',
      );
    }

    this.apiUrl = this.isSandbox
      ? 'https://express.api.dhl.com/mydhlapi/test'
      : 'https://express.api.dhl.com/mydhlapi';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add auth interceptor
    this.httpClient.interceptors.request.use((config) => {
      config.headers.Authorization = `Basic ${Buffer.from(`${this.accountNumber}:${this.apiKey}`).toString('base64')}`;
      return config;
    });

    // Retry interceptor
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config._retryCount) config._retryCount = 0;
        if (config._retryCount < 2 && (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
          config._retryCount++;
          await new Promise((r) => setTimeout(r, 1000 * config._retryCount));
          return this.httpClient(config);
        }
        return Promise.reject(error);
      },
    );
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.accountNumber);
  }

  getProviderStatus(): {
    code: string;
    configured: boolean;
    sandbox: boolean;
    mockAllowed: boolean;
  } {
    return {
      code: 'dhl',
      configured: this.isConfigured(),
      sandbox: this.isSandbox,
      mockAllowed: shippingMockAllowed(this.configService),
    };
  }

  private assertCanCreateLiveShipment(): void {
    if (this.isConfigured()) {
      return;
    }
    if (!shippingMockAllowed(this.configService)) {
      throw new ServiceUnavailableException(
        'DHL is not configured. Set DHL_API_KEY and DHL_ACCOUNT_NUMBER (or SHIPPING_ALLOW_MOCK=true for non-production).',
      );
    }
  }

  /**
   * Get DHL shipping rates
   */
  async getRates(
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: { length: number; width: number; height: number; unit: string },
  ): Promise<ShippingRate[]> {
    try {
      const payload = {
        customerDetails: {
          shipperDetails: {
            postalCode: origin.postalCode || '100',
            cityName: origin.city,
            countryCode: origin.country,
          },
          receiverDetails: {
            postalCode: destination.postalCode || '100',
            cityName: destination.city,
            countryCode: destination.country,
          },
        },
        accounts: [
          {
            typeCode: 'shipper',
            number: this.accountNumber,
          },
        ],
        productsAndServices: [
          {
            productCode: 'P',
          },
        ],
        packages: [
          {
            weight: weight,
            dimensions: dimensions
              ? {
                  length: dimensions.length,
                  width: dimensions.width,
                  height: dimensions.height,
                }
              : { length: 10, width: 10, height: 10 },
          },
        ],
        payerCountryCode: origin.country,
        unitOfMeasurement: 'metric',
      };

      if (!this.isConfigured()) {
        if (!shippingMockAllowed(this.configService)) {
          this.logger.warn('DHL not configured and mock rates disabled');
          return [];
        }
        return this.getMockRates(origin, destination, weight);
      }

      const response = await this.httpClient.post('/rates', payload);

      if (response.data?.products) {
        return response.data.products.map((product: any) => ({
          carrier: 'dhl',
          carrierName: 'DHL Express',
          service: product.productCode,
          serviceName: product.productName,
          totalAmount: parseFloat(product.totalPrice?.[0]?.price) || 0,
          currency: product.totalPrice?.[0]?.priceCurrency || 'OMR',
          estimatedDelivery: product.deliveryCapabilities?.estimatedDeliveryDateAndTime,
          estimatedDays: product.deliveryCapabilities?.estimatedDeliveryDateAndTime
            ? this.calculateDaysUntil(product.deliveryCapabilities.estimatedDeliveryDateAndTime)
            : 3,
          transitTime: product.deliveryCapabilities?.deliveryType || '3-5 days',
          baseAmount: parseFloat(product.priceBreakdown?.find((p: any) => p.typeCode === 'SPR')?.price) || 0,
          fuelSurcharge: parseFloat(product.priceBreakdown?.find((p: any) => p.typeCode === 'FUE')?.price) || 0,
          vatAmount: parseFloat(product.priceBreakdown?.find((p: any) => p.typeCode === 'TAX')?.price) || 0,
          trackingAvailable: true,
          signatureAvailable: true,
          codAvailable: false,
        }));
      }

      if (shippingMockAllowed(this.configService)) {
        return this.getMockRates(origin, destination, weight);
      }
      return [];
    } catch (error) {
      this.logger.error(`DHL rate request failed: ${error.message}`);
      if (shippingMockAllowed(this.configService)) {
        return this.getMockRates(origin, destination, weight);
      }
      throw new ServiceUnavailableException(`DHL rates unavailable: ${error.message}`);
    }
  }

  /**
   * Create a DHL shipment
   */
  async createShipment(data: {
    orderId: string;
    sender: ShippingAddress;
    recipient: ShippingAddress;
    weight: number;
    dimensions?: any;
    description?: string;
    insuranceAmount?: number;
    numberOfPieces?: number;
    service?: string;
  }): Promise<DHLShipmentResult> {
    try {
      const payload = {
        plannedShippingDateAndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pickup: {
          isRequested: false,
        },
        productCode: data.service || 'P',
        accounts: [
          {
            typeCode: 'shipper',
            number: this.accountNumber,
          },
        ],
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: data.sender.postalCode || '',
              cityName: data.sender.city,
              countryCode: data.sender.country,
              addressLine1: data.sender.street1,
              addressLine2: data.sender.street2 || '',
              provinceCode: data.sender.state || '',
            },
            contactInformation: {
              email: data.sender.email || '',
              phone: data.sender.phone,
              companyName: data.sender.company || data.sender.name,
              fullName: data.sender.name,
            },
          },
          receiverDetails: {
            postalAddress: {
              postalCode: data.recipient.postalCode || '',
              cityName: data.recipient.city,
              countryCode: data.recipient.country,
              addressLine1: data.recipient.street1,
              addressLine2: data.recipient.street2 || '',
              provinceCode: data.recipient.state || '',
            },
            contactInformation: {
              email: data.recipient.email || '',
              phone: data.recipient.phone,
              companyName: data.recipient.company || data.recipient.name,
              fullName: data.recipient.name,
            },
          },
        },
        content: {
          packages: [
            {
              weight: data.weight,
              dimensions: data.dimensions
                ? {
                    length: data.dimensions.length,
                    width: data.dimensions.width,
                    height: data.dimensions.height,
                  }
                : { length: 10, width: 10, height: 10 },
            },
          ],
          isCustomsDeclarable: data.sender.country !== data.recipient.country,
          description: data.description || `Order ${data.orderId}`,
          incoterm: 'DAP',
          unitOfMeasurement: 'metric',
        },
        shipmentNotification: [
          {
            typeCode: 'email',
            receiverId: data.recipient.email || '',
            languageCode: 'eng',
          },
        ],
        getTransliteratedResponse: false,
        estimatedDeliveryDate: {
          isRequested: true,
          typeCode: 'QDDC',
        },
      };

      if (!this.isConfigured()) {
        this.assertCanCreateLiveShipment();
        const trackingNumber = `1Z999AA1${Date.now().toString().slice(-10)}`;
        this.logger.warn(`DHL mock shipment created for order ${data.orderId}: ${trackingNumber}`);
        return {
          success: true,
          shipmentId: `shp-dhl-${Date.now()}`,
          trackingNumber,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: data.weight * 5.0,
          currency: 'OMR',
        };
      }

      const response = await this.httpClient.post('/shipments', payload);

      if (response.data?.shipmentTrackingNumber) {
        const shipment = response.data;

        this.logger.log(`DHL shipment created: ${shipment.shipmentTrackingNumber} for order ${data.orderId}`);

        // Extract label if available
        let labelData = '';
        let labelUrl = '';
        if (shipment.documents) {
          const labelDoc = shipment.documents.find((d: any) => d.typeCode === 'label');
          if (labelDoc) {
            labelData = labelDoc.content;
            labelUrl = labelDoc.url || '';
          }
        }

        return {
          success: true,
          shipmentId: shipment.shipmentTrackingNumber,
          trackingNumber: shipment.shipmentTrackingNumber,
          labelUrl,
          labelData,
          estimatedDelivery: shipment.estimatedDeliveryDate?.estimatedDeliveryDate,
          totalAmount: 0, // DHL doesn't return cost in shipment creation
          currency: 'OMR',
          documents: shipment.documents,
        };
      }

      return {
        success: false,
        error: response.data?.detail || 'Shipment creation failed',
      };
    } catch (error) {
      this.logger.error(`DHL shipment creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  /**
   * Track shipment via DHL API
   */
  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    try {
      if (!this.isConfigured()) {
        return this.getMockTracking(trackingNumber);
      }

      const response = await this.httpClient.get('/shipments', {
        params: {
          trackingNumber,
          trackingView: 'all-checkpoints',
          levelOfDetail: 'all',
        },
      });

      if (response.data?.shipments?.[0]) {
        const shipment = response.data.shipments[0];
        const status = shipment.status || {};

        return {
          trackingNumber: shipment.id || trackingNumber,
          carrier: 'dhl',
          carrierName: 'DHL Express',
          status: this.mapDHLStatus(status.statusCode),
          estimatedDelivery: shipment.estimatedTimeOfDelivery,
          shippedDate: shipment.details?.product?.productName,
          deliveredDate: status.statusCode === 'delivered' ? status.timestamp : undefined,
          service: shipment.product?.productName || '',
          origin: {
            city: shipment.origin?.address?.addressLocality || '',
            country: shipment.origin?.address?.countryCode || '',
          },
          destination: {
            city: shipment.destination?.address?.addressLocality || '',
            country: shipment.destination?.address?.countryCode || '',
          },
          events: (status.events || []).map((event: any) => ({
            timestamp: event.timestamp,
            status: event.statusCode || '',
            statusCode: event.statusCode || '',
            description: event.description || '',
            location: event.location?.address?.addressLocality || '',
            city: event.location?.address?.addressLocality || '',
            country: event.location?.address?.countryCode || '',
          })),
          currentLocation: status.location?.address?.addressLocality || '',
          lastUpdated: status.timestamp,
          isDelivered: status.statusCode === 'delivered',
        };
      }

      return this.getMockTracking(trackingNumber);
    } catch (error) {
      this.logger.error(`DHL tracking failed for ${trackingNumber}: ${error.message}`);
      return this.getMockTracking(trackingNumber);
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentId: string, format: 'pdf' | 'zpl' | 'png' = 'pdf'): Promise<{ labelData: string; contentType: string }> {
    try {
      if (!this.isConfigured()) {
        return { labelData: '', contentType: 'application/pdf' };
      }

      const response = await this.httpClient.get(`/shipments/${shipmentId}/documents`, {
        params: { typeCode: 'label', format },
        responseType: 'arraybuffer',
      });

      const labelData = Buffer.from(response.data).toString('base64');
      const contentType = format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'application/x-zpl';

      this.logger.log(`DHL label generated for shipment ${shipmentId}`);

      return { labelData, contentType };
    } catch (error) {
      this.logger.error(`DHL label generation failed for ${shipmentId}: ${error.message}`);
      throw new BadRequestException(`Failed to generate label: ${error.message}`);
    }
  }

  /**
   * Validate a DHL shipment address
   */
  async validateAddress(address: ShippingAddress): Promise<{ valid: boolean; suggestions?: any[]; message?: string }> {
    try {
      if (!this.isConfigured()) {
        return { valid: true };
      }

      const response = await this.httpClient.get('/address-validate', {
        params: {
          type: 'residential',
          countryCode: address.country,
          postalCode: address.postalCode,
          cityName: address.city,
          addressLine1: address.street1,
        },
      });

      return {
        valid: response.data?.valid || true,
        suggestions: response.data?.suggestions,
      };
    } catch (error) {
      this.logger.error(`DHL address validation failed: ${error.message}`);
      return { valid: true }; // Fail open
    }
  }

  // ---- Helper methods ----

  private calculateDaysUntil(dateString: string): number {
    const target = new Date(dateString);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  private mapDHLStatus(statusCode?: string): string {
    const statusMap: Record<string, string> = {
      'pre-transit': 'pre_transit',
      transit: 'in_transit',
      delivered: 'delivered',
      'failure': 'failed',
      'return-to-shipper': 'returned',
    };
    return statusMap[statusCode || ''] || 'unknown';
  }

  // ---- Mock data ----

  private getMockRates(origin: LocationDto, destination: LocationDto, weight: number): ShippingRate[] {
    const isDomestic = origin.country === destination.country;
    const baseRate = isDomestic ? 3.0 : 8.0;
    const weightFactor = weight * (isDomestic ? 1.0 : 4.0);

    return [
      {
        carrier: 'dhl',
        carrierName: 'DHL Express',
        service: 'P',
        serviceName: 'DHL Express Worldwide',
        totalAmount: Math.round((baseRate + weightFactor) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 3,
        transitTime: `${isDomestic ? 1 : 3} days`,
        baseAmount: baseRate,
        fuelSurcharge: Math.round(baseRate * 0.2 * 1000) / 1000,
        vatAmount: Math.round((baseRate + weightFactor) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: false,
      },
      {
        carrier: 'dhl',
        carrierName: 'DHL Express',
        service: 'U',
        serviceName: 'DHL Express 9:00',
        totalAmount: Math.round((baseRate * 1.5 + weightFactor * 1.2) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 2,
        transitTime: `${isDomestic ? 1 : 2} days`,
        baseAmount: baseRate * 1.5,
        fuelSurcharge: Math.round(baseRate * 1.5 * 0.2 * 1000) / 1000,
        vatAmount: Math.round((baseRate * 1.5 + weightFactor * 1.2) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: false,
      },
    ];
  }

  private getMockTracking(trackingNumber: string): TrackingResult {
    const now = new Date();
    return {
      trackingNumber,
      carrier: 'dhl',
      carrierName: 'DHL Express',
      status: 'in_transit',
      estimatedDelivery: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      service: 'Express Worldwide',
      origin: { city: 'Muscat', country: 'OM' },
      destination: { city: 'London', country: 'GB' },
      events: [
        {
          timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'Shipment information received',
          statusCode: 'SI',
          description: 'Shipment data received',
          location: 'Muscat',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'Processed at Muscat Hub',
          statusCode: 'PO',
          description: 'Shipment processed at origin facility',
          location: 'Muscat Hub',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'Departed from Muscat',
          statusCode: 'DF',
          description: 'Shipment departed from origin',
          location: 'Muscat International Airport',
          city: 'Muscat',
          country: 'OM',
        },
      ],
      currentLocation: 'In transit',
      lastUpdated: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      isDelivered: false,
    };
  }
}
