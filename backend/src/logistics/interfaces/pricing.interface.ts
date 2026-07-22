import { ServiceType } from '../enums/logistics.enum';

export interface PricingQuoteRequest {
  senderZoneId: string;
  recipientZoneId: string;
  weightKg: number;
  serviceType: ServiceType;
  declaredValue?: number;
}

export interface PricingQuoteResult {
  serviceType: ServiceType;
  total: number;
  currency: string;
  estimatedHours?: number;
  estimatedDelivery?: Date;
  available: boolean;
}
