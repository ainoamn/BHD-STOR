import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ShippingAddress } from '../dto/create-shipment.dto';
import { LocationDto, ShippingRate } from '../dto/rate-request.dto';
import { TrackingResult, TrackingEvent } from '../dto/tracking-request.dto';

export interface AramexShipmentResult {
  success: boolean;
  shipmentId?: string;
  awbNumber?: string;
  labelUrl?: string;
  labelData?: string;
  estimatedDelivery?: string;
  totalAmount?: number;
  currency?: string;
  error?: string;
}

export interface AramexAddress {
  Line1: string;
  Line2?: string;
  Line3?: string;
  City: string;
  StateOrProvinceCode?: string;
  PostCode?: string;
  CountryCode: string;
  Longitude?: number;
  Latitude?: number;
}

@Injectable()
export class AramexService {
  private readonly logger = new Logger(AramexService.name);
  private readonly httpClient: AxiosInstance;
  private readonly accountNumber: string;
  private readonly accountPin: string;
  private readonly accountEntity: string;
  private readonly username: string;
  private readonly password: string;
  private readonly apiUrl: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.accountNumber = this.configService.get<string>('ARAMEX_ACCOUNT_NUMBER') || '';
    this.accountPin = this.configService.get<string>('ARAMEX_ACCOUNT_PIN') || '';
    this.accountEntity = this.configService.get<string>('ARAMEX_ACCOUNT_ENTITY') || 'AMM';
    this.username = this.configService.get<string>('ARAMEX_USERNAME') || '';
    this.password = this.configService.get<string>('ARAMEX_PASSWORD') || '';
    this.isSandbox = this.configService.get<string>('ARAMEX_ENVIRONMENT') !== 'production';

    if (!this.accountNumber || !this.accountPin) {
      this.logger.warn('Aramex credentials not fully configured - service will use mock data');
    }

    this.apiUrl = this.isSandbox
      ? 'https://ws.sandbox.aramex.net'
      : 'https://ws.aramex.net';

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
   * Get Aramex shipping rates
   */
  async getRates(
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: { length: number; width: number; height: number; unit: string },
  ): Promise<ShippingRate[]> {
    try {
      const payload = {
        ClientInfo: this.getClientInfo(),
        OriginAddress: this.toAramexAddress(origin),
        DestinationAddress: this.toAramexAddress(destination),
        ShipmentDetails: {
          PaymentType: 'P',
          ProductGroup: origin.country === destination.country ? 'DOM' : 'EXP',
          ProductType: 'PPX',
          ActualWeight: { Value: weight, Unit: 'KG' },
          ChargeableWeight: { Value: this.calculateVolumetricWeight(weight, dimensions), Unit: 'KG' },
          NumberOfPieces: 1,
        },
      };

      if (!this.accountNumber) {
        return this.getMockRates(origin, destination, weight);
      }

      const response = await this.httpClient.post('/ShippingAPI.V2/ShippingService_1_0.svc/json/CalculateRate', payload);

      if (response.data?.HasErrors === false && response.data?.TotalAmount) {
        const rate = response.data;

        return [
          {
            carrier: 'aramex',
            carrierName: 'Aramex',
            service: 'express',
            serviceName: 'Aramex Express',
            totalAmount: rate.TotalAmount.Value,
            currency: rate.TotalAmount.CurrencyCode || 'OMR',
            estimatedDelivery: rate.DeliveryDate || '',
            estimatedDays: this.estimateDays(origin, destination),
            transitTime: `${this.estimateDays(origin, destination)} days`,
            baseAmount: rate.Amounts?.find((a: any) => a.Type === 'Base')?.Value || rate.TotalAmount.Value,
            fuelSurcharge: rate.Amounts?.find((a: any) => a.Type === 'Fuel')?.Value || 0,
            vatAmount: rate.Amounts?.find((a: any) => a.Type === 'Tax')?.Value || 0,
            trackingAvailable: true,
            signatureAvailable: true,
            codAvailable: true,
          },
        ];
      }

      return this.getMockRates(origin, destination, weight);
    } catch (error) {
      this.logger.error(`Aramex rate request failed: ${error.message}`);
      return this.getMockRates(origin, destination, weight);
    }
  }

  /**
   * Create shipment via Aramex API
   */
  async createShipment(data: {
    orderId: string;
    sender: ShippingAddress;
    recipient: ShippingAddress;
    weight: number;
    dimensions?: any;
    description?: string;
    numberOfPieces?: number;
    insuranceAmount?: number;
    codAmount?: number;
    customsValue?: number;
    service?: string;
  }): Promise<AramexShipmentResult> {
    try {
      const payload = {
        ClientInfo: this.getClientInfo(),
        LabelInfo: {
          ReportID: 9201,
          ReportType: 'URL',
        },
        Shipments: [
          {
            Reference1: data.orderId,
            Reference2: '',
            Reference3: '',
            Shipper: {
              AccountNumber: this.accountNumber,
              PartyAddress: this.shippingToAramexParty(data.sender),
              Contact: {
                PersonName: data.sender.name,
                CompanyName: data.sender.company || data.sender.name,
                PhoneNumber1: data.sender.phone,
                CellPhone: data.sender.phone,
                EmailAddress: data.sender.email || '',
              },
            },
            Consignee: {
              AccountNumber: '',
              PartyAddress: this.shippingToAramexParty(data.recipient),
              Contact: {
                PersonName: data.recipient.name,
                CompanyName: data.recipient.company || data.recipient.name,
                PhoneNumber1: data.recipient.phone,
                CellPhone: data.recipient.phone,
                EmailAddress: data.recipient.email || '',
              },
            },
            ShippingDateTime: new Date().toISOString(),
            DueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            Comments: data.description || `Order ${data.orderId}`,
            PickupLocation: data.sender.city,
            OperationsInstructions: '',
            AccountingInstrcutions: '',
            Details: {
              Dimensions: data.dimensions
                ? {
                    Length: data.dimensions.length,
                    Width: data.dimensions.width,
                    Height: data.dimensions.height,
                    Unit: data.dimensions.unit?.toUpperCase() || 'CM',
                  }
                : null,
              ActualWeight: { Value: data.weight, Unit: 'KG' },
              ChargeableWeight: { Value: data.weight, Unit: 'KG' },
              DescriptionOfGoods: data.description || `Order ${data.orderId}`,
              GoodsOriginCountry: data.sender.country,
              NumberOfPieces: data.numberOfPieces || 1,
              ProductGroup: data.sender.country === data.recipient.country ? 'DOM' : 'EXP',
              ProductType: 'PPX',
              PaymentType: 'P',
              PaymentOptions: '',
              CustomsValueAmount: data.customsValue
                ? { CurrencyCode: 'OMR', Value: data.customsValue }
                : null,
              InsuranceAmount: data.insuranceAmount
                ? { CurrencyCode: 'OMR', Value: data.insuranceAmount }
                : null,
              CashOnDeliveryAmount: data.codAmount
                ? { CurrencyCode: 'OMR', Value: data.codAmount }
                : null,
              CollectAmount: null,
              Services: data.codAmount ? 'CODS' : '',
            },
            Attachments: [],
            ForeignHAWB: '',
            TransportType: 0,
            PickupGUID: '',
            Number: null,
            ScheduledDelivery: null,
          },
        ],
        Transaction: {
          Reference1: data.orderId,
          Reference2: '',
          Reference3: '',
          Reference4: '',
          Reference5: '',
        },
      };

      if (!this.accountNumber) {
        const awbNumber = `ARAMEX${Date.now()}`;
        return {
          success: true,
          shipmentId: `shp-aramex-${Date.now()}`,
          awbNumber,
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: data.weight * 3.5,
          currency: 'OMR',
        };
      }

      const response = await this.httpClient.post('/ShippingAPI.V2/ShippingService_1_0.svc/json/CreateShipments', payload);

      if (response.data?.Shipments?.[0]?.ID) {
        const shipment = response.data.Shipments[0];
        const awbNumber = shipment.ID;

        this.logger.log(`Aramex shipment created: AWB ${awbNumber} for order ${data.orderId}`);

        return {
          success: true,
          shipmentId: shipment.ID,
          awbNumber,
          labelUrl: shipment.Label?.LabelURL || '',
          labelData: shipment.Label?.LabelFileContents || '',
          estimatedDelivery: shipment.DeliveryDate || '',
          totalAmount: shipment.ForeignHAWB ? 0 : data.weight * 3.5,
          currency: 'OMR',
        };
      }

      const errors = response.data?.Notifications?.map((n: any) => n.Message).join(', ') || 'Shipment creation failed';
      return {
        success: false,
        error: errors,
      };
    } catch (error) {
      this.logger.error(`Aramex shipment creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.Message || error.message,
      };
    }
  }

  /**
   * Track shipment via Aramex API
   */
  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    try {
      const payload = {
        ClientInfo: this.getClientInfo(),
        Shipments: [trackingNumber],
        GetLastScannedActivityOnly: false,
      };

      if (!this.accountNumber) {
        return this.getMockTracking(trackingNumber);
      }

      const response = await this.httpClient.post('/ShippingAPI.V2/TrackingService_1_0.svc/json/TrackShipments', payload);

      if (response.data?.TrackingResults?.[0]) {
        const tracking = response.data.TrackingResults[0];

        return {
          trackingNumber: tracking.Key || trackingNumber,
          carrier: 'aramex',
          carrierName: 'Aramex',
          status: this.mapAramexStatus(tracking.Value?.ScanDescription),
          estimatedDelivery: tracking.Value?.EstimatedDeliveryDate,
          shippedDate: tracking.Value?.PickupDate,
          deliveredDate: tracking.Value?.DeliveryDate,
          signedBy: tracking.Value?.SignedBy,
          weight: tracking.Value?.Weight?.Value,
          weightUnit: tracking.Value?.Weight?.Unit,
          service: tracking.Value?.UpdateCode,
          origin: {
            city: tracking.Value?.Origin || '',
            country: '',
          },
          destination: {
            city: tracking.Value?.Destination || '',
            country: '',
          },
          events: (tracking.Value?.WaybillHistory || []).map((event: any) => ({
            timestamp: event.Date || '',
            status: event.ScanDescription || event.UpdateDescription || '',
            statusCode: event.UpdateCode || '',
            description: event.Comments || event.ScanDescription || '',
            location: event.LocationName || '',
            city: event.LocationName || '',
            country: '',
          })),
          currentLocation: tracking.Value?.LastScannedLocation,
          lastUpdated: tracking.Value?.LastScannedDate,
          isDelivered: tracking.Value?.DeliveryDate != null,
        };
      }

      return this.getMockTracking(trackingNumber);
    } catch (error) {
      this.logger.error(`Aramex tracking failed for ${trackingNumber}: ${error.message}`);
      return this.getMockTracking(trackingNumber);
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(awbNumber: string, format: 'pdf' | 'html' = 'pdf'): Promise<{ labelData: string; contentType: string }> {
    try {
      if (!this.accountNumber) {
        return { labelData: '', contentType: 'application/pdf' };
      }

      const payload = {
        ClientInfo: this.getClientInfo(),
        Shipments: [awbNumber],
      };

      const response = await this.httpClient.post('/ShippingAPI.V2/ShippingService_1_0.svc/json/PrintLabel', payload);

      if (response.data?.Shipments?.[0]?.Label?.LabelFileContents) {
        return {
          labelData: response.data.Shipments[0].Label.LabelFileContents,
          contentType: 'application/pdf',
        };
      }

      return { labelData: '', contentType: 'application/pdf' };
    } catch (error) {
      this.logger.error(`Aramex label generation failed for ${awbNumber}: ${error.message}`);
      throw new BadRequestException(`Failed to generate label: ${error.message}`);
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(awbNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.accountNumber) {
        return { success: true };
      }

      const payload = {
        ClientInfo: this.getClientInfo(),
        Shipments: [
          {
            ShipmentNumber: awbNumber,
            Comments: 'Cancelled by merchant',
          },
        ],
      };

      const response = await this.httpClient.post('/ShippingAPI.V2/ShippingService_1_0.svc/json/CancelShipments', payload);

      if (response.data?.Notifications?.every((n: any) => n.Code === '000')) {
        this.logger.log(`Aramex shipment cancelled: AWB ${awbNumber}`);
        return { success: true };
      }

      const errors = response.data?.Notifications?.filter((n: any) => n.Code !== '000')
        .map((n: any) => n.Message)
        .join(', ');

      return {
        success: false,
        error: errors || 'Cancellation failed',
      };
    } catch (error) {
      this.logger.error(`Aramex cancellation failed for ${awbNumber}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule a pickup
   */
  async schedulePickup(
    data: {
      dateTime: string;
      readyTime: string;
      lastPickupTime: string;
      closingTime: string;
      address: ShippingAddress;
      weight: number;
      numberOfPieces: number;
    },
  ): Promise<{ success: boolean; pickupId?: string; error?: string }> {
    try {
      const payload = {
        ClientInfo: this.getClientInfo(),
        LabelInfo: { ReportID: 9201, ReportType: 'URL' },
        Pickup: {
          PickupAddress: this.shippingToAramexParty(data.address),
          PickupContact: {
            PersonName: data.address.name,
            CompanyName: data.address.company || data.address.name,
            PhoneNumber1: data.address.phone,
            CellPhone: data.address.phone,
            EmailAddress: data.address.email || '',
          },
          PickupLocation: data.address.city,
          Comments: 'Scheduled pickup from BHD Marketplace',
          Reference1: `Pickup-${Date.now()}`,
          Reference2: '',
          Reference3: '',
          ShippingDateTime: data.dateTime,
          ReadyTime: data.readyTime,
          LastPickupTime: data.lastPickupTime,
          ClosingTime: data.closingTime,
          PickupItems: [
            {
              ProductGroup: 'EXP',
              ProductType: 'PPX',
              NumberOfShipments: data.numberOfPieces,
              PackageType: 'Box',
              Payment: 'P',
              ShipmentWeight: { Value: data.weight, Unit: 'KG' },
              ShipmentVolume: null,
              NumberOfPieces: data.numberOfPieces,
              CashAmount: null,
              ExtraCharges: null,
              Currency: 'OMR',
            },
          ],
          Status: 'Ready',
        },
        Transaction: {
          Reference1: `Pickup-${Date.now()}`,
          Reference2: '',
          Reference3: '',
          Reference4: '',
          Reference5: '',
        },
      };

      if (!this.accountNumber) {
        return { success: true, pickupId: `PKP-${Date.now()}` };
      }

      const response = await this.httpClient.post('/ShippingAPI.V2/ShippingService_1_0.svc/json/SchedulePickup', payload);

      if (response.data?.ProcessedPickup?.GUID) {
        return {
          success: true,
          pickupId: response.data.ProcessedPickup.GUID,
        };
      }

      return {
        success: false,
        error: 'Pickup scheduling failed',
      };
    } catch (error) {
      this.logger.error(`Aramex pickup scheduling failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ---- Helper methods ----

  private getClientInfo() {
    return {
      UserName: this.username,
      Password: this.password,
      Version: 'v1.0',
      AccountNumber: this.accountNumber,
      AccountPin: this.accountPin,
      AccountEntity: this.accountEntity,
      AccountCountryCode: 'OM',
      Source: 24,
    };
  }

  private toAramexAddress(location: LocationDto): AramexAddress {
    return {
      Line1: location.area || location.city,
      City: location.city,
      PostCode: location.postalCode || '',
      CountryCode: location.country,
      Longitude: location.longitude,
      Latitude: location.latitude,
    };
  }

  private shippingToAramexParty(address: ShippingAddress): AramexAddress {
    return {
      Line1: address.street1,
      Line2: address.street2 || '',
      Line3: '',
      City: address.city,
      StateOrProvinceCode: address.state || '',
      PostCode: address.postalCode || '',
      CountryCode: address.country,
    };
  }

  private calculateVolumetricWeight(actualWeight: number, dimensions?: any): number {
    if (!dimensions) return actualWeight;
    const { length = 0, width = 0, height = 0, unit = 'cm' } = dimensions;
    const factor = unit.toLowerCase() === 'cm' ? 5000 : 305;
    const volumetricWeight = (length * width * height) / factor;
    return Math.max(actualWeight, volumetricWeight);
  }

  private estimateDays(origin: LocationDto, destination: LocationDto): number {
    if (origin.country === destination.country) return 1;
    if (origin.country === 'OM' && destination.country === 'OM') return 1;
    return 3;
  }

  private mapAramexStatus(scanDescription?: string): string {
    if (!scanDescription) return 'unknown';
    const desc = scanDescription.toLowerCase();
    if (desc.includes('delivered')) return 'delivered';
    if (desc.includes('out for delivery')) return 'out_for_delivery';
    if (desc.includes('shipment on hold')) return 'on_hold';
    if (desc.includes('customs')) return 'in_customs';
    if (desc.includes('transit')) return 'in_transit';
    if (desc.includes('picked up')) return 'picked_up';
    return 'in_transit';
  }

  // ---- Mock data ----

  private getMockRates(origin: LocationDto, destination: LocationDto, weight: number): ShippingRate[] {
    const isDomestic = origin.country === destination.country;
    const baseRate = isDomestic ? 2.0 : 6.0;
    const weightFactor = weight * (isDomestic ? 0.8 : 3.0);

    return [
      {
        carrier: 'aramex',
        carrierName: 'Aramex',
        service: 'express',
        serviceName: 'Aramex Express Parcel',
        totalAmount: Math.round((baseRate + weightFactor) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 3,
        transitTime: `${isDomestic ? 1 : 3} days`,
        baseAmount: baseRate,
        fuelSurcharge: Math.round(baseRate * 0.15 * 1000) / 1000,
        vatAmount: Math.round((baseRate + weightFactor) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: true,
        codAvailable: true,
      },
      {
        carrier: 'aramex',
        carrierName: 'Aramex',
        service: 'domestic',
        serviceName: 'Aramex Domestic',
        totalAmount: Math.round((baseRate * 0.7 + weightFactor * 0.8) * 1000) / 1000,
        currency: 'OMR',
        estimatedDelivery: new Date(Date.now() + (isDomestic ? 1 : 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: isDomestic ? 1 : 5,
        transitTime: `${isDomestic ? 1 : 5} days`,
        baseAmount: baseRate * 0.7,
        fuelSurcharge: Math.round(baseRate * 0.7 * 0.15 * 1000) / 1000,
        vatAmount: Math.round((baseRate * 0.7 + weightFactor * 0.8) * 0.05 * 1000) / 1000,
        trackingAvailable: true,
        signatureAvailable: false,
        codAvailable: true,
      },
    ];
  }

  private getMockTracking(trackingNumber: string): TrackingResult {
    const now = new Date();
    return {
      trackingNumber,
      carrier: 'aramex',
      carrierName: 'Aramex',
      status: 'in_transit',
      estimatedDelivery: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      shippedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      service: 'Express',
      origin: { city: 'Muscat', country: 'OM' },
      destination: { city: 'Dubai', country: 'AE' },
      events: [
        {
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'Shipment Picked Up',
          statusCode: 'PU',
          description: 'Shipment picked up from shipper',
          location: 'Muscat Aramex Hub',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
          status: 'In Transit',
          statusCode: 'TR',
          description: 'Shipment in transit to destination',
          location: 'Muscat Gateway',
          city: 'Muscat',
          country: 'OM',
        },
        {
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'Departed Origin',
          statusCode: 'DEP',
          description: 'Shipment departed origin facility',
          location: 'Muscat International Airport',
          city: 'Muscat',
          country: 'OM',
        },
      ],
      currentLocation: 'In transit to Dubai',
      lastUpdated: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      isDelivered: false,
    };
  }
}
