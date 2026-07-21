import apiClient, { ApiResponse } from './api';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: {
    name: string;
    value: string;
  };
  storeId: string;
  storeName: string;
}

export interface ShippingAddress {
  id?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash_on_delivery';
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'card' | 'cash_on_delivery';
  cardToken?: string;
  couponCode?: string;
  notes?: string;
}

export interface OrderFilters {
  status?: Order['status'];
  page?: number;
  limit?: number;
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export const ordersService = {
  async getOrders(filters?: OrderFilters): Promise<ApiResponse<Order[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<ApiResponse<Order[]>>(
      `/orders?${params.toString()}`
    );
    return response.data;
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  async cancelOrder(
    id: string,
    reason?: string
  ): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/orders/${id}/cancel`,
      { reason }
    );
    return response.data;
  },

  async reorder(orderId: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/orders/${orderId}/reorder`
    );
    return response.data;
  },

  async getOrderTracking(orderId: string): Promise<ApiResponse<TrackingEvent[]>> {
    const response = await apiClient.get<ApiResponse<TrackingEvent[]>>(
      `/orders/${orderId}/tracking`
    );
    return response.data;
  },

  async getShippingAddresses(): Promise<ApiResponse<ShippingAddress[]>> {
    const response = await apiClient.get<ApiResponse<ShippingAddress[]>>(
      '/addresses'
    );
    return response.data;
  },

  async addShippingAddress(
    address: ShippingAddress
  ): Promise<ApiResponse<ShippingAddress>> {
    const response = await apiClient.post<ApiResponse<ShippingAddress>>(
      '/addresses',
      address
    );
    return response.data;
  },

  async updateShippingAddress(
    id: string,
    address: Partial<ShippingAddress>
  ): Promise<ApiResponse<ShippingAddress>> {
    const response = await apiClient.put<ApiResponse<ShippingAddress>>(
      `/addresses/${id}`,
      address
    );
    return response.data;
  },

  async deleteShippingAddress(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/addresses/${id}`);
    return response.data;
  },

  async setDefaultAddress(id: string): Promise<ApiResponse<ShippingAddress>> {
    const response = await apiClient.post<ApiResponse<ShippingAddress>>(
      `/addresses/${id}/default`
    );
    return response.data;
  },
};

export default ordersService;
