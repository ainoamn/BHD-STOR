/**
 * Tracking Service
 * ================
 * Frontend service for logistics tracking API calls:
 * - trackOrder(orderId): Get tracking info for authenticated order
 * - trackByNumber(trackingNumber): Public tracking
 * - getDeliveryEstimate(address, weight): Get estimated delivery
 * - getCoverageZones(): Get list of covered zones
 * - validateAddress(address): Check if address is in coverage zone
 */

import { TrackingInfo, TrackingTimelineEvent } from '../hooks/useOrderTracking';

// ─── Configuration ──────────────────────────────────────────

const API_BASE_URL = process.env.REACT_APP_API_URL ?? '/api';

// ─── Types ──────────────────────────────────────────────────

export interface TrackingServiceConfig {
  baseUrl: string;
  timeoutMs: number;
  retries: number;
}

export interface DeliveryEstimateRequest {
  senderZoneId: string;
  recipientZoneId: string;
  weightKg: number;
  dimensionsCm?: { length: number; width: number; height: number };
  serviceType?: string;
  declaredValue?: number;
  isFragile?: boolean;
  isInsured?: boolean;
}

export interface DeliveryEstimate {
  serviceType: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  basePrice: number;
  weightCharge: number;
  distanceCharge: number;
  fuelSurcharge: number;
  insuranceCharge: number;
  fragileCharge: number;
  vatAmount: number;
  total: number;
  currency: string;
  estimatedHours: number;
  estimatedDelivery: string;
  available: boolean;
  unavailableReason?: string;
}

export interface CoverageZone {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  centerLat: number;
  centerLng: number;
  sameDayAvailable: boolean;
}

export interface AddressValidationResult {
  valid: boolean;
  zoneId: string | null;
  zoneName: string | null;
  covered: boolean;
  suggestions?: string[];
  normalizedAddress?: string;
}

export interface TrackingSearchResult {
  trackingNumber: string;
  status: string;
  estimatedDelivery: string | null;
  recipientName: string;
  statusLabelAr: string;
  statusLabelEn: string;
}

// ─── HTTP Helper ────────────────────────────────────────────

async function http<T>(
  endpoint: string,
  options?: RequestInit,
  config?: Partial<TrackingServiceConfig>,
): Promise<T> {
  const baseUrl = config?.baseUrl ?? API_BASE_URL;
  const timeoutMs = config?.timeoutMs ?? 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new TrackingError(
        errorBody.message ?? `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorBody.code,
      );
    }

    // Handle empty responses
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new TrackingError('Request timed out', 408, 'TIMEOUT');
    }
    throw err;
  }
}

// ─── Custom Error Class ─────────────────────────────────────

export class TrackingError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'TrackingError';
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isTimeout(): boolean {
    return this.statusCode === 408 || this.code === 'TIMEOUT';
  }
}

// ─── Service Implementation ─────────────────────────────────

class TrackingService {
  private config: TrackingServiceConfig;

  constructor(config?: Partial<TrackingServiceConfig>) {
    this.config = {
      baseUrl: API_BASE_URL,
      timeoutMs: 30000,
      retries: 2,
      ...config,
    };
  }

  /**
   * Set auth token for authenticated requests
   */
  setAuthToken(token: string | null): void {
    if (token) {
      (this as any)._authToken = token;
    } else {
      delete (this as any)._authToken;
    }
  }

  /**
   * Get headers with auth if available
   */
  private headers(): Record<string, string> {
    const token = (this as any)._authToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ═══════════════════════════════════════════════
  // TRACKING QUERIES
  // ═══════════════════════════════════════════════

  /**
   * Get tracking info for a marketplace order (authenticated)
   */
  async trackOrder(orderId: string): Promise<TrackingInfo> {
    return http<TrackingInfo>(
      `/logistics/tracking/order/${orderId}`,
      { headers: this.headers() },
      this.config,
    );
  }

  /**
   * Public tracking by tracking number (no auth required)
   */
  async trackByNumber(trackingNumber: string): Promise<TrackingInfo> {
    return http<TrackingInfo>(
      `/logistics/tracking/${encodeURIComponent(trackingNumber)}`,
      { method: 'GET' },
      this.config,
    );
  }

  /**
   * Get detailed timeline for a shipment
   */
  async getShipmentTimeline(shipmentId: string): Promise<TrackingTimelineEvent[]> {
    return http<TrackingTimelineEvent[]>(
      `/logistics/shipments/${shipmentId}/timeline`,
      { headers: this.headers() },
      this.config,
    );
  }

  // ═══════════════════════════════════════════════
  // DELIVERY ESTIMATES
  // ═══════════════════════════════════════════════

  /**
   * Get delivery estimate for given parameters
   */
  async getDeliveryEstimate(req: DeliveryEstimateRequest): Promise<DeliveryEstimate> {
    return http<DeliveryEstimate>(
      '/logistics/quotes/estimate',
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(req),
      },
      this.config,
    );
  }

  /**
   * Get multiple delivery quotes (all service types)
   */
  async getDeliveryQuotes(req: DeliveryEstimateRequest): Promise<DeliveryEstimate[]> {
    return http<DeliveryEstimate[]>(
      '/logistics/quotes',
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(req),
      },
      this.config,
    );
  }

  // ═══════════════════════════════════════════════
  // COVERAGE & VALIDATION
  // ═══════════════════════════════════════════════

  /**
   * Get list of all covered delivery zones
   */
  async getCoverageZones(): Promise<CoverageZone[]> {
    return http<CoverageZone[]>('/logistics/zones', { method: 'GET' }, this.config);
  }

  /**
   * Validate if an address is within coverage zone
   */
  async validateAddress(address: string): Promise<AddressValidationResult> {
    return http<AddressValidationResult>(
      '/logistics/zones/validate',
      {
        method: 'POST',
        body: JSON.stringify({ address }),
      },
      this.config,
    );
  }

  /**
   * Search for tracking by partial number or phone
   */
  async searchTracking(query: string): Promise<TrackingSearchResult[]> {
    return http<TrackingSearchResult[]>(
      `/logistics/tracking/search?q=${encodeURIComponent(query)}`,
      { method: 'GET' },
      this.config,
    );
  }

  // ═══════════════════════════════════════════════
  // DRIVER TRACKING
  // ═══════════════════════════════════════════════

  /**
   * Get current driver location for a shipment
   */
  async getDriverLocation(shipmentId: string): Promise<{
    lat: number;
    lng: number;
    lastUpdated: string;
  } | null> {
    try {
      return await http<{ lat: number; lng: number; lastUpdated: string }>(
        `/logistics/shipments/${shipmentId}/driver-location`,
        { headers: this.headers() },
        this.config,
      );
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════
  // BATCH OPERATIONS
  // ═══════════════════════════════════════════════

  /**
   * Track multiple orders at once
   */
  async trackMultipleOrders(orderIds: string[]): Promise<TrackingInfo[]> {
    return http<TrackingInfo[]>(
      '/logistics/tracking/batch',
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ orderIds }),
      },
      this.config,
    );
  }
}

// ─── Singleton Export ───────────────────────────────────────

export const trackingService = new TrackingService();

// Allow runtime configuration
export function configureTrackingService(config: Partial<TrackingServiceConfig>): TrackingService {
  return new TrackingService(config);
}

export default trackingService;
