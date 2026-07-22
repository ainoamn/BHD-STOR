// =============================================================================
// BHD Oman Marketplace - Wishlist Service
// =============================================================================

import { api } from './api';
import { Product } from '../types';

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
  product?: Product;
}

export interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
}

function toWishlist(products: Product[]): Wishlist {
  return {
    items: products.map((p) => ({
      id: p.id,
      productId: p.id,
      name: p.name,
      price: p.price,
      image: p.images?.[0]?.url ?? '',
      addedAt: p.createdAt ?? new Date().toISOString(),
      product: p,
    })),
    totalItems: products.length,
  };
}

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface WishlistToggleResponse {
  inWishlist: boolean;
}

// ---------------------------------------------------------------------------
// Wishlist Endpoints
// ---------------------------------------------------------------------------

/**
 * Get the current user's wishlist items.
 * @returns List of wishlisted products
 */
export async function getWishlist(): Promise<Product[]> {
  const response = await api.get<{ success: boolean; data: Product[] }>('/wishlist');
  return response.data.data;
}

/**
 * Add a product to the wishlist.
 * @param productId - Product UUID
 * @returns Updated wishlist
 */
export async function addToWishlist(productId: string): Promise<Product[]> {
  const response = await api.post<{ success: boolean; data: Product[] }>('/wishlist', {
    productId,
  });
  return response.data.data;
}

/**
 * Remove a product from the wishlist.
 * @param productId - Product UUID
 * @returns Updated wishlist
 */
export async function removeFromWishlist(productId: string): Promise<Product[]> {
  const response = await api.delete<{ success: boolean; data: Product[] }>(
    `/wishlist/${productId}`
  );
  return response.data.data;
}

/**
 * Check if a product is in the current user's wishlist.
 * @param productId - Product UUID
 * @returns true if product is wishlisted
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  const response = await api.get<{ success: boolean; data: { inWishlist: boolean } }>(
    `/wishlist/${productId}/check`
  );
  return response.data.data.inWishlist;
}

/**
 * Toggle a product's presence in the wishlist.
 * @param productId - Product UUID
 * @returns Object with the new wishlist status
 */
export async function toggleWishlist(
  productId: string
): Promise<WishlistToggleResponse> {
  const response = await api.post<{ success: boolean; data: WishlistToggleResponse }>(
    `/wishlist/toggle`,
    { productId }
  );
  return response.data.data;
}

/**
 * Move a wishlist item to the cart.
 * @param productId - Product UUID
 * @param variantId - Optional variant ID
 * @returns Success message
 */
export async function moveToCart(
  productId: string,
  variantId?: string
): Promise<{ message: string }> {
  const response = await api.post<{ success: boolean; data: { message: string } }>(
    '/wishlist/move-to-cart',
    { productId, variantId }
  );
  return response.data.data;
}

/**
 * Clear all items from the wishlist.
 * @returns Empty confirmation
 */
export async function clearWishlist(): Promise<{ message: string }> {
  const response = await api.delete<{ success: boolean; data: { message: string } }>(
    '/wishlist'
  );
  return response.data.data;
}

export const wishlistService = {
  getWishlist: async () => toWishlist(await getWishlist()),
  addToWishlist: async (productId: string) => toWishlist(await addToWishlist(productId)),
  removeFromWishlist: async (productId: string) => toWishlist(await removeFromWishlist(productId)),
  isInWishlist,
  toggleWishlist,
  moveToCart,
  clearWishlist,
};
