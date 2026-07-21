import apiClient, { ApiResponse } from './api';
import { CartItem } from '@store/cartStore';

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variant?: {
    name: string;
    value: string;
  };
}

export interface UpdateCartRequest {
  itemId: string;
  quantity: number;
}

export const cartService = {
  async getCart(): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.get<ApiResponse<CartResponse>>('/cart');
    return response.data;
  },

  async addToCart(data: AddToCartRequest): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.post<ApiResponse<CartResponse>>('/cart', data);
    return response.data;
  },

  async updateCartItem(data: UpdateCartRequest): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.put<ApiResponse<CartResponse>>(
      `/cart/${data.itemId}`,
      { quantity: data.quantity }
    );
    return response.data;
  },

  async removeFromCart(itemId: string): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.delete<ApiResponse<CartResponse>>(
      `/cart/${itemId}`
    );
    return response.data;
  },

  async clearCart(): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.delete<ApiResponse<CartResponse>>('/cart');
    return response.data;
  },

  async applyCoupon(code: string): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.post<ApiResponse<CartResponse>>(
      '/cart/coupon',
      { code }
    );
    return response.data;
  },

  async removeCoupon(): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.delete<ApiResponse<CartResponse>>(
      '/cart/coupon'
    );
    return response.data;
  },

  async syncCart(items: { productId: string; quantity: number }[]): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.post<ApiResponse<CartResponse>>('/cart/sync', {
      items,
    });
    return response.data;
  },

  async getCartCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/cart/count'
    );
    return response.data;
  },

  async moveToWishlist(itemId: string): Promise<ApiResponse<CartResponse>> {
    const response = await apiClient.post<ApiResponse<CartResponse>>(
      `/cart/${itemId}/move-to-wishlist`
    );
    return response.data;
  },
};

export default cartService;
