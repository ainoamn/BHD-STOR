import { apiClient } from '@/lib/api-client';
import { isDemoMode } from '@/lib/demo-mode';
import { demoReturns } from '@/lib/demo-admin-data';

export enum ReturnType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DAMAGED = 'damaged',
  OTHER = 'other',
}

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKED_UP = 'picked_up',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  EXCHANGED = 'exchanged',
  CLOSED = 'closed',
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = 'original_payment',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export interface PickupAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  postalCode?: string;
  landmark?: string;
}

export interface TimelineEvent {
  status: ReturnStatus;
  note: string;
  timestamp: string;
  actor?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  type: ReturnType;
  reason: ReturnReason;
  description: string;
  status: ReturnStatus;
  images: string[];
  refundAmount: number;
  refundMethod: RefundMethod;
  exchangeProductId: string | null;
  exchangeVariant: string | null;
  pickupAddress: PickupAddress | null;
  pickupDate: string | null;
  trackingNumber: string | null;
  adminNotes: string | null;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnData {
  orderId: string;
  productId: string;
  type: ReturnType;
  reason: ReturnReason;
  description: string;
  images?: string[];
  refundMethod?: RefundMethod;
  exchangeProductId?: string;
  exchangeVariant?: string;
  pickupAddress?: PickupAddress;
}

export interface ReturnPolicy {
  id: string;
  storeId: string;
  returnWindow: number;
  exchangeWindow: number;
  conditions: string[];
  nonReturnableCategories: string[];
  restockingFee: number;
  autoApprove: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnsQuery {
  status?: ReturnStatus;
  page?: number;
  limit?: number;
}

function filterDemoReturns(query?: ReturnsQuery): { items: ReturnRequest[]; total: number } {
  let items = [...demoReturns];
  if (query?.status) {
    items = items.filter((r) => r.status === query.status);
  }
  return { items, total: items.length };
}

export const returnsService = {
  create: async (data: CreateReturnData): Promise<ReturnRequest> => {
    if (isDemoMode()) {
      return {
        id: `ret-${Date.now()}`,
        orderId: data.orderId,
        userId: 'demo-user-1',
        productId: data.productId,
        type: data.type,
        reason: data.reason,
        description: data.description,
        status: ReturnStatus.PENDING,
        images: data.images || [],
        refundAmount: 0,
        refundMethod: data.refundMethod || RefundMethod.ORIGINAL_PAYMENT,
        exchangeProductId: data.exchangeProductId || null,
        exchangeVariant: data.exchangeVariant || null,
        pickupAddress: data.pickupAddress || null,
        pickupDate: null,
        trackingNumber: null,
        adminNotes: null,
        timeline: [{ status: ReturnStatus.PENDING, note: 'تم تقديم الطلب', timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const res = await apiClient.post<ReturnRequest>('/returns', data);
    return res.data;
  },

  getAll: async (query?: ReturnsQuery): Promise<{ items: ReturnRequest[]; total: number }> => {
    if (isDemoMode()) return filterDemoReturns(query);
    try {
      const res = await apiClient.get<{ items: ReturnRequest[]; total: number }>('/returns', { params: query });
      return res.data;
    } catch {
      return filterDemoReturns(query);
    }
  },

  getAllAdmin: async (query?: ReturnsQuery): Promise<{ items: ReturnRequest[]; total: number }> => {
    if (isDemoMode()) return filterDemoReturns(query);
    try {
      const res = await apiClient.get<{ items: ReturnRequest[]; total: number }>(
        '/returns/admin/all',
        { params: query }
      );
      return res.data;
    } catch {
      return filterDemoReturns(query);
    }
  },

  getById: async (id: string): Promise<ReturnRequest> => {
    if (isDemoMode()) {
      const found = demoReturns.find((r) => r.id === id);
      if (found) return found;
      throw new Error('Return not found');
    }
    const res = await apiClient.get<ReturnRequest>(`/returns/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateReturnData>): Promise<ReturnRequest> => {
    const res = await apiClient.put<ReturnRequest>(`/returns/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: ReturnStatus, notes?: string): Promise<ReturnRequest> => {
    const res = await apiClient.patch<ReturnRequest>(`/returns/${id}/status`, { status, notes });
    return res.data;
  },

  approve: async (id: string, refundAmount?: number): Promise<ReturnRequest> => {
    const res = await apiClient.post<ReturnRequest>(`/returns/${id}/approve`, { refundAmount });
    return res.data;
  },

  reject: async (id: string, reason: string): Promise<ReturnRequest> => {
    const res = await apiClient.post<ReturnRequest>(`/returns/${id}/reject`, { reason });
    return res.data;
  },

  schedulePickup: async (id: string, date: string, driverId?: string): Promise<ReturnRequest> => {
    const res = await apiClient.post<ReturnRequest>(`/returns/${id}/schedule-pickup`, {
      date,
      driverId,
    });
    return res.data;
  },

  processRefund: async (id: string): Promise<ReturnRequest> => {
    const res = await apiClient.post<ReturnRequest>(`/returns/${id}/process-refund`);
    return res.data;
  },

  processExchange: async (id: string): Promise<ReturnRequest> => {
    const res = await apiClient.post<ReturnRequest>(`/returns/${id}/process-exchange`);
    return res.data;
  },

  markReceived: async (id: string): Promise<ReturnRequest> => {
    const res = await apiClient.post<ReturnRequest>(`/returns/${id}/mark-received`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/returns/${id}`);
  },

  getPolicy: async (storeId: string): Promise<ReturnPolicy> => {
    const res = await apiClient.get<ReturnPolicy>(`/returns/policy/${storeId}`);
    return res.data;
  },

  updatePolicy: async (storeId: string, data: Partial<ReturnPolicy>): Promise<ReturnPolicy> => {
    const res = await apiClient.put<ReturnPolicy>(`/returns/policy/${storeId}`, data);
    return res.data;
  },

  checkEligibility: async (
    orderId: string,
    productId: string,
  ): Promise<{
    eligible: boolean;
    reason?: string;
  }> => {
    const res = await apiClient.post<{ eligible: boolean; reason?: string }>(
      '/returns/check-eligibility',
      { orderId, productId },
    );
    return res.data;
  },
};
