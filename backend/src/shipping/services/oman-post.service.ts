import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ShippingAddress } from '../dto/create-shipment.dto';
import { LocationDto, ShippingRate } from '../dto/rate-request.dto';
import { TrackingResult, TrackingEvent } from '../dto/tracking-request.dto';

export interface OmanPostShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  labelData?: string; // base64 encoded
  estimatedDelivery?: string;
  totalAmount?: number;
  currency?: string;
  error?: string;
}

export interface OmanPostRate {
  service: string;
  serviceName: string;
  amount: number;
  currency: string;
  estimatedDays: number;
  trackingIncluded: boolean;
}

@Injectable()
export class OmanPostService {
  private readonly logger = new Logger(OmanPostService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly accountNumber: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OMAN_POST_API_KEY') || '';
    this.accountNumber = this.configService.get<string>('OMAN_POST_ACCOUNT_NUMBER') || '';
    this.isSandbox = this.configService.get<string>('OMAN_POST_ENVIRONMENT') !== 'production';

    if (!this.apiKey || !this.accountNumber) {
      this.logger.warn('Oman Post credentials not fully configured - service will use mock data');
    }

    this.apiUrl = this.isSandbox
      ? 'https://api.sandbox.omapost.om/v1'
      : 'https://api.omapost.om/v1';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Key': this.apiKey,
        'X-Account-Number': this.accountNumber,
      },
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

  /**
   * Get shipping rates from Oman Post
   */
  async getRates(
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: { length: number; width: number; height: number; unit: string },
  ): Promise<ShippingRate[]> {
    try {
      const payload = {
        origin: {
          country: origin.country,
          city: origin.city,
          postal_code: origin.postalCode,
        },
        destination: {
          country: destination.country,
          city: destination.city,
          postal_code: destination.postalCode,
        },
        weight,
        weight_unit: 'kg',
        dimensions: dimensions
          ? {
              length: dimensions.length,
              width: dimensions.width,
              height: dimensions.height,
              unit: dimensions.unit,
            }
          : undefined,
      };

      // If API not configured, return mock rates for Oman Post
      if (!this.apiKey) {
        return this.getMockRates(origin, destination, weight);
      }

      const response = await this.httpClient.post('/rates', payload);

      if (response.data?.rates) {
        return response.data.rates.map((rate: any) => ({
          carrier: 'oman_post',
          carrierName: 'Oman Post',
          service: rate.service_code,
          serviceName: rate.service_name,
          totalAmount: parseFloat(rate.total_amount),
          currency: rate.currency || 'OMR',
          estimatedDelivery: rate.estimated_delivery_date,
          estimatedDays: rate.estimated_days,
          transitTime: `${rate.estimated_days} days`,
          baseAmount: parseFloat(rate.base_amount),
          fuelSurcharge: parseFloat(rate.fuel_surcharge) || 0,
          vatAmount: parseFloat(rate.vat) || 0,
          trackingAvailable: true,
          signatureAvailable: rate.service_code === 'express' || rate.service_code === 'premium',
          codAvailable: destination.country === 'OM',
        }));
      }

      return this.getMockRates(origin, destination, weight);
    } catch (error) {
      this.logger.error(`Oman Post rate request failed: ${error.message}`);
      return this.getMockRates(origin, destination, weight);
    }
  }

  /**
   * Create a shipment via Oman Post
   */
  async createShipment(
    orderId: string,
    sender: ShippingAddress,
    recipient: ShippingAddress,
    weight: number,
    dimensions?: any,
    options?: {
      shippingMethod?: string;
      insuranceAmount?: number;
      signatureRequired?: boolean;
      description?: string;
      codAmount?: number;
      references?: string[];
    },
  ): Promise<OmanPostShipmentResult> {
    try {
      const payload = {
        account_number: this.accountNumber,
        order_reference: orderId,
        service: options?.shippingMethod || 'standard',
        sender: {
          name: sender.name,
          company: sender.company || '',
          street1: sender.street1,
          street2: sender.street2 || '',
          city: sender.city,
          state: sender.state || '',
          postal_code: sender.postalCode || '',
          country: sender.country,
          phone: sender.phone,
          email: sender.email || '',
        },
        recipient: {
          name: recipient.name,
          company: recipient.company || '',
          street1: recipient.street1,
          street2: recipient.street2 || '',
          city: recipient.city,
          state: recipient.state || '',
          postal_code: recipient.postalCode || '',
          country: recipient.country,
          phone: recipient.phone,
          email: recipient.email || '',
        },
        package: {
          weight,
          weight_unit: 'kg',
          dimensions: dimensions
            ? {
                length: dimensions.length,
                width: dimensions.width,
                height: dimensions.height,
                unit: dimensions.unit || 'cm',
              }
            : undefined,
          description: options?.description || `Order ${orderId}`,
          value: options?.insuranceAmount || 0,
          currency: 'OMR',
        },
        options: {
          insurance: options?.insuranceAmount ? true : false,
          insurance_amount: options?.insuranceAmount || 0,
          signature_required: options?.signatureRequired || false,
          cod_amount: options?.codAmount || 0,
          references: options?.references || [],
        },
      };

      if (!this.apiKey) {
        // Return mock shipment data
        const trackingNumber = `OMP${Date.now()}${Math.floor(Math.random() * 1000)}`;
        return {
          success: true,
          shipmentId: `shp-omp-${Date.now()}`,
          trackingNumber,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: weight * 2.0,
          currency: 'OMR',
        };
      }

      const response = await this.httpClient.post('/shipments', payload);

      if (response.data?.shipment) {
        const shipment = response.data.shipment;
        this.logger.log(`Oman Post shipment created: ${shipment.tracking_number} for order ${orderId}`);

        return {
          success: true,
          shipmentId: shipment.id,
          trackingNumber: shipment.tracking_number,
          labelUrl: shipment.label_url,
          labelData: shipment.label_data,
          estimatedDelivery: shipment.estimated_delivery,
          totalAmount: parseFloat(shipment.total_amount),
          currency: shipment.currency || 'OMR',
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Shipment creation failed',
      };
    } catch (error) {
      this.logger.error(`Oman Post shipment creation failed for order ${orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get tracking information from Oman Post
   */
  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    try {
      if (!this.apiKey) {
        return this.getMockTracking(trackingNumber);
      }

      const response = await this.httpClient.get(`/tracking/${trackingNumber}`);

      if (response.data?.shipment) {
        const shipment = response.data.shipment;

        return {
          trackingNumber: shipment.tracking_number,
          carrier: 'oman_post',
          carrierName: 'Oman Post',
          status: shipment.status,
          estimatedDelivery: shipment.estimated_delivery,
          shippedDate: shipment.shipped_date,
          deliveredDate: shipment.delivered_date,
          signedBy: shipment.signed_by,
          weight: shipment.weight,
          weightUnit: shipment.weight_unit,
          service: shipment.service,
          origin: {
            city: shipment.origin?.city || '',
            country: shipment.origin?.country || '',
          },
          destination: {
            city: shipment.destination?.city || '',
            country: shipment.destination?.country || '',
          },
          events: (shipment.events || []).map((event: any) => ({
            timestamp: event.timestamp,
            status: event.status,
            statusCode: event.code,
            description: event.description,
            location: event.location,
            city: event.city,
            country: event.country,
          })),
          currentLocation: shipment.current_location,
          lastUpdated: shipment.last_updated,
          isDelivered: shipment.status === 'delivered',
        };
      }

      return this.getMockTracking(trackingNumber);
    } catch (error) {
      this.logger.error(`Oman Post tracking failed for ${trackingNumber}: ${error.message}`);
      return this.getMockTracking(trackingNumber);
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentId: string, format: 'pdf' | 'zpl' | 'png' = 'pdf'): Promise<{ labelData: string; contentType: string }> {
    try {
      if (!this.apiKey) {
        return { labelData: '', contentType: 'application/pdf' };
      }

      const response = await this.httpClient.get(`/shipments/${shipmentId}/label`, {
        params: { format },
        responseType: 'arraybuffer',
      });

      const labelData = Buffer.from(response.data).toString('base64');
      const contentType = format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'application/x-zpl';

      this.logger.log(`Oman Post label generated for shipment ${shipmentId}`);

      return { labelData, contentType };
    } catch (error) {
      this.logger.error(`Oman Post label generation failed for ${shipmentId}: ${error.message}`);
      throw new BadRequestException(`Failed to generate label: ${error.message}`);
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId: string): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
    try {
      if (!this.apiKey) {
        return { success: true };
      }

      const response = await this.httpClient.post(`/shipments/${shipmentId}/cancel`);

      if (response.data?.success) {
        this.logger.log(`Oman Post shipment cancelled: ${shipmentId}`);
        return {
          success: true,
          refundAmount: response.data.refund_amount,
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Cancellation failed',
      };
    } catch (error) {
      this.logger.error(`Oman Post cancellation failed for ${shipmentId}: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // ---- Mock data generators for development ----

  private getMockRates(origin: LocationDto, destination: LocationDto, weight: number): ShippingRate[] {
    const isDomestic = origin.country === destination.country;
    const baseRate = isDomestic ? 1.5 : 5.0;
    const weightFactor = weight * (isDomestic ? 0.5 : 2.0);

    return [
      {
        carrier: 'oman_post',
        carrierName: 'Oman Post',
        service: 'standard',
        serviceName: 'Standard Mail',
        totalAmount: Math.round((baseRate + weightFactor) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 3 : 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 3 : 10,
        transitTime: `${isDomestic ? 3 : 10} days`,
        baseAmount: baseRate,
        fuelSurcharge: 0,
        vatAmount: Math.round((baseRate + weightFactor) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: false,
        codAvailable: isDomestic,
      },
      {
        carrier: 'oman_post',
        carrierName: 'Oman Post',
        service: 'express',
        serviceName: 'Express Post',
        totalAmount: Math.round((baseRate * 2 + weightFactor * 1.5) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 5,
        transitTime: `${isDomestic ? 1 : 5} days`,
        baseAmount: baseRate * 2,
        fuelSurcharge: 0.5,
        vatAmount: Math.round((baseRate * 2 + weightFactor * 1.5) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: isDomestic,
      },
      {
        carrier: 'oman_post',
        carrierName: 'Oman Post',
        service: 'registered',
        serviceName: 'Registered Mail',
        totalAmount: Math.round((baseRate * 1.5 + weightFactor * 0.8) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 2 : 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 2 : 7,
        transitTime: `${isDomestic ? 2 : 7} days`,
        baseAmount: baseRate * 1.5,
        fuelSurcharge: 0,
        vatAmount: Math.round((baseRate * 1.5 + weightFactor * 0.8) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: isDomestic,
      },
    ];
  }

  private getMockTracking(trackingNumber: string): TrackingResult {
    const now = new Date();
    const events: TrackingEvent[] = [
      {
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Shipment Picked Up',
        statusCode: 'PU',
        description: 'Shipment picked up from sender',
        location: 'Muscat Central Post Office',
        city: 'Muscat',
        country: 'OM',
      },
      {
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        status: 'In Transit',
        statusCode: 'IT',
        description: 'Shipment in transit to sorting facility',
        location: 'Muscat Sorting Center',
        city: 'Muscat',
        country: 'OM',
      },
      {
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Out for Delivery',
        statusCode: 'OD',
        description: 'Shipment out for delivery',
        location: 'Seeb Post Office',
        city: 'Muscat',
        country: 'OM',
      },
    ];

    return {
      trackingNumber,
      carrier: 'oman_post',
      carrierName: 'Oman Post',
      status: 'out_for_delivery',
      estimatedDelivery: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      shippedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      service: 'Express Post',
      origin: { city: 'Muscat', country: 'OM' },
      destination: { city: 'Seeb', country: 'OM' },
      events,
      currentLocation: 'Seeb Post Office',
      lastUpdated: events[events.length - 1].timestamp,
      isDelivered: false,
    };
  }
}
