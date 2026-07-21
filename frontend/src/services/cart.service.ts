// =============================================================================
// BHD Oman Marketplace - Cart Service
// =============================================================================

import { api, buildQueryString } from './api';
import {
  Cart,
  AddToCartData,
  CartTotals,
} from '../types';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface ApplyCouponResponse {
  cart: Cart;
  coupon: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
  };
}

export interface MoveToWishlistResponse {
  cart: Cart;
  message: string;
}

// ---------------------------------------------------------------------------
// Cart Endpoints
// ---------------------------------------------------------------------------

/**
 * Get the current user's cart (or guest cart via session).
 * @returns Current cart with items and totals
 */
export async function getCart(): Promise<Cart> {
  const response = await api.get<{ success: boolean; data: Cart }>('/cart');
  return response.data.data;
}

/**
 * Add an item to the cart.
 * @param data - Product ID, optional variant ID, and quantity
 * @returns Updated cart
 */
export async function addToCart(data: AddToCartData): Promise<Cart> {
  const response = await api.post<{ success: boolean; data: Cart }>('/cart/items', data);
  return response.data.data;
}

/**
 * Update the quantity of a cart item.
 * @param itemId - Cart item UUID
 * @param quantity - New quantity (0 to remove)
 * @returns Updated cart
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<Cart> {
  if (quantity <= 0) {
    return removeFromCart(itemId);
  }

  const response = await api.patch<{ success: boolean; data: Cart }>(
    `/cart/items/${itemId}`,
    { quantity }
  );
  return response.data.data;
}

/**
 * Remove an item from the cart.
 * @param itemId - Cart item UUID
 * @returns Updated cart
 */
export async function removeFromCart(itemId: string): Promise<Cart> {
  const response = await api.delete<{ success: boolean; data: Cart }>(
    `/cart/items/${itemId}`
  );
  return response.data.data;
}

/**
 * Clear all items from the cart.
 * @returns Empty cart
 */
export async function clearCart(): Promise<Cart> {
  const response = await api.delete<{ success: boolean; data: Cart }>('/cart');
  return response.data.data;
}

/**
 * Apply a coupon code to the cart.
 * @param code - Coupon/promo code
 * @returns Updated cart with coupon applied
 */
export async function applyCoupon(code: string): Promise<Cart> {
  const response = await api.post<{ success: boolean; data: ApplyCouponResponse }>(
    '/cart/coupon',
    { code }
  );
  return response.data.data.cart;
}

/**
 * Remove the applied coupon from the cart.
 * @returns Updated cart with coupon removed
 */
export async function removeCoupon(): Promise<Cart> {
  const response = await api.delete<{ success: boolean; data: Cart }>('/cart/coupon');
  return response.data.data;
}

/**
 * Get cart totals summary (subtotal, discounts, tax, shipping, grand total).
 * @returns Cart totals breakdown
 */
export async function getCartTotals(): Promise<CartTotals> {
  const response = await api.get<{ success: boolean; data: CartTotals }>(
    '/cart/totals'
  );
  return response.data.data;
}

/**
 * Merge a guest cart into the authenticated user's cart (after login).
 * @param sessionId - Guest cart session ID
 * @returns Merged cart
 */
export async function mergeCart(sessionId: string): Promise<Cart> {
  const response = await api.post<{ success: boolean; data: Cart }>('/cart/merge', {
    sessionId,
  });
  return response.data.data;
}

/**
 * Move a cart item to the wishlist.
 * @param itemId - Cart item UUID
 * @returns Updated cart and success message
 */
export async function moveToWishlist(itemId: string): Promise<MoveToWishlistResponse> {
  const response = await api.post<{ success: boolean; data: MoveToWishlistResponse }>(
    `/cart/items/${itemId}/move-to-wishlist`
  );
  return response.data.data;
}

/**
 * Sync cart state with the server (used for optimistic UI updates).
 * @param items - Array of { productId, variantId?, quantity }
 * @returns Synced cart from server
 */
export async function syncCart(
  items: Array<{ productId: string; variantId?: string; quantity: number }>
): Promise<Cart> {
  const response = await api.post<{ success: boolean; data: Cart }>('/cart/sync', {
    items,
  });
  return response.data.data;
}

/**
 * Validate the cart (check stock, prices, coupon validity).
 * @returns Validation result with any issues
 */
export async function validateCart(): Promise<{
  valid: boolean;
  issues: Array<{
    type: 'stock' | 'price' | 'coupon' | 'shipping';
    itemId?: string;
    message: string;
  }>;
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      valid: boolean;
      issues: Array<{
        type: 'stock' | 'price' | 'coupon' | 'shipping';
        itemId?: string;
        message: string;
      }>;
    };
  }>('/cart/validate');
  return response.data.data;
}

/**
 * Get available shipping options for the current cart.
 * @param addressId - Shipping address ID
 * @returns List of shipping methods with costs
 */
export async function getCartShippingOptions(
  addressId: string
): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    cost: number;
    currency: string;
    estimatedDays: number;
    carrier: string;
  }>
> {
  const response = await api.get<{
    success: boolean;
    data: Array<{
      id: string;
      name: string;
      description?: string;
      cost: number;
      currency: string;
      estimatedDays: number;
      carrier: string;
    }>;
  }>('/cart/shipping-options', { params: { addressId } });
  return response.data.data;
}

/**
 * Select a shipping method for the cart.
 * @param shippingMethodId - Shipping method ID
 * @returns Updated cart with selected shipping
 */
export async function selectShippingMethod(shippingMethodId: string): Promise<Cart> {
  const response = await api.post<{ success: boolean; data: Cart }>(
    '/cart/shipping',
    { shippingMethodId }
  );
  return response.data.data;
}

export const cartService = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartTotals,
  mergeCart,
  moveToWishlist,
  syncCart,
  validateCart,
  getCartShippingOptions,
  selectShippingMethod,
};
