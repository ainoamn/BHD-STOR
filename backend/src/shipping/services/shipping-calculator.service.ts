import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OmanPostService } from './oman-post.service';
import { AramexService } from './aramex.service';
import { DHLService } from './dhl.service';
import { FedExService } from './fedex.service';
import { UPSService } from './ups.service';
import { ShippingCarriersService } from './shipping-carriers.service';
import { LocationDto, ShippingRate, RateComparisonResult } from '../dto/rate-request.dto';
import { ShippingAddress } from '../dto/create-shipment.dto';

export interface ShippingCalculationResult {
  recommended: ShippingRate | null;
  allRates: ShippingRate[];
  cheapest: ShippingRate | null;
  fastest: ShippingRate | null;
  estimatedDelivery: string;
  currency: string;
}

export interface AddressValidationResult {
  valid: boolean;
  normalized?: ShippingAddress;
  suggestions?: ShippingAddress[];
  message?: string;
  details?: {
    streetValid: boolean;
    cityValid: boolean;
    postalCodeValid: boolean;
    countryValid: boolean;
  };
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  carrierName: string;
  service: string;
  estimatedDays: number;
  baseRate: number;
  isAvailable: boolean;
  restrictions?: string[];
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions?: string[];
  postalCodes?: string[];
  rates: ZoneRate[];
}

export interface ZoneRate {
  id: string;
  weightFrom: number;
  weightTo: number;
  rate: number;
  carrier: string;
  service: string;
}

@Injectable()
export class ShippingCalculatorService {
  private readonly logger = new Logger(ShippingCalculatorService.name);
  private readonly omanCities: string[] = [
    'Muscat', 'Seeb', 'Bawshar', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri',
    'Rustaq', 'Barka', 'Khasab', 'Bahla', 'Izki', 'Ibra', 'Adam', 'Haima',
    'Al Buraimi', 'Al Hamra', 'Bidiyah', 'Dibba', 'Jalan', 'Liwa', 'Madha',
    'Manah', 'Marmul', 'Masirah', 'Mudhaibi', 'Musannah', 'Nakhal', 'Quriyat',
    'Samail', 'Shinas', 'Suwayq', 'Thumrait',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly omanPostService: OmanPostService,
    private readonly aramexService: AramexService,
    private readonly dhlService: DHLService,
    private readonly fedExService: FedExService,
    private readonly upsService: UPSService,
    private readonly carriersService: ShippingCarriersService,
  ) {}

  /**
   * Calculate best shipping options for an order
   */
  async calculateShipping(
    orderItems: Array<{ weight: number; quantity: number; dimensions?: { length: number; width: number; height: number } }>,
    destinationAddress: ShippingAddress,
    preferredCarrier?: string,
  ): Promise<ShippingCalculationResult> {
    try {
      // Calculate total weight and dimensions
      const totalWeight = orderItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const totalDimensions = this.aggregateDimensions(orderItems);

      // Default origin (BHD Marketplace warehouse in Muscat)
      const origin: LocationDto = {
        country: 'OM',
        city: 'Muscat',
        postalCode: '100',
      };

      const destination: LocationDto = {
        country: destinationAddress.country,
        city: destinationAddress.city,
        postalCode: destinationAddress.postalCode,
      };

      this.logger.log(`Calculating shipping: ${totalWeight}kg from ${origin.city} to ${destination.city}`);

      // Get rates from all or preferred carriers
      let allRates: ShippingRate[] = [];

      if (preferredCarrier) {
        await this.carriersService.assertCarrierEnabled(preferredCarrier);
        const rates = await this.getCarrierRates(preferredCarrier, origin, destination, totalWeight, totalDimensions);
        allRates = rates;
      } else {
        const activeCarriers = await this.carriersService.getActiveRateServiceCodes();
        const carrierPromises = activeCarriers.map(async (carrier) => {
          try {
            return await this.getCarrierRates(carrier, origin, destination, totalWeight, totalDimensions);
          } catch (error) {
            this.logger.warn(`Failed to get rates from ${carrier}: ${error.message}`);
            return [];
          }
        });

        const results = await Promise.all(carrierPromises);
        allRates = results.flat();
      }

      // Sort by price
      allRates.sort((a, b) => a.totalAmount - b.totalAmount);

      // Find cheapest and fastest
      const cheapest = allRates.length > 0 ? allRates[0] : null;
      const fastest = allRates.length > 0
        ? [...allRates].sort((a, b) => a.estimatedDays - b.estimatedDays)[0]
        : null;

      // Recommendation algorithm: balance price and speed
      const recommended = this.selectRecommended(allRates, destinationAddress.country);

      this.logger.log(`Found ${allRates.length} shipping rates. Cheapest: ${cheapest?.totalAmount} OMR, Fastest: ${fastest?.estimatedDays} days`);

      return {
        recommended,
        allRates,
        cheapest,
        fastest,
        estimatedDelivery: recommended?.estimatedDelivery || '',
        currency: 'OMR',
      };
    } catch (error) {
      this.logger.error(`Shipping calculation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to calculate shipping: ${error.message}`);
    }
  }

  /**
   * Compare rates across all carriers for a specific route
   */
  async compareRates(
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: { length: number; width: number; height: number; unit: string },
  ): Promise<RateComparisonResult> {
    try {
      this.logger.log(`Comparing rates: ${origin.city} -> ${destination.city}, ${weight}kg`);

      const carriers = await this.carriersService.getActiveRateServiceCodes();
      const allRates: ShippingRate[] = [];

      const promises = carriers.map(async (carrier) => {
        try {
          const rates = await this.getCarrierRates(carrier, origin, destination, weight, dimensions);
          allRates.push(...rates);
        } catch (error) {
          this.logger.warn(`Rate comparison: ${carrier} failed: ${error.message}`);
        }
      });

      await Promise.all(promises);

      // Sort by total amount
      allRates.sort((a, b) => a.totalAmount - b.totalAmount);

      const cheapest = allRates.find(() => true) || undefined;
      const fastest = [...allRates].sort((a, b) => a.estimatedDays - b.estimatedDays)[0] || undefined;

      // Weighted score: 60% price, 40% speed
      const recommended = this.selectRecommended(allRates, destination.country);

      return {
        rates: allRates,
        cheapest,
        fastest,
        recommended,
        origin,
        destination,
        weight,
      };
    } catch (error) {
      this.logger.error(`Rate comparison failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to compare rates: ${error.message}`);
    }
  }

  /**
   * Estimate delivery date for a specific carrier and route
   */
  async estimateDelivery(
    carrier: string,
    origin: LocationDto,
    destination: LocationDto,
  ): Promise<{ estimatedDate: string; estimatedDays: number; confidence: number }> {
    try {
      const isDomestic = origin.country === destination.country;
      const isSameCity = isDomestic && origin.city.toLowerCase() === destination.city.toLowerCase();

      let baseDays: number;
      switch (carrier) {
        case 'oman_post':
          baseDays = isSameCity ? 1 : isDomestic ? 2 : 10;
          break;
        case 'aramex':
          baseDays = isSameCity ? 1 : isDomestic ? 1 : 3;
          break;
        case 'dhl':
          baseDays = isDomestic ? 1 : 3;
          break;
        case 'fedex':
          baseDays = isDomestic ? 1 : 3;
          break;
        case 'ups':
          baseDays = isDomestic ? 1 : 3;
          break;
        default:
          baseDays = isDomestic ? 2 : 5;
      }

      // Adjust for GCC countries (faster)
      const gccCountries = ['OM', 'AE', 'SA', 'QA', 'BH', 'KW'];
      if (!isDomestic && gccCountries.includes(destination.country)) {
        baseDays = Math.min(baseDays, 2);
      }

      const estimatedDate = new Date(Date.now() + baseDays * 24 * 60 * 60 * 1000);

      // Skip weekends for estimate
      if (estimatedDate.getDay() === 5) {
        estimatedDate.setDate(estimatedDate.getDate() + 2); // Friday -> Sunday
      } else if (estimatedDate.getDay() === 6) {
        estimatedDate.setDate(estimatedDate.getDate() + 1); // Saturday -> Sunday
      }

      return {
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        estimatedDays: baseDays,
        confidence: isSameCity ? 0.95 : isDomestic ? 0.9 : 0.8,
      };
    } catch (error) {
      this.logger.error(`Delivery estimation failed: ${error.message}`);
      return {
        estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDays: 3,
        confidence: 0.7,
      };
    }
  }

  /**
   * Validate a shipping address
   */
  async validateAddress(address: ShippingAddress): Promise<AddressValidationResult> {
    try {
      const result: AddressValidationResult = {
        valid: false,
        details: {
          streetValid: false,
          cityValid: false,
          postalCodeValid: false,
          countryValid: false,
        },
      };

      // Validate country
      if (!address.country || address.country.length !== 2) {
        result.message = 'Invalid country code';
        return result;
      }
      result.details!.countryValid = true;

      // Validate street
      if (!address.street1 || address.street1.length < 3) {
        result.message = 'Street address is required';
        return result;
      }
      result.details!.streetValid = true;

      // Validate city
      if (!address.city || address.city.length < 2) {
        result.message = 'City is required';
        return result;
      }
      result.details!.cityValid = true;

      // Validate Oman-specific addresses
      if (address.country === 'OM') {
        const normalizedCity = this.normalizeOmanCity(address.city);
        if (!normalizedCity) {
          result.message = `City "${address.city}" not recognized for Oman deliveries`;
          result.suggestions = this.findSimilarCities(address.city).map((city) => ({
            ...address,
            city,
          }));
          return result;
        }
        result.normalized = { ...address, city: normalizedCity };
        result.details!.cityValid = true;

        // Validate phone for Oman
        if (address.phone) {
          const omanPhone = this.normalizeOmanPhone(address.phone);
          if (!omanPhone) {
            result.message = 'Invalid Oman phone number. Expected format: +968 XXXX XXXX';
            result.details!.streetValid = true;
            result.details!.cityValid = true;
            return result;
          }
          result.normalized.phone = omanPhone;
        }
      }

      // Validate postal code (optional for Oman but good to have)
      if (address.country === 'OM') {
        result.details!.postalCodeValid = true; // Optional for Oman
      } else if (address.postalCode) {
        result.details!.postalCodeValid = true;
      }

      result.valid = true;
      result.message = 'Address is valid';

      return result;
    } catch (error) {
      this.logger.error(`Address validation failed: ${error.message}`);
      return {
        valid: false,
        message: `Validation error: ${error.message}`,
      };
    }
  }

  /**
   * Get available shipping methods for a store
   */
  async getAvailableMethods(storeId: string, destination: LocationDto): Promise<ShippingMethod[]> {
    try {
      // In production: fetch store's enabled carriers from database
      const defaultMethods: ShippingMethod[] = [
        {
          id: 'oman_post_standard',
          name: 'Oman Post Standard',
          carrier: 'oman_post',
          carrierName: 'Oman Post',
          service: 'standard',
          estimatedDays: 3,
          baseRate: 1.5,
          isAvailable: destination.country === 'OM',
        },
        {
          id: 'oman_post_express',
          name: 'Oman Post Express',
          carrier: 'oman_post',
          carrierName: 'Oman Post',
          service: 'express',
          estimatedDays: 1,
          baseRate: 3.0,
          isAvailable: destination.country === 'OM',
        },
        {
          id: 'aramex_express',
          name: 'Aramex Express',
          carrier: 'aramex',
          carrierName: 'Aramex',
          service: 'express',
          estimatedDays: destination.country === 'OM' ? 1 : 3,
          baseRate: destination.country === 'OM' ? 2.0 : 6.0,
          isAvailable: true,
        },
        {
          id: 'dhl_express',
          name: 'DHL Express',
          carrier: 'dhl',
          carrierName: 'DHL Express',
          service: 'P',
          estimatedDays: destination.country === 'OM' ? 1 : 3,
          baseRate: destination.country === 'OM' ? 3.5 : 8.0,
          isAvailable: true,
        },
        {
          id: 'fedex_priority',
          name: 'FedEx International Priority',
          carrier: 'fedex',
          carrierName: 'FedEx',
          service: 'INTERNATIONAL_PRIORITY',
          estimatedDays: destination.country === 'OM' ? 1 : 3,
          baseRate: destination.country === 'OM' ? 3.5 : 9.0,
          isAvailable: true,
        },
        {
          id: 'ups_express',
          name: 'UPS Worldwide Express',
          carrier: 'ups',
          carrierName: 'UPS',
          service: '07',
          estimatedDays: destination.country === 'OM' ? 1 : 3,
          baseRate: destination.country === 'OM' ? 3.0 : 8.5,
          isAvailable: true,
        },
      ];

      // Filter by availability and sort by estimated days
      return defaultMethods
        .filter((m) => m.isAvailable)
        .sort((a, b) => a.estimatedDays - b.estimatedDays);
    } catch (error) {
      this.logger.error(`Failed to get available methods: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate volumetric weight
   */
  calculateVolumetricWeight(dimensions: { length: number; width: number; height: number }, unit: string = 'cm'): number {
    const { length, width, height } = dimensions;
    const volume = length * width * height;
    const divisor = unit.toLowerCase() === 'in' ? 305 : 5000;
    return volume / divisor;
  }

  /**
   * Calculate chargeable weight (actual vs volumetric, whichever is greater)
   */
  calculateChargeableWeight(
    actualWeight: number,
    dimensions?: { length: number; width: number; height: number; unit?: string },
  ): number {
    if (!dimensions) return actualWeight;
    const volumetricWeight = this.calculateVolumetricWeight(dimensions, dimensions.unit);
    return Math.max(actualWeight, volumetricWeight);
  }

  // ---- Private helper methods ----

  private async getCarrierRates(
    carrier: string,
    origin: LocationDto,
    destination: LocationDto,
    weight: number,
    dimensions?: any,
  ): Promise<ShippingRate[]> {
    const key =
      this.carriersService.toRateServiceCode(carrier) ||
      carrier.toLowerCase().replace(/-/g, '_');

    switch (key) {
      case 'oman_post':
        return this.omanPostService.getRates(origin, destination, weight, dimensions);
      case 'aramex':
        return this.aramexService.getRates(origin, destination, weight, dimensions);
      case 'dhl':
        return this.dhlService.getRates(origin, destination, weight, dimensions);
      case 'fedex':
        return this.fedExService.getRates(origin, destination, weight, dimensions);
      case 'ups':
        return this.upsService.getRates(origin, destination, weight, dimensions);
      default:
        return [];
    }
  }

  private aggregateDimensions(orderItems: Array<{ weight: number; quantity: number; dimensions?: { length: number; width: number; height: number } }>): { length: number; width: number; height: number; unit: string } | undefined {
    if (orderItems.length === 0) return undefined;

    let totalLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const item of orderItems) {
      if (item.dimensions) {
        totalLength += item.dimensions.length * item.quantity;
        maxWidth = Math.max(maxWidth, item.dimensions.width);
        maxHeight = Math.max(maxHeight, item.dimensions.height);
      }
    }

    if (totalLength === 0) return undefined;

    return {
      length: Math.ceil(totalLength),
      width: Math.ceil(maxWidth),
      height: Math.ceil(maxHeight),
      unit: 'cm',
    };
  }

  private selectRecommended(rates: ShippingRate[], destinationCountry: string): ShippingRate | null {
    if (rates.length === 0) return null;
    if (rates.length === 1) return rates[0];

    // For Oman domestic, prefer Oman Post or Aramex
    if (destinationCountry === 'OM') {
      const domesticPreferred = rates.find((r) => r.carrier === 'oman_post' || r.carrier === 'aramex');
      if (domesticPreferred) return domesticPreferred;
    }

    // For GCC, prefer Aramex
    const gccCountries = ['OM', 'AE', 'SA', 'QA', 'BH', 'KW'];
    if (gccCountries.includes(destinationCountry)) {
      const gccPreferred = rates.find((r) => r.carrier === 'aramex');
      if (gccPreferred) return gccPreferred;
    }

    // Score-based selection: balance price and speed
    const cheapest = rates[0];
    const fastest = [...rates].sort((a, b) => a.estimatedDays - b.estimatedDays)[0];

    // If cheapest is not much slower than fastest, recommend cheapest
    if (cheapest.estimatedDays <= fastest.estimatedDays + 2) {
      return cheapest;
    }

    // If fastest is not much more expensive, recommend fastest
    if (fastest.totalAmount <= cheapest.totalAmount * 1.5) {
      return fastest;
    }

    // Otherwise recommend cheapest
    return cheapest;
  }

  private normalizeOmanCity(city: string): string | null {
    const normalized = city.trim().toLowerCase();
    const match = this.omanCities.find(
      (c) => c.toLowerCase() === normalized || c.toLowerCase().startsWith(normalized),
    );
    return match || null;
  }

  private findSimilarCities(input: string): string[] {
    const normalized = input.toLowerCase();
    return this.omanCities
      .filter((c) => c.toLowerCase().includes(normalized) || this.levenshteinDistance(c.toLowerCase(), normalized) <= 3)
      .slice(0, 5);
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }

  private normalizeOmanPhone(phone: string): string | null {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Check for Oman numbers
    if (digits.startsWith('968') && digits.length === 11) {
      return `+${digits}`;
    }
    if (digits.length === 8 && digits.startsWith('9') || digits.startsWith('7') || digits.startsWith('2')) {
      return `+968${digits}`;
    }
    return null;
  }
}
