// =============================================================================
// BHD Oman Marketplace - Orders Service
// =============================================================================

import { api, buildQueryString } from './api';
import { isDemoMode } from '@/lib/demo-mode';
import { demoAdminOrders } from '@/lib/demo-admin-data';
import {
  Order,
  OrderFilters,
  PaginatedResponse,
  CreateOrderData,
  OrderStatusEvent,
} from '../types';

export type {
  Order,
  OrderFilters,
  CreateOrderData,
};
export type { OrderStatus } from '../types';
export type PaginatedOrders = PaginatedResponse<Order>;
export type OrderHistoryItem = OrderStatusEvent;

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface OrderResponse {
  order: Order;
  paymentUrl?: string; // for redirect-based payment gateways
}

export interface ReorderResponse {
  newOrderId: string;
  orderNumber: string;
}

export interface ReturnRequestData {
  orderId: string;
  itemIds: string[];
  reason: string;
  description?: string;
  images?: File[];
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  itemIds: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

// Admin types
export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  storeId: string;
  storeName: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    governorate: string;
    postalCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  recent?: boolean;
}

export interface PaginatedAdminOrders {
  orders: AdminOrder[];
  total: number;
}

export interface UpdateOrderStatusData {
  status: string;
  notes?: string;
}

function toAdminOrders(): AdminOrder[] {
  return demoAdminOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: 'cust-1',
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    storeId: 'store-1',
    storeName: o.storeName,
    items: [
      {
        id: `item-${o.id}`,
        productId: '1',
        productName: 'Ù…Ù†ØªØ¬ ØªØ¬Ø±ÙŠØ¨ÙŠ',
        quantity: o.itemsCount,
        price: o.total / o.itemsCount,
        total: o.total,
      },
    ],
    total: o.total,
    subtotal: o.total,
    shipping: 0,
    discount: 0,
    status: o.status,
    paymentStatus: 'paid',
    shippingAddress: {
      street: 'Ø´Ø§Ø±Ø¹ Ø§Ù„Ø³Ù„Ø·Ø§Ù† Ù‚Ø§Ø¨ÙˆØ³',
      city: 'Ù…Ø³Ù‚Ø·',
      governorate: 'Ù…Ø³Ù‚Ø·',
    },
    createdAt: o.createdAt,
    updatedAt: o.createdAt,
  }));
}

export async function getAdminOrders(
  filters?: AdminOrderFilters
): Promise<PaginatedAdminOrders> {
  if (isDemoMode()) {
    let orders = toAdminOrders();
    if (filters?.status && filters.status !== 'all') {
      orders = orders.filter((o) => o.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }
    const limit = filters?.limit || 10;
    const page = filters?.page || 1;
    const start = (page - 1) * limit;
    return { orders: orders.slice(start, start + limit), total: orders.length };
  }
  const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: PaginatedAdminOrders }>(
    `/admin/orders${query}`
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Order Endpoints
// ---------------------------------------------------------------------------

/**
 * Get a paginated list of the current user's orders.
 * @param filters - Order filter/sort/pagination options
 * @returns Paginated list of orders
 */
export async function getOrders(
  filters?: OrderFilters
): Promise<PaginatedResponse<Order>> {
  const raw = { ...(filters ?? {}) } as Record<string, unknown>;
  // Align FE filter names with Nest query params
  if (raw.store && !raw.storeId) {
    raw.storeId = raw.store;
    delete raw.store;
  }
  if (raw.perPage != null && raw.limit == null) {
    raw.limit = raw.perPage;
  }
  delete raw.perPage;

  const query = buildQueryString(raw);
  const response = await api.get<any>(`/orders${query}`);
  const body = response.data;
  // Backend returns { success, data: Order[], meta: { total, page, limit, totalPages } }
  const rows: Order[] = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.data?.data)
      ? body.data.data
      : [];
  const meta = body?.meta || body?.data?.meta || {};
  const page = Number(meta.page ?? meta.currentPage ?? filters?.page ?? 1);
  const limit = Number(meta.limit ?? meta.perPage ?? filters?.perPage ?? 10);
  const total = Number(meta.total ?? meta.totalCount ?? rows.length);
  const totalPages = Number(meta.totalPages ?? Math.max(1, Math.ceil(total / limit)));
  return {
    data: rows,
    meta: {
      currentPage: page,
      totalPages,
      totalCount: total,
      perPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get a single order by its ID.
 * @param id - Order UUID
 * @returns Order details with items
 */
export async function getOrder(id: string): Promise<Order> {
  const response = await api.get<{ success: boolean; data: Order }>(
    `/orders/${id}`
  );
  return response.data.data;
}

/**
 * Get an order by its order number (human-readable).
 * @param orderNumber - Order number (e.g. BHD-2024-000123)
 * @returns Order details
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  const response = await api.get<{ success: boolean; data: Order }>(
    `/orders/number/${orderNumber}`
  );
  return response.data.data;
}

/**
 * Create a new order from the current cart.
 * @param data - Order creation data (addresses, payment method, coupon, notes)
 * @returns Created order with optional payment redirect URL
 */
export async function createOrder(data: CreateOrderData): Promise<OrderResponse> {
  const response = await api.post<{ success: boolean; data: OrderResponse }>(
    '/orders',
    data
  );
  return response.data.data;
}

/**
 * Cancel an order (before it ships).
 * @param id - Order UUID
 * @param reason - Cancellation reason
 * @returns Updated order
 */
export async function cancelOrder(id: string, reason: string): Promise<Order> {
  const response = await api.post<{ success: boolean; data: Order }>(
    `/orders/${id}/cancel`,
    { reason }
  );
  return response.data.data;
}

/**
 * Get the status history/timeline for an order.
 * @param id - Order UUID
 * @returns Chronological list of status change events
 */
export async function getOrderHistory(id: string): Promise<OrderStatusEvent[]> {
  const response = await api.get<{ success: boolean; data: OrderStatusEvent[] }>(
    `/orders/${id}/history`
  );
  return response.data.data;
}

/**
 * Request a return/refund for delivered order items.
 * @param data - Return request data
 * @returns Created return request
 */
export async function requestReturn(data: ReturnRequestData): Promise<ReturnRequest> {
  // Handle file uploads
  if (data.images && data.images.length > 0) {
    const formData = new FormData();
    formData.append('orderId', data.orderId);
    formData.append('itemIds', JSON.stringify(data.itemIds));
    formData.append('reason', data.reason);
    if (data.description) formData.append('description', data.description);
    data.images.forEach((img) => formData.append('images', img));

    const response = await api.post<{ success: boolean; data: ReturnRequest }>(
      '/orders/returns',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  }

  const response = await api.post<{ success: boolean; data: ReturnRequest }>(
    '/orders/returns',
    data
  );
  return response.data.data;
}

/**
 * Get return requests for an order.
 * @param orderId - Order UUID
 * @returns List of return requests
 */
export async function getReturnRequests(orderId: string): Promise<ReturnRequest[]> {
  const response = await api.get<{ success: boolean; data: ReturnRequest[] }>(
    `/orders/${orderId}/returns`
  );
  return response.data.data;
}

/**
 * Reorder items from a previous order.
 * @param orderId - Order UUID to reorder from
 * @returns New order details
 */
export async function reorder(orderId: string): Promise<ReorderResponse> {
  const response = await api.post<{ success: boolean; data: ReorderResponse }>(
    `/orders/${orderId}/reorder`
  );
  return response.data.data;
}

/**
 * Download order invoice as PDF.
 * @param orderId - Order UUID
 * @returns Blob URL for the PDF
 */
export async function downloadInvoice(orderId: string): Promise<Blob> {
  const response = await api.get<Blob>(`/orders/${orderId}/invoice`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Confirm receipt of an order (mark as received).
 * @param orderId - Order UUID
 * @returns Updated order
 */
export async function confirmReceipt(orderId: string): Promise<Order> {
  const response = await api.post<{ success: boolean; data: Order }>(
    `/orders/${orderId}/confirm-receipt`
  );
  return response.data.data;
}

/**
 * Get order statistics for the current user.
 * @returns Summary of order counts by status
 */
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  toReview: number;
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      total: number;
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
      toReview: number;
    };
  }>('/orders/stats');
  return response.data.data;
}

export const ordersService = {
  getOrders,
  getOrder,
  getOrderByNumber,
  createOrder,
  cancelOrder,
  getOrderHistory,
  requestReturn,
  getReturnRequests,
  reorder,
  downloadInvoice,
  confirmReceipt,
  getOrderStats,
  getAdminOrders,
  updateOrderStatus: async (
    orderId: string,
    data: UpdateOrderStatusData,
  ): Promise<AdminOrder> => ({
    id: orderId,
    orderNumber: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    storeId: '',
    storeName: '',
    items: [],
    total: 0,
    subtotal: 0,
    shipping: 0,
    discount: 0,
    status: data.status,
    paymentStatus: '',
    shippingAddress: {
      street: '',
      city: '',
      governorate: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
};
