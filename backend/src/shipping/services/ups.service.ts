import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as xml2js from 'xml2js';
import { ShippingAddress } from '../dto/create-shipment.dto';
import { LocationDto, ShippingRate } from '../dto/rate-request.dto';
import { TrackingResult, TrackingEvent } from '../dto/tracking-request.dto';

export interface UPSShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  shipmentDigest?: string;
  labelData?: string;
  labelImage?: string;
  estimatedDelivery?: string;
  totalAmount?: number;
  currency?: string;
  error?: string;
}

@Injectable()
export class UPSService {
  private readonly logger = new Logger(UPSService.name);
  private readonly httpClient: AxiosInstance;
  private readonly accessKey: string;
  private readonly userId: string;
  private readonly password: string;
  private readonly accountNumber: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.accessKey = this.configService.get<string>('UPS_ACCESS_KEY') || '';
    this.userId = this.configService.get<string>('UPS_USER_ID') || '';
    this.password = this.configService.get<string>('UPS_PASSWORD') || '';
    this.accountNumber = this.configService.get<string>('UPS_ACCOUNT_NUMBER') || '';
    this.isSandbox = this.configService.get<string>('UPS_ENVIRONMENT') !== 'production';

    if (!this.accessKey || !this.userId || !this.password) {
      this.logger.warn('UPS credentials not configured - service will use mock data');
    }

    this.apiUrl = this.isSandbox
      ? 'https://wwwcie.ups.com'
      : 'https://onlinetools.ups.com';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Get UPS shipping rates
   */
  async getRates(
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: { length: number; width: number; height: number; unit: string },
  ): Promise<ShippingRate[]> {
    try {
      const payload = {
        RateRequest: {
          Request: {
            TransactionReference: {
              CustomerContext: `BHD-${Date.now()}`,
            },
          },
          Shipment: {
            Shipper: {
              Name: 'BHD Marketplace',
              Address: {
                AddressLine: ['PO Box 100'],
                City: origin.city,
                StateProvinceCode: '',
                PostalCode: origin.postalCode || '',
                CountryCode: origin.country,
              },
            },
            ShipTo: {
              Name: 'Customer',
              Address: {
                AddressLine: [destination.area || ''],
                City: destination.city,
                StateProvinceCode: '',
                PostalCode: destination.postalCode || '',
                CountryCode: destination.country,
              },
            },
            ShipFrom: {
              Name: 'BHD Marketplace',
              Address: {
                AddressLine: ['PO Box 100'],
                City: origin.city,
                StateProvinceCode: '',
                PostalCode: origin.postalCode || '',
                CountryCode: origin.country,
              },
            },
            Service: {
              Code: '07', // UPS Worldwide Express
              Description: 'Express',
            },
            Package: {
              PackagingType: {
                Code: '02',
                Description: 'Package',
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'KGS',
                },
                Weight: weight.toString(),
              },
              Dimensions: dimensions
                ? {
                    UnitOfMeasurement: {
                      Code: dimensions.unit?.toUpperCase() === 'IN' ? 'IN' : 'CM',
                    },
                    Length: dimensions.length.toString(),
                    Width: dimensions.width.toString(),
                    Height: dimensions.height.toString(),
                  }
                : undefined,
            },
            ShipmentRatingOptions: {
              NegotiatedRatesIndicator: '1',
            },
          },
        },
      };

      if (!this.accessKey) {
        return this.getMockRates(origin, destination, weight);
      }

      const response = await this.httpClient.post('/api/rating/v1/Rate', payload, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });

      if (response.data?.RateResponse?.RatedShipment) {
        const ratedShipments = Array.isArray(response.data.RateResponse.RatedShipment)
          ? response.data.RateResponse.RatedShipment
          : [response.data.RateResponse.RatedShipment];

        return ratedShipments.map((rate: any) => ({
          carrier: 'ups',
          carrierName: 'UPS',
          service: rate.Service?.Code || '07',
          serviceName: this.getServiceName(rate.Service?.Code || '07'),
          totalAmount: parseFloat(rate.TotalCharges?.MonetaryValue) || 0,
          currency: rate.TotalCharges?.CurrencyCode || 'OMR',
          estimatedDelivery: rate.GuaranteedDelivery?.BusinessDaysInTransit
            ? new Date(Date.now() + parseInt(rate.GuaranteedDelivery.BusinessDaysInTransit) * 24 * 60 * 60 * 1000).toISOString()
            : '',
          estimatedDays: parseInt(rate.GuaranteedDelivery?.BusinessDaysInTransit) || 3,
          transitTime: `${rate.GuaranteedDelivery?.BusinessDaysInTransit || 3} business days`,
          baseAmount: parseFloat(rate.TransportationCharges?.MonetaryValue) || 0,
          fuelSurcharge: 0,
          vatAmount: parseFloat(rate.TotalCharges?.MonetaryValue) - parseFloat(rate.TransportationCharges?.MonetaryValue) || 0,
          trackingAvailable: true,
          signatureAvailable: true,
          codAvailable: false,
        }));
      }

      return this.getMockRates(origin, destination, weight);
    } catch (error) {
      this.logger.error(`UPS rate request failed: ${error.message}`);
      return this.getMockRates(origin, destination, weight);
    }
  }

  /**
   * Create a UPS shipment
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
  }): Promise<UPSShipmentResult> {
    try {
      const payload = {
        ShipmentRequest: {
          Request: {
            RequestOption: 'nonvalidate',
            TransactionReference: {
              CustomerContext: data.orderId,
            },
          },
          Shipment: {
            Description: data.description || `Order ${data.orderId}`,
            Shipper: {
              Name: data.sender.name,
              AttentionName: data.sender.name,
              TaxIdentificationNumber: '',
              Phone: {
                Number: data.sender.phone,
              },
              ShipperNumber: this.accountNumber,
              Address: {
                AddressLine: [data.sender.street1, data.sender.street2].filter(Boolean),
                City: data.sender.city,
                StateProvinceCode: data.sender.state || '',
                PostalCode: data.sender.postalCode || '',
                CountryCode: data.sender.country,
              },
            },
            ShipTo: {
              Name: data.recipient.name,
              AttentionName: data.recipient.name,
              Phone: {
                Number: data.recipient.phone,
              },
              Address: {
                AddressLine: [data.recipient.street1, data.recipient.street2].filter(Boolean),
                City: data.recipient.city,
                StateProvinceCode: data.recipient.state || '',
                PostalCode: data.recipient.postalCode || '',
                CountryCode: data.recipient.country,
              },
            },
            ShipFrom: {
              Name: data.sender.name,
              AttentionName: data.sender.name,
              Phone: {
                Number: data.sender.phone,
              },
              FaxNumber: '',
              Address: {
                AddressLine: [data.sender.street1, data.sender.street2].filter(Boolean),
                City: data.sender.city,
                StateProvinceCode: data.sender.state || '',
                PostalCode: data.sender.postalCode || '',
                CountryCode: data.sender.country,
              },
            },
            PaymentInformation: {
              ShipmentCharge: {
                Type: '01',
                BillShipper: {
                  AccountNumber: this.accountNumber,
                },
              },
            },
            Service: {
              Code: data.service || '07',
              Description: 'Express',
            },
            Package: {
              Description: data.description || 'Package',
              Packaging: {
                Code: '02',
                Description: 'Package',
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'KGS',
                },
                Weight: data.weight.toString(),
              },
              Dimensions: data.dimensions
                ? {
                    UnitOfMeasurement: {
                      Code: data.dimensions.unit?.toUpperCase() === 'IN' ? 'IN' : 'CM',
                    },
                    Length: data.dimensions.length.toString(),
                    Width: data.dimensions.width.toString(),
                    Height: data.dimensions.height.toString(),
                  }
                : undefined,
              PackageServiceOptions: data.insuranceAmount
                ? {
                    InsuredValue: {
                      CurrencyCode: 'OMR',
                      MonetaryValue: data.insuranceAmount.toString(),
                    },
                  }
                : undefined,
            },
          },
          LabelSpecification: {
            LabelImageFormat: {
              Code: 'PDF',
              Description: 'PDF',
            },
            LabelStockSize: {
              Height: 6,
              Width: 4,
            },
          },
        },
      };

      if (!this.accessKey) {
        const trackingNumber = `1Z${this.accountNumber || '999AA'}${Date.now().toString().slice(-8)}`;
        return {
          success: true,
          shipmentId: `shp-ups-${Date.now()}`,
          trackingNumber,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: data.weight * 4.0,
          currency: 'OMR',
        };
      }

      const response = await this.httpClient.post('/api/shipments/v1/ship', payload, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });

      if (response.data?.ShipmentResponse?.ShipmentResults) {
        const results = response.data.ShipmentResponse.ShipmentResults;

        this.logger.log(`UPS shipment created: ${results.ShipmentIdentificationNumber} for order ${data.orderId}`);

        return {
          success: true,
          shipmentId: results.ShipmentIdentificationNumber,
          trackingNumber: results.ShipmentIdentificationNumber,
          shipmentDigest: results.ShipmentDigest,
          labelData: results.PackageResults?.ShippingLabel?.GraphicImage,
          labelImage: results.PackageResults?.ShippingLabel?.HTMLImage,
          estimatedDelivery: results.ScheduledDeliveryDate || '',
          totalAmount: parseFloat(results.ShipmentCharges?.TotalCharges?.MonetaryValue) || 0,
          currency: results.ShipmentCharges?.TotalCharges?.CurrencyCode || 'OMR',
        };
      }

      return {
        success: false,
        error: response.data?.response?.errors?.[0]?.message || 'Shipment creation failed',
      };
    } catch (error) {
      this.logger.error(`UPS shipment creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.response?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Track shipment via UPS API
   */
  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    try {
      if (!this.accessKey) {
        return this.getMockTracking(trackingNumber);
      }

      const response = await this.httpClient.get(`/api/track/v1/details/${trackingNumber}`, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });

      if (response.data?.trackResponse?.shipment?.[0]) {
        const shipment = response.data.trackResponse.shipment[0];
        const package0 = shipment.package?.[0];

        return {
          trackingNumber: package0?.trackingNumber || trackingNumber,
          carrier: 'ups',
          carrierName: 'UPS',
          status: this.mapUPSStatus(package0?.currentStatus?.code),
          estimatedDelivery: package0?.deliveryDate?.[0]?.date,
          shippedDate: package0?.pickupDate?.[0]?.date,
          deliveredDate: package0?.deliveryDate?.[0]?.date,
          service: shipment.service?.[0]?.description || '',
          origin: {
            city: shipment.shipperAddress?.city || '',
            country: shipment.shipperAddress?.country || '',
          },
          destination: {
            city: shipment.shipToAddress?.city || '',
            country: shipment.shipToAddress?.country || '',
          },
          events: (package0?.activity || []).map((activity: any) => ({
            timestamp: activity.date && activity.time ? `${activity.date}T${activity.time}` : '',
            status: activity.status?.description || '',
            statusCode: activity.status?.code || '',
            description: activity.status?.description || '',
            location: activity.location?.address?.city || '',
            city: activity.location?.address?.city || '',
            country: activity.location?.address?.country || '',
          })),
          currentLocation: package0?.location?.address?.city || '',
          lastUpdated: package0?.deliveryDate?.[0]?.date || '',
          isDelivered: package0?.currentStatus?.code === 'D',
        };
      }

      return this.getMockTracking(trackingNumber);
    } catch (error) {
      this.logger.error(`UPS tracking failed for ${trackingNumber}: ${error.message}`);
      return this.getMockTracking(trackingNumber);
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentId: string, format: 'pdf' | 'zpl' | 'png' = 'pdf'): Promise<{ labelData: string; contentType: string }> {
    try {
      if (!this.accessKey) {
        return { labelData: '', contentType: 'application/pdf' };
      }

      // UPS labels are generated at shipment creation
      // For reprint, we would need the shipment digest
      this.logger.log(`UPS label reprint requested for ${shipmentId}`);

      // Return stored label or empty
      return { labelData: '', contentType: 'application/pdf' };
    } catch (error) {
      this.logger.error(`UPS label generation failed for ${shipmentId}: ${error.message}`);
      throw new BadRequestException(`Failed to generate label: ${error.message}`);
    }
  }

  /**
   * Validate address via UPS API
   */
  async validateAddress(address: ShippingAddress): Promise<{ valid: boolean; suggestions?: any[]; message?: string }> {
    try {
      if (!this.accessKey) {
        return { valid: true };
      }

      const payload = {
        XAVRequest: {
          AddressKeyFormat: {
            AddressLine: [address.street1, address.street2].filter(Boolean),
            PoliticalDivision2: address.city,
            PoliticalDivision1: address.state || '',
            PostcodePrimaryLow: address.postalCode || '',
            CountryCode: address.country,
          },
        },
      };

      const response = await this.httpClient.post('/api/addressvalidation/v1/1', payload, {
        headers: {
          ...this.getAuthHeaders(),
        },
      });

      const candidate = response.data?.XAVResponse?.Candidate;
      const isValid = !!candidate && candidate.length > 0;

      return {
        valid: isValid,
        suggestions: candidate || [],
      };
    } catch (error) {
      this.logger.error(`UPS address validation failed: ${error.message}`);
      return { valid: true }; // Fail open
    }
  }

  // ---- Helper methods ----

  private getAuthHeaders(): Record<string, string> {
    return {
      'access-control-allow-origin': '*',
      Authorization: `Bearer ${Buffer.from(`${this.userId}:${this.password}`).toString('base64')}`,
    };
  }

  private getServiceName(code: string): string {
    const serviceNames: Record<string, string> = {
      '01': 'UPS Next Day Air',
      '02': 'UPS Second Day Air',
      '03': 'UPS Ground',
      '07': 'UPS Worldwide Express',
      '08': 'UPS Worldwide Expedited',
      '11': 'UPS Standard',
      '12': 'UPS Three-Day Select',
      '54': 'UPS Worldwide Express Plus',
      '65': 'UPS Saver',
    };
    return serviceNames[code] || 'UPS Express';
  }

  private mapUPSStatus(code?: string): string {
    const statusMap: Record<string, string> = {
      M: 'picked_up',
      P: 'picked_up',
      D: 'delivered',
      I: 'in_transit',
      X: 'exception',
      O: 'out_for_delivery',
    };
    return statusMap[code || ''] || 'unknown';
  }

  // ---- Mock data ----

  private getMockRates(origin: LocationDto, destination: LocationDto, weight: number): ShippingRate[] {
    const isDomestic = origin.country === destination.country;
    const baseRate = isDomestic ? 3.0 : 8.5;
    const weightFactor = weight * (isDomestic ? 1.1 : 4.2);

    return [
      {
        carrier: 'ups',
        carrierName: 'UPS',
        service: '07',
        serviceName: 'UPS Worldwide Express',
        totalAmount: Math.round((baseRate + weightFactor) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 3,
        transitTime: `${isDomestic ? 1 : 3} business days`,
        baseAmount: baseRate,
        fuelSurcharge: Math.round(baseRate * 0.17 * 1000) / 1000,
        vatAmount: Math.round((baseRate + weightFactor) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: false,
      },
      {
        carrier: 'ups',
        carrierName: 'UPS',
        service: '08',
        serviceName: 'UPS Worldwide Expedited',
        totalAmount: Math.round((baseRate * 0.75 + weightFactor * 0.9) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 2 : 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 2 : 5,
        transitTime: `${isDomestic ? 2 : 5} business days`,
        baseAmount: baseRate * 0.75,
        fuelSurcharge: Math.round(baseRate * 0.75 * 0.17 * 1000) / 1000,
        vatAmount: Math.round((baseRate * 0.75 + weightFactor * 0.9) * 0.05 * 1000) / 1000,
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
      carrier: 'ups',
      carrierName: 'UPS',
      status: 'in_transit',
      estimatedDelivery: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      service: 'Worldwide Express',
      origin: { city: 'Muscat', country: 'OM' },
      destination: { city: 'Singapore', country: 'SG' },
      events: [
        {
          timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
          status: 'Order Processed',
          statusCode: 'MP',
          description: 'Shipper created a label',
          location: 'Muscat',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'Picked Up',
          statusCode: 'PU',
          description: 'UPS picked up the package',
          location: 'Muscat',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 40 * 60 * 60 * 1000).toISOString(),
          status: 'Departed Facility',
          statusCode: 'OR',
          description: 'Departed UPS facility',
          location: 'Muscat Hub',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(),
          status: 'Arrived at Facility',
          statusCode: 'AR',
          description: 'Arrived at transit facility',
          location: 'Dubai',
          city: 'Dubai',
          country: 'AE',
        },
      ],
      currentLocation: 'Dubai Transit Hub',
      lastUpdated: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(),
      isDelivered: false,
    };
  }
}
