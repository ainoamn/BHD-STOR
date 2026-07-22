import { Injectable, Logger, InternalServerErrorException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ShippingAddress } from '../dto/create-shipment.dto';
import { LocationDto, ShippingRate } from '../dto/rate-request.dto';
import { TrackingResult, TrackingEvent } from '../dto/tracking-request.dto';
import { shippingMockAllowed } from './shipping-provider.util';

export interface FedExShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  masterTrackingNumber?: string;
  labelUrl?: string;
  labelData?: string;
  estimatedDelivery?: string;
  totalAmount?: number;
  currency?: string;
  error?: string;
}

@Injectable()
export class FedExService {
  private readonly logger = new Logger(FedExService.name);
  private readonly httpClient: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accountNumber: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('FEDEX_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('FEDEX_CLIENT_SECRET') || '';
    this.accountNumber = this.configService.get<string>('FEDEX_ACCOUNT_NUMBER') || '';
    this.isSandbox = this.configService.get<string>('FEDEX_ENVIRONMENT') !== 'production';

    if (!this.isConfigured()) {
      this.logger.warn(
        'FedEx credentials not fully configured — mock rates only (set FEDEX_CLIENT_ID + FEDEX_CLIENT_SECRET)',
      );
    }

    this.apiUrl = this.isSandbox
      ? 'https://apis-sandbox.fedex.com'
      : 'https://apis.fedex.com';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.httpClient.interceptors.request.use(async (config) => {
      if (!config.url?.includes('/oauth/token')) {
        const token = await this.getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
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
        // Handle 401 by refreshing token
        if (error.response?.status === 401 && !config._refreshRetry) {
          config._refreshRetry = true;
          this.accessToken = null;
          this.tokenExpiry = null;
          const newToken = await this.getAccessToken();
          config.headers.Authorization = `Bearer ${newToken}`;
          return this.httpClient(config);
        }
        return Promise.reject(error);
      },
    );
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  getProviderStatus(): {
    code: string;
    configured: boolean;
    sandbox: boolean;
    mockAllowed: boolean;
  } {
    return {
      code: 'fedex',
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
        'FedEx is not configured. Set FEDEX_CLIENT_ID and FEDEX_CLIENT_SECRET (or SHIPPING_ALLOW_MOCK=true for non-production).',
      );
    }
  }

  /**
   * Get FedEx OAuth2 access token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        },
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000);

      this.logger.debug('FedEx access token obtained');
      return this.accessToken!;
    } catch (error) {
      this.logger.error(`Failed to get FedEx access token: ${error.message}`);
      throw new InternalServerErrorException('Failed to authenticate with FedEx');
    }
  }

  /**
   * Get FedEx shipping rates
   */
  async getRates(
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: { length: number; width: number; height: number; unit: string },
  ): Promise<ShippingRate[]> {
    try {
      const payload = {
        accountNumber: {
          value: this.accountNumber,
        },
        requestedShipment: {
          shipper: {
            address: {
              postalCode: origin.postalCode || '',
              countryCode: origin.country,
              city: origin.city,
            },
          },
          recipient: {
            address: {
              postalCode: destination.postalCode || '',
              countryCode: destination.country,
              city: destination.city,
            },
          },
          shipDateStamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
          serviceType: 'INTERNATIONAL_PRIORITY',
          packagingType: 'YOUR_PACKAGING',
          totalWeight: weight,
          rateRequestType: ['ACCOUNT', 'LIST'],
          preferredCurrency: 'OMR',
          requestedPackageLineItems: [
            {
              weight: {
                units: 'KG',
                value: weight,
              },
              dimensions: dimensions
                ? {
                    length: dimensions.length,
                    width: dimensions.width,
                    height: dimensions.height,
                    units: dimensions.unit?.toUpperCase() === 'IN' ? 'IN' : 'CM',
                  }
                : undefined,
            },
          ],
        },
      };

      if (!this.isConfigured()) {
        if (!shippingMockAllowed(this.configService)) {
          this.logger.warn('FedEx not configured and mock rates disabled');
          return [];
        }
        return this.getMockRates(origin, destination, weight);
      }

      const response = await this.httpClient.post('/rate/v1/rates/quotes', payload);

      if (response.data?.output?.rateReplyDetails) {
        return response.data.output.rateReplyDetails.map((rate: any) => {
          const ratedShipment = rate.ratedShipmentDetails?.[0];
          return {
            carrier: 'fedex',
            carrierName: 'FedEx',
            service: rate.serviceType,
            serviceName: rate.serviceName,
            totalAmount: ratedShipment?.totalNetCharge?.amount || 0,
            currency: ratedShipment?.totalNetCharge?.currency || 'OMR',
            estimatedDelivery: rate.operationalDetail?.deliveryDate,
            estimatedDays: rate.operationalDetail?.deliveryDate
              ? this.calculateDaysUntil(rate.operationalDetail.deliveryDate)
              : 3,
            transitTime: rate.operationalDetail?.transitTime || '3-5 days',
            baseAmount: ratedShipment?.shipmentRateDetail?.totalBaseCharge?.amount || 0,
            fuelSurcharge: ratedShipment?.shipmentRateDetail?.totalSurcharges?.amount || 0,
            vatAmount: ratedShipment?.shipmentRateDetail?.totalTaxes?.amount || 0,
            trackingAvailable: true,
            signatureAvailable: true,
            codAvailable: false,
          };
        });
      }

      if (shippingMockAllowed(this.configService)) {
        return this.getMockRates(origin, destination, weight);
      }
      return [];
    } catch (error) {
      this.logger.error(`FedEx rate request failed: ${error.message}`);
      if (shippingMockAllowed(this.configService)) {
        return this.getMockRates(origin, destination, weight);
      }
      throw new ServiceUnavailableException(`FedEx rates unavailable: ${error.message}`);
    }
  }

  /**
   * Create a FedEx shipment
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
  }): Promise<FedExShipmentResult> {
    try {
      const payload = {
        labelResponseOptions: 'URL',
        accountNumber: {
          value: this.accountNumber,
        },
        requestedShipment: {
          shipper: {
            contact: {
              personName: data.sender.name,
              phoneNumber: data.sender.phone,
              emailAddress: data.sender.email || '',
              companyName: data.sender.company || data.sender.name,
            },
            address: {
              streetLines: [data.sender.street1, data.sender.street2].filter(Boolean),
              city: data.sender.city,
              stateOrProvinceCode: data.sender.state || '',
              postalCode: data.sender.postalCode || '',
              countryCode: data.sender.country,
            },
          },
          recipient: {
            contact: {
              personName: data.recipient.name,
              phoneNumber: data.recipient.phone,
              emailAddress: data.recipient.email || '',
              companyName: data.recipient.company || data.recipient.name,
            },
            address: {
              streetLines: [data.recipient.street1, data.recipient.street2].filter(Boolean),
              city: data.recipient.city,
              stateOrProvinceCode: data.recipient.state || '',
              postalCode: data.recipient.postalCode || '',
              countryCode: data.recipient.country,
            },
          },
          shipDatestamp: new Date().toISOString().split('T')[0],
          serviceType: data.service || 'INTERNATIONAL_PRIORITY',
          packagingType: 'YOUR_PACKAGING',
          pickupType: 'USE_SCHEDULED_PICKUP',
          shippingChargesPayment: {
            paymentType: 'SENDER',
          },
          requestedPackageLineItems: [
            {
              weight: {
                units: 'KG',
                value: data.weight,
              },
              dimensions: data.dimensions
                ? {
                    length: data.dimensions.length,
                    width: data.dimensions.width,
                    height: data.dimensions.height,
                    units: data.dimensions.unit?.toUpperCase() === 'IN' ? 'IN' : 'CM',
                  }
                : undefined,
            },
          ],
          customsClearanceDetail: data.sender.country !== data.recipient.country
            ? {
                dutiesPayment: {
                  paymentType: 'SENDER',
                },
                commodities: [
                  {
                    description: data.description || `Order ${data.orderId}`,
                    quantity: data.numberOfPieces || 1,
                    quantityUnits: 'PCS',
                    weight: {
                      units: 'KG',
                      value: data.weight,
                    },
                    customsValue: {
                      currency: 'OMR',
                      amount: data.insuranceAmount || 10,
                    },
                  },
                ],
              }
            : undefined,
        },
      };

      if (!this.isConfigured()) {
        this.assertCanCreateLiveShipment();
        const trackingNumber = `7946${Date.now().toString().slice(-12)}`;
        this.logger.warn(`FedEx mock shipment created for order ${data.orderId}: ${trackingNumber}`);
        return {
          success: true,
          shipmentId: `shp-fedex-${Date.now()}`,
          trackingNumber,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: data.weight * 4.5,
          currency: 'OMR',
        };
      }

      const response = await this.httpClient.post('/ship/v1/shipments', payload);

      if (response.data?.output?.transactionShipments?.[0]) {
        const shipment = response.data.output.transactionShipments[0];

        this.logger.log(`FedEx shipment created: ${shipment.masterTrackingNumber} for order ${data.orderId}`);

        return {
          success: true,
          shipmentId: shipment.masterTrackingNumber,
          trackingNumber: shipment.masterTrackingNumber,
          masterTrackingNumber: shipment.masterTrackingNumber,
          labelUrl: shipment.pieceResponses?.[0]?.packageDocuments?.[0]?.url,
          labelData: shipment.pieceResponses?.[0]?.packageDocuments?.[0]?.encodedLabel,
          estimatedDelivery: shipment.completedShipmentDetail?.operationalDetail?.deliveryDate,
          totalAmount: 0,
          currency: 'OMR',
        };
      }

      return {
        success: false,
        error: response.data?.errors?.[0]?.message || 'Shipment creation failed',
      };
    } catch (error) {
      this.logger.error(`FedEx shipment creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Track shipment via FedEx API
   */
  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    try {
      if (!this.isConfigured()) {
        return this.getMockTracking(trackingNumber);
      }

      const payload = {
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber,
            },
          },
        ],
      };

      const response = await this.httpClient.post('/track/v1/trackingnumbers', payload);

      if (response.data?.output?.completeTrackResults?.[0]?.trackResults?.[0]) {
        const result = response.data.output.completeTrackResults[0].trackResults[0];

        return {
          trackingNumber: result.trackingNumber || trackingNumber,
          carrier: 'fedex',
          carrierName: 'FedEx',
          status: this.mapFedExStatus(result.latestStatusDetail?.code),
          estimatedDelivery: result.dateAndTimes?.find((d: any) => d.type === 'ESTIMATED_DELIVERY')?.dateTime,
          shippedDate: result.dateAndTimes?.find((d: any) => d.type === 'SHIP')?.dateTime,
          deliveredDate: result.dateAndTimes?.find((d: any) => d.type === 'ACTUAL_DELIVERY')?.dateTime,
          service: result.serviceDetail?.description || '',
          origin: {
            city: result.originLocation?.locationContactAndAddress?.address?.city || '',
            country: result.originLocation?.locationContactAndAddress?.address?.countryCode || '',
          },
          destination: {
            city: result.destinationLocation?.locationContactAndAddress?.address?.city || '',
            country: result.destinationLocation?.locationContactAndAddress?.address?.countryCode || '',
          },
          events: (result.scanEvents || []).map((event: any) => ({
            timestamp: event.date,
            status: event.eventDescription || '',
            statusCode: event.eventType || '',
            description: event.eventDescription || '',
            location: event.scanLocation?.streetLines?.join(', ') || '',
            city: event.scanLocation?.city || '',
            country: event.scanLocation?.countryCode || '',
          })),
          currentLocation: result.latestStatusDetail?.scanLocation?.city || '',
          lastUpdated: result.scanEvents?.[0]?.date || '',
          isDelivered: result.latestStatusDetail?.code === 'DL',
        };
      }

      return this.getMockTracking(trackingNumber);
    } catch (error) {
      this.logger.error(`FedEx tracking failed for ${trackingNumber}: ${error.message}`);
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

      // FedEx labels are generated at shipment creation time
      // For re-printing, we would need to use the FedEx API or our stored copy
      const response = await this.httpClient.post('/ship/v1/shipments/packages/returnLabel', {
        accountNumber: { value: this.accountNumber },
        trackingNumber: shipmentId,
        labelResponseOptions: 'URL',
        label: {
          labelStockType: format === 'zpl' ? 'STOCK_4X6' : 'PAPER_8.5X11_TOP_HALF_LABEL',
          imageType: format.toUpperCase(),
        },
      });

      const labelData = response.data?.output?.labelData || '';
      const contentType = format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'application/x-zpl';

      this.logger.log(`FedEx label generated for shipment ${shipmentId}`);

      return { labelData, contentType };
    } catch (error) {
      this.logger.error(`FedEx label generation failed for ${shipmentId}: ${error.message}`);
      throw new BadRequestException(`Failed to generate label: ${error.message}`);
    }
  }

  // ---- Helper methods ----

  private calculateDaysUntil(dateString: string): number {
    const target = new Date(dateString);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  private mapFedExStatus(code?: string): string {
    const statusMap: Record<string, string> = {
      AP: 'picked_up',
      OC: 'in_transit',
      AR: 'in_transit',
      DP: 'out_for_delivery',
      DL: 'delivered',
      CA: 'cancelled',
      RS: 'returned',
      SE: 'exception',
    };
    return statusMap[code || ''] || 'unknown';
  }

  // ---- Mock data ----

  private getMockRates(origin: LocationDto, destination: LocationDto, weight: number): ShippingRate[] {
    const isDomestic = origin.country === destination.country;
    const baseRate = isDomestic ? 3.5 : 9.0;
    const weightFactor = weight * (isDomestic ? 1.2 : 4.5);

    return [
      {
        carrier: 'fedex',
        carrierName: 'FedEx',
        service: 'INTERNATIONAL_PRIORITY',
        serviceName: 'FedEx International Priority',
        totalAmount: Math.round((baseRate + weightFactor) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 3,
        transitTime: `${isDomestic ? 1 : 3} business days`,
        baseAmount: baseRate,
        fuelSurcharge: Math.round(baseRate * 0.18 * 1000) / 1000,
        vatAmount: Math.round((baseRate + weightFactor) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: false,
      },
      {
        carrier: 'fedex',
        carrierName: 'FedEx',
        service: 'INTERNATIONAL_ECONOMY',
        serviceName: 'FedEx International Economy',
        totalAmount: Math.round((baseRate * 0.7 + weightFactor * 0.8) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 2 : 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 2 : 5,
        transitTime: `${isDomestic ? 2 : 5} business days`,
        baseAmount: baseRate * 0.7,
        fuelSurcharge: Math.round(baseRate * 0.7 * 0.18 * 1000) / 1000,
        vatAmount: Math.round((baseRate * 0.7 + weightFactor * 0.8) * 0.05 * 1000) / 1000,
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
      carrier: 'fedex',
      carrierName: 'FedEx',
      status: 'in_transit',
      estimatedDelivery: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      service: 'International Priority',
      origin: { city: 'Muscat', country: 'OM' },
      destination: { city: 'New York', country: 'US' },
      events: [
        {
          timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'Picked Up',
          statusCode: 'PU',
          description: 'Shipment picked up',
          location: 'Muscat',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 44 * 60 * 60 * 1000).toISOString(),
          status: 'At Origin Facility',
          statusCode: 'OC',
          description: 'At origin sort facility',
          location: 'Muscat Hub',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'Departed Origin',
          statusCode: 'DEP',
          description: 'Departed origin facility',
          location: 'Muscat International Airport',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'In Transit',
          statusCode: 'IT',
          description: 'In transit to destination',
          location: 'Dubai Hub',
          city: 'Dubai',
          country: 'AE',
        },
      ],
      currentLocation: 'Dubai Hub',
      lastUpdated: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      isDelivered: false,
    };
  }
}
