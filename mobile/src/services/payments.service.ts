import apiClient, { ApiResponse } from './api';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
}

export const paymentsService = {
  async createPaymentIntent(
    orderId: string
  ): Promise<ApiResponse<PaymentIntent>> {
    const response = await apiClient.post<ApiResponse<PaymentIntent>>(
      '/payments/create-intent',
      { orderId }
    );
    return response.data;
  },

  async confirmPayment(
    paymentIntentId: string
  ): Promise<ApiResponse<{ status: string }>> {
    const response = await apiClient.post<ApiResponse<{ status: string }>>(
      '/payments/confirm',
      { paymentIntentId }
    );
    return response.data;
  },

  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const response = await apiClient.get<ApiResponse<PaymentMethod[]>>(
      '/payments/methods'
    );
    return response.data;
  },

  async addPaymentMethod(
    paymentMethodId: string
  ): Promise<ApiResponse<PaymentMethod>> {
    const response = await apiClient.post<ApiResponse<PaymentMethod>>(
      '/payments/methods',
      { paymentMethodId }
    );
    return response.data;
  },

  async removePaymentMethod(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/payments/methods/${id}`
    );
    return response.data;
  },

  async setDefaultPaymentMethod(
    id: string
  ): Promise<ApiResponse<PaymentMethod>> {
    const response = await apiClient.post<ApiResponse<PaymentMethod>>(
      `/payments/methods/${id}/default`
    );
    return response.data;
  },

  async processRefund(
    orderId: string,
    reason: string
  ): Promise<ApiResponse<{ refundId: string; status: string }>> {
    const response = await apiClient.post<
      ApiResponse<{ refundId: string; status: string }>
    >(`/payments/refund`, { orderId, reason });
    return response.data;
  },

  async validateCoupon(code: string): Promise<ApiResponse<{
    valid: boolean;
    discount: number;
    type: 'percentage' | 'fixed';
    message?: string;
  }>> {
    const response = await apiClient.get<ApiResponse<{
      valid: boolean;
      discount: number;
      type: 'percentage' | 'fixed';
      message?: string;
    }>>(`/coupons/validate?code=${encodeURIComponent(code)}`);
    return response.data;
  },
};

export default paymentsService;
