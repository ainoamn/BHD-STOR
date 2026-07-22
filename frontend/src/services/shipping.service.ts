// =============================================================================
// BHD Oman Marketplace - Shipping Service
// =============================================================================

import { api } from './api';
import {
  ShippingRate,
  RateRequest,
  Shipment,
  TrackingResult,
  Carrier,
  Address,
} from '../types';

export type {
  ShippingRate,
  RateRequest as ShippingRateRequest,
  Shipment,
  TrackingResult as TrackingInfo,
  Carrier,
  Address,
};

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface CreateShipmentData {
  orderId: string;
  carrier: string;
  service: string;
  origin: Address;
  destination: Address;
  weight: number;
  weightUnit: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  insuranceAmount?: number;
  declaredValue?: number;
  contentsDescription?: string;
}

export interface ShippingAddressValidation {
  valid: boolean;
  normalizedAddress?: Address;
  suggestions?: string[];
  issues?: string[];
}

export interface PickupScheduleRequest {
  shipmentId: string;
  pickupDate: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  instructions?: string;
}

// ---------------------------------------------------------------------------
// Shipping Endpoints
// ---------------------------------------------------------------------------

/**
 * Calculate shipping rates for a given origin/destination/weight.
 * @param data - Rate request parameters (origin, destination, weight, items)
 * @returns List of available shipping rates from carriers
 */
export async function calculateRates(data: RateRequest): Promise<ShippingRate[]> {
  const response = await api.post<{ success: boolean; data: ShippingRate[] }>(
    '/shipping/rates',
    data
  );
  return response.data.data;
}

/**
 * Create a shipment (label generation).
 * @param data - Shipment creation data
 * @returns Created shipment with tracking number and label URL
 */
export async function createShipment(data: CreateShipmentData): Promise<Shipment> {
  const response = await api.post<{ success: boolean; data: Shipment }>(
    '/shipping/shipments',
    data
  );
  return response.data.data;
}

/**
 * Track a shipment by tracking number and carrier.
 * @param trackingNumber - Carrier tracking number
 * @param carrier - Carrier code (e.g., 'aramex', 'dhl', 'fetchr')
 * @returns Current tracking status and event history
 */
export async function trackShipment(
  trackingNumber: string,
  carrier: string
): Promise<TrackingResult> {
  const response = await api.get<{ success: boolean; data: TrackingResult }>(
    '/shipping/track',
    {
      params: { trackingNumber, carrier },
    }
  );
  return response.data.data;
}

/**
 * Get all active shipping carriers.
 * @returns List of available carriers and their services
 */
export async function getCarriers(): Promise<Carrier[]> {
  const response = await api.get<{
    success: boolean;
    data?: Array<{
      id?: string;
      code: string;
      name: string;
      nameAr?: string | null;
      isActive?: boolean;
      supportsCod?: boolean;
      logo?: string;
    }>;
    carriers?: Array<{ id: string; name: string; logo?: string }>;
  }>('/shipping/carriers');

  const rows =
    response.data.data ||
    (response.data.carriers || []).map((c) => ({
      id: c.id,
      code: c.id,
      name: c.name,
      logo: c.logo,
      isActive: true,
    }));

  return rows.map((c) => ({
    id: c.id || c.code,
    name: c.name,
    code: c.code,
    logo: c.logo,
    isActive: c.isActive !== false,
    supportedServices: [],
  }));
}

/** Alias used by useShippingRates */
export async function getShippingRates(data: RateRequest): Promise<ShippingRate[]> {
  return calculateRates(data);
}

/**
 * Validate a shipping address.
 * @param address - Address to validate
 * @returns Validation result with suggestions if address is ambiguous
 */
export async function validateAddress(
  address: Address
): Promise<ShippingAddressValidation> {
  const response = await api.post<{
    success: boolean;
    data: ShippingAddressValidation;
  }>('/shipping/validate-address', address);
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Oman-Specific Shipping
// ---------------------------------------------------------------------------

/**
 * Get Oman governorate (wilayat) list for address selection.
 * @returns List of Omani governorates and their wilayats
 */
export async function getOmanGovernorates(): Promise<
  Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    wilayats: Array<{
      id: string;
      nameEn: string;
      nameAr: string;
      postalCodes?: string[];
    }>;
  }>
> {
  const response = await api.get<{
    success: boolean;
    data: Array<{
      id: string;
      nameEn: string;
      nameAr: string;
      wilayats: Array<{
        id: string;
        nameEn: string;
        nameAr: string;
        postalCodes?: string[];
      }>;
    }>;
  }>('/shipping/oman/governorates');
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Shipment Management
// ---------------------------------------------------------------------------

/**
 * Get shipments for a specific order.
 * @param orderId - Order UUID
 * @returns List of shipments for the order
 */
export async function getOrderShipments(orderId: string): Promise<Shipment[]> {
  const response = await api.get<{ success: boolean; data: Shipment[] }>(
    `/orders/${orderId}/shipments`
  );
  return response.data.data;
}

/**
 * Get a single shipment by ID.
 * @param shipmentId - Shipment UUID
 * @returns Shipment details with tracking events
 */
export async function getShipment(shipmentId: string): Promise<Shipment> {
  const response = await api.get<{ success: boolean; data: Shipment }>(
    `/shipping/shipments/${shipmentId}`
  );
  return response.data.data;
}

/**
 * Schedule a pickup for a shipment (vendor only).
 * @param data - Pickup scheduling details
 * @returns Confirmation with pickup reference
 */
export async function schedulePickup(
  data: PickupScheduleRequest
): Promise<{ pickupRef: string; scheduledDate: string }> {
  const response = await api.post<{
    success: boolean;
    data: { pickupRef: string; scheduledDate: string };
  }>('/shipping/pickups', data);
  return response.data.data;
}

/**
 * Download shipment label as PDF.
 * @param shipmentId - Shipment UUID
 * @returns PDF blob
 */
export async function downloadLabel(shipmentId: string): Promise<Blob> {
  const response = await api.get<Blob>(
    `/shipping/shipments/${shipmentId}/label`,
    { responseType: 'blob' }
  );
  return response.data;
}

/**
 * Get estimated delivery date for a shipment.
 * @param carrier - Carrier code
 * @param service - Service code
 * @param originPostalCode - Origin postal code
 * @param destinationPostalCode - Destination postal code
 * @returns Estimated delivery date in ISO format
 */
export async function getEstimatedDelivery(
  carrier: string,
  service: string,
  originPostalCode: string,
  destinationPostalCode: string
): Promise<{ estimatedDate: string; days: number }> {
  const response = await api.get<{
    success: boolean;
    data: { estimatedDate: string; days: number };
  }>('/shipping/estimate-delivery', {
    params: { carrier, service, originPostalCode, destinationPostalCode },
  });
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Admin carriers
// ---------------------------------------------------------------------------

export interface AdminShippingCarrier {
  id: string;
  name: string;
  nameAr?: string | null;
  code: string;
  isActive: boolean;
  supportsCod?: boolean;
  displayOrder?: number;
  trackingUrlTemplate?: string | null;
  apiEndpoint?: string | null;
}

export async function getAdminCarriers(): Promise<AdminShippingCarrier[]> {
  const response = await api.get<{ success: boolean; data: AdminShippingCarrier[] }>(
    '/admin/shipping/carriers'
  );
  return response.data.data;
}

export async function setAdminCarrierActive(
  idOrCode: string,
  isActive: boolean
): Promise<AdminShippingCarrier> {
  const response = await api.patch<{
    success: boolean;
    data: AdminShippingCarrier;
  }>(`/admin/shipping/carriers/${encodeURIComponent(idOrCode)}`, { isActive });
  return response.data.data;
}

export const shippingService = {
  calculateRates,
  getShippingRates,
  createShipment,
  getShipment,
  trackShipment,
  getCarriers,
  validateAddress,
  schedulePickup,
  downloadLabel,
  getEstimatedDelivery,
  getAdminCarriers,
  setAdminCarrierActive,
};
