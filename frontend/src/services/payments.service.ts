// =============================================================================
// BHD Oman Marketplace - Payments Service
// =============================================================================

import { api, buildQueryString } from './api';
import {
  Payment,
  ProcessPaymentData,
  PaymentGateway,
  Refund,
  PaginatedResponse,
} from '../types';

export type {
  Payment,
  ProcessPaymentData,
  PaymentGateway,
  Refund,
};
export type RefundData = Refund;
export type PaginatedPayments = PaginatedResponse<Payment>;
export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
}

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface PaymentInitResponse {
  payment: Payment;
  checkoutUrl?: string; // For redirect-based gateways (e.g., Thawani, CBPay)
  clientSecret?: string; // For Stripe-like gateways
}

export interface PaymentVerificationResponse {
  verified: boolean;
  payment: Payment;
}

export interface SavedCard {
  id: string;
  brand: string;
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export interface AdminPayment {
  id: string;
  transactionId?: string;
  orderId?: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface AdminPaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
}

export interface PaginatedAdminPayments {
  data: AdminPayment[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Payment Endpoints
// ---------------------------------------------------------------------------

/**
 * Process a payment for an order.
 * Supports both direct card token processing and redirect-based gateways.
 * @param data - Payment processing data (orderId, method, gateway, cardToken)
 * @returns Payment record with optional redirect URL for 3D-secure / external gateways
 */
export async function processPayment(data: ProcessPaymentData): Promise<PaymentInitResponse> {
  const response = await api.post<{ success: boolean; data: PaymentInitResponse }>(
    '/payments/process',
    data
  );
  return response.data.data;
}

/**
 * Verify a payment status after external gateway redirect (e.g., Thawani).
 * @param paymentId - Payment UUID
 * @returns Verification result with updated payment status
 */
export async function verifyPayment(paymentId: string): Promise<PaymentVerificationResponse> {
  const response = await api.get<{
    success: boolean;
    data: PaymentVerificationResponse;
  }>(`/payments/${paymentId}/verify`);
  return response.data.data;
}

/**
 * Get payment history for the current user.
 * @param page - Page number (default 1)
 * @param perPage - Items per page (default 10)
 * @returns Paginated list of payments
 */
export async function getPaymentHistory(
  page = 1,
  perPage = 10
): Promise<PaginatedResponse<Payment>> {
  const query = buildQueryString({ page, perPage });
  const response = await api.get<{
    success: boolean;
    data: PaginatedResponse<Payment>;
  }>(`/payments${query}`);
  return response.data.data;
}

/**
 * Get detailed information about a specific payment.
 * @param paymentId - Payment UUID
 * @returns Payment details
 */
export async function getPaymentDetails(paymentId: string): Promise<Payment> {
  const response = await api.get<{ success: boolean; data: Payment }>(
    `/payments/${paymentId}`
  );
  return response.data.data;
}

/**
 * Create a refund request for a payment.
 * @param paymentId - Payment UUID
 * @param amount - Amount to refund (can be partial)
 * @param reason - Reason for refund
 * @returns Created refund record
 */
export async function createRefund(
  paymentId: string,
  amount: number,
  reason: string
): Promise<Refund> {
  const response = await api.post<{ success: boolean; data: Refund }>(
    `/payments/${paymentId}/refunds`,
    { amount, reason }
  );
  return response.data.data;
}

/**
 * Get available payment gateways for the current context.
 * @returns List of active payment gateways
 */
export async function getGateways(): Promise<PaymentGateway[]> {
  const response = await api.get<{
    success: boolean;
    data: Array<{
      id?: string;
      code: string;
      name: string;
      isActive?: boolean;
      isConfigured?: boolean;
      displayOrder?: number;
      supportedMethods?: string[];
    }>;
  }>('/payments/gateways');

  return (response.data.data || [])
    .filter((g) => g.isActive !== false && (g.isConfigured !== false || g.code === 'cod' || g.code === 'cash_on_delivery'))
    .map((g) => ({
      id: g.id || g.code,
      name: g.name,
      code: g.code === 'cash_on_delivery' ? 'cod' : g.code,
      isActive: true,
      supportsRefund: false,
      supportsSaveCard: false,
      supportedMethods: (g.supportedMethods || []) as PaymentGateway['supportedMethods'],
      sortOrder: g.displayOrder ?? 0,
    }));
}

export const getPaymentGateways = getGateways;

export interface AdminPaymentGateway {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isConfigured: boolean;
  isSandbox?: boolean;
  displayOrder?: number;
  missingKeys?: string[];
  supportedMethods?: string[];
  supportedCurrencies?: string[];
}

/** Admin: all gateways with env configuration status */
export async function getAdminGateways(): Promise<AdminPaymentGateway[]> {
  const response = await api.get<{ success: boolean; data: AdminPaymentGateway[] }>(
    '/admin/payments/gateways'
  );
  return response.data.data;
}

/** Admin: enable or disable a payment gateway */
export async function setAdminGatewayActive(
  idOrCode: string,
  isActive: boolean
): Promise<AdminPaymentGateway> {
  const response = await api.patch<{
    success: boolean;
    data: AdminPaymentGateway;
  }>(`/admin/payments/gateways/${encodeURIComponent(idOrCode)}`, { isActive });
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Saved Cards
// ---------------------------------------------------------------------------

/**
 * Get saved cards for the current user.
 * @returns List of saved payment cards
 */
export async function getSavedCards(): Promise<SavedCard[]> {
  const response = await api.get<{ success: boolean; data: SavedCard[] }>(
    '/payments/cards'
  );
  return response.data.data;
}

/**
 * Delete a saved card.
 * @param cardId - Saved card ID
 * @returns Success confirmation
 */
export async function deleteSavedCard(cardId: string): Promise<{ message: string }> {
  const response = await api.delete<{ success: boolean; data: { message: string } }>(
    `/payments/cards/${cardId}`
  );
  return response.data.data;
}

/**
 * Set a saved card as the default.
 * @param cardId - Saved card ID
 * @returns Updated card list
 */
export async function setDefaultCard(cardId: string): Promise<SavedCard[]> {
  const response = await api.patch<{ success: boolean; data: SavedCard[] }>(
    `/payments/cards/${cardId}/default`
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Oman-Specific Payment Methods
// ---------------------------------------------------------------------------

/**
 * Initiate a Thawani payment session.
 * @param orderId - Order UUID
 * @param returnUrl - URL to redirect after payment
 * @returns Thawani checkout URL and session ID
 */
export async function createThawaniSession(
  orderId: string,
  returnUrl: string
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const response = await api.post<{
    success: boolean;
    data: { checkoutUrl: string; sessionId: string };
  }>('/payments/thawani/session', { orderId, returnUrl });
  return response.data.data;
}

/**
 * Initiate a CB (Central Bank of Oman) payment session.
 * @param orderId - Order UUID
 * @param returnUrl - URL to redirect after payment
 * @returns CB Pay checkout URL and transaction reference
 */
export async function createCBPaymentSession(
  orderId: string,
  returnUrl: string
): Promise<{ checkoutUrl: string; transactionRef: string }> {
  const response = await api.post<{
    success: boolean;
    data: { checkoutUrl: string; transactionRef: string };
  }>('/payments/cb/session', { orderId, returnUrl });
  return response.data.data;
}

/**
 * Verify a Thawani payment after redirect.
 * @param sessionId - Thawani session ID
 * @returns Payment verification result
 */
export async function verifyThawaniPayment(
  sessionId: string
): Promise<PaymentVerificationResponse> {
  const response = await api.get<{
    success: boolean;
    data: PaymentVerificationResponse;
  }>(`/payments/thawani/verify`, { params: { sessionId } });
  return response.data.data;
}

/**
 * Verify a CB payment after redirect.
 * @param transactionRef - CB transaction reference
 * @returns Payment verification result
 */
export async function verifyCBPayment(
  transactionRef: string
): Promise<PaymentVerificationResponse> {
  const response = await api.get<{
    success: boolean;
    data: PaymentVerificationResponse;
  }>(`/payments/cb/verify`, { params: { transactionRef } });
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

/**
 * Get the current user's wallet balance.
 * @returns Wallet balance and currency
 */
export async function getWalletBalance(): Promise<{
  balance: number;
  currency: string;
  heldBalance: number;
}> {
  const response = await api.get<{
    success: boolean;
    data: { balance: number; currency: string; heldBalance: number };
  }>('/payments/wallet/balance');
  return response.data.data;
}

/**
 * Get wallet transaction history.
 * @param page - Page number
 * @param perPage - Items per page
 * @returns Paginated list of wallet transactions
 */
export async function getWalletTransactions(
  page = 1,
  perPage = 10
): Promise<
  PaginatedResponse<{
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    currency: string;
    description: string;
    createdAt: string;
  }>
> {
  const query = buildQueryString({ page, perPage });
  const response = await api.get<{
    success: boolean;
    data: PaginatedResponse<{
      id: string;
      type: 'credit' | 'debit';
      amount: number;
      currency: string;
      description: string;
      createdAt: string;
    }>;
  }>(`/payments/wallet/transactions${query}`);
  return response.data.data;
}

export const paymentsService = {
  processPayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  createRefund,
  getGateways,
  getPaymentGateways: getGateways,
  getAdminGateways,
  setAdminGatewayActive,
  getSavedCards,
  deleteSavedCard,
  setDefaultCard,
  createThawaniSession,
  createCBPaymentSession,
  verifyThawaniPayment,
  verifyCBPayment,
  getWalletBalance,
  getWalletTransactions,
  getAdminPayments: async (
    filters: AdminPaymentFilters = {},
  ): Promise<PaginatedAdminPayments> => {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const history = await getPaymentHistory(page, limit);
    return {
      data: history.data.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        amount: p.amount,
        status: String(p.status),
        paymentMethod: p.method,
        createdAt: p.createdAt,
      })),
      meta: {
        page: history.meta.currentPage,
        limit: history.meta.perPage,
        total: history.meta.totalCount,
        totalPages: history.meta.totalPages,
      },
    };
  },
};
