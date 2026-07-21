/**
 * B2B API Service
 * Handles all HTTP communication with the B2B backend API.
 * All methods require an API key to be set via setApiKey().
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// In-memory API key storage (in production, use httpOnly cookies or secure storage)
let currentApiKey: string | null = null;

/**
 * Set the API key for subsequent requests
 */
export function setApiKey(key: string): void {
  currentApiKey = key;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bhd_b2b_api_key', key);
  }
}

/**
 * Get the current API key
 */
export function getApiKey(): string | null {
  if (currentApiKey) return currentApiKey;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bhd_b2b_api_key');
  }
  return null;
}

/**
 * Remove the API key (logout)
 */
export function clearApiKey(): void {
  currentApiKey = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bhd_b2b_api_key');
  }
}

/**
 * Build request headers with API key
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = getApiKey();
  if (key) {
    headers['X-API-Key'] = key;
  }
  return headers;
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

// ────────────────────────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────────────────────────

/**
 * Login with API key - validates the key by fetching account info
 */
export async function login(apiKey: string): Promise<{
  success: boolean;
  customer: {
    companyName: string;
    creditLimit: number;
    creditUsed: number;
  };
}> {
  // Temporarily set the key to make the account request
  setApiKey(apiKey);
  try {
    const result = await getAccount();
    return { success: true, customer: result.data };
  } catch {
    clearApiKey();
    throw new Error('Invalid API key. Please check and try again.');
  }
}

// ────────────────────────────────────────────────────────────────
// Shipments
// ────────────────────────────────────────────────────────────────

export interface ShipmentFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  referenceNumber?: string;
  page?: number;
  limit?: number;
}

export interface Shipment {
  id: number;
  customerId: number;
  trackingNumber: string;
  referenceNumber: string | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  receiverDistrict: string;
  receiverWard: string;
  packageType: string;
  weight: number;
  dimensions: string | null;
  serviceType: string;
  codAmount: number;
  declaredValue: number;
  shippingFee: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  notes: string | null;
}

/**
 * Get paginated list of shipments with filters
 */
export async function getShipments(filters: ShipmentFilters = {}): Promise<{
  success: boolean;
  data: Shipment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);
  if (filters.referenceNumber) params.set('reference', filters.referenceNumber);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/b2b/shipments${query}`);
}

export interface CreateShipmentData {
  referenceNumber?: string;
  sender: {
    name: string;
    phone: string;
    address: string;
    province?: string;
    district?: string;
    ward?: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    province?: string;
    district?: string;
    ward?: string;
  };
  package: {
    type: 'document' | 'parcel' | 'fragile' | 'heavy' | 'pallet';
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    declaredValue?: number;
    description?: string;
  };
  serviceType: 'standard' | 'express' | 'same_day' | 'overnight';
  codAmount?: number;
  notes?: string;
  pickupDate?: string;
}

/**
 * Create a new shipment
 */
export async function createShipment(data: CreateShipmentData): Promise<{
  success: boolean;
  data: Shipment;
  message: string;
}> {
  return apiRequest('/b2b/shipments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Track a shipment by tracking number or ID (public, no auth required)
 */
export async function trackShipment(trackingNumber: string): Promise<{
  success: boolean;
  data: {
    trackingNumber: string;
    referenceNumber: string | null;
    status: string;
    statusLabel: string;
    receiver: { name: string; address: string };
    timeline: Array<{
      status: string;
      label: string;
      time: string;
      location: string;
    }>;
    estimatedDelivery: string | null;
  };
}> {
  // Tracking is public, no API key needed
  const response = await fetch(
    `${API_BASE_URL}/b2b/shipments/${trackingNumber}/tracking`,
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Tracking not found',
    }));
    throw new Error(error.message || 'Tracking not found');
  }
  return response.json();
}

/**
 * Create bulk shipments
 */
export async function createBulkShipments(
  shipments: CreateShipmentData[],
): Promise<{
  success: boolean;
  data: Array<{ success: boolean; trackingNumber?: string; error?: string }>;
  message: string;
}> {
  return apiRequest('/b2b/bulk-shipments', {
    method: 'POST',
    body: JSON.stringify(shipments),
  });
}

// ────────────────────────────────────────────────────────────────
// Account
// ────────────────────────────────────────────────────────────────

export interface AccountInfo {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  totalShipments: number;
  apiCallCount: number;
  apiCallLimit: number;
  webhookUrl: string | null;
}

/**
 * Get account information
 */
export async function getAccount(): Promise<{
  success: boolean;
  data: AccountInfo;
}> {
  return apiRequest('/b2b/account');
}

// ────────────────────────────────────────────────────────────────
// Billing
// ────────────────────────────────────────────────────────────────

export interface BillingStatement {
  id: number;
  customerId: number;
  period: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  dueDate: string;
  invoiceNumber: string;
  shipmentCount: number;
}

/**
 * Get billing statements
 */
export async function getBilling(period?: string): Promise<{
  success: boolean;
  data: BillingStatement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const params = period ? `?period=${period}` : '';
  return apiRequest(`/b2b/statements${params}`);
}

/**
 * Download a statement
 */
export async function downloadStatement(statementId: number): Promise<{
  success: boolean;
  data: { downloadUrl: string };
}> {
  return apiRequest(`/b2b/statements/${statementId}/download`);
}

// ────────────────────────────────────────────────────────────────
// Settings
// ────────────────────────────────────────────────────────────────

export interface B2bSettings {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  webhookUrl: string | null;
  notificationPreferences: {
    emailOnDelivery: boolean;
    emailOnException: boolean;
    smsOnDelivery: boolean;
    webhookOnStatusChange: boolean;
  };
  contactPersons: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
  }>;
}

/**
 * Get B2B settings (uses account endpoint as base)
 */
export async function getSettings(): Promise<{
  success: boolean;
  data: B2bSettings;
}> {
  // Combine account data with settings
  const account = await getAccount();
  const mockSettings: B2bSettings = {
    companyName: account.data.companyName,
    contactEmail: account.data.contactEmail,
    contactPhone: account.data.contactPhone,
    address: account.data.address,
    webhookUrl: account.data.webhookUrl,
    notificationPreferences: {
      emailOnDelivery: true,
      emailOnException: true,
      smsOnDelivery: false,
      webhookOnStatusChange: true,
    },
    contactPersons: [
      {
        name: 'Primary Contact',
        email: account.data.contactEmail,
        phone: account.data.contactPhone,
        role: 'admin',
      },
    ],
  };
  return { success: true, data: mockSettings };
}

/**
 * Update B2B settings
 */
export async function updateSettings(
  data: Partial<B2bSettings>,
): Promise<{
  success: boolean;
  message: string;
}> {
  // In production, this would call a PATCH endpoint
  return { success: true, message: 'Settings updated successfully' };
}

/**
 * Configure webhook
 */
export async function configureWebhook(
  webhookUrl: string,
  events: string[],
): Promise<{
  success: boolean;
  data: { webhookUrl: string; events: string[]; secret: string };
  message: string;
}> {
  return apiRequest('/b2b/webhook/configure', {
    method: 'POST',
    body: JSON.stringify({ webhookUrl, events }),
  });
}

// ────────────────────────────────────────────────────────────────
// Pricing Calculator (Client-side)
// ────────────────────────────────────────────────────────────────

export interface PricingInput {
  serviceType: 'standard' | 'express' | 'same_day' | 'overnight';
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  codAmount?: number;
  declaredValue?: number;
  packageType: string;
}

export interface PricingResult {
  baseRate: number;
  weightFee: number;
  codFee: number;
  insuranceFee: number;
  packageTypeFee: number;
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
  estimatedDeliveryDays: number;
}

/**
 * Calculate shipping price (client-side estimate)
 */
export function calculatePrice(input: PricingInput): PricingResult {
  const baseRates: Record<string, number> = {
    standard: 15000,
    express: 30000,
    same_day: 50000,
    overnight: 45000,
  };

  const packageTypeFees: Record<string, number> = {
    document: 0,
    parcel: 5000,
    fragile: 15000,
    heavy: 20000,
    pallet: 50000,
  };

  const deliveryDays: Record<string, number> = {
    standard: 3,
    express: 1,
    same_day: 0,
    overnight: 1,
  };

  const baseRate = baseRates[input.serviceType] || baseRates.standard;
  const weightFee = Math.ceil(input.weight / 0.5) * 5000;
  const codFee = input.codAmount ? Math.min(input.codAmount * 0.01, 50000) : 0;
  const insuranceFee = input.declaredValue
    ? Math.min(input.declaredValue * 0.005, 100000)
    : 0;
  const packageTypeFee = packageTypeFees[input.packageType] || 0;

  const subtotal = baseRate + weightFee + codFee + insuranceFee + packageTypeFee;
  const vat = Math.round(subtotal * 0.08); // 8% VAT
  const total = subtotal + vat;

  return {
    baseRate,
    weightFee,
    codFee,
    insuranceFee,
    packageTypeFee,
    subtotal,
    vat,
    total,
    currency: 'VND',
    estimatedDeliveryDays: deliveryDays[input.serviceType] || 3,
  };
}
