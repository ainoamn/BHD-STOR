// =============================================================================
// BHD Oman Marketplace - Wishlist Service (aligned with Nest wishlist routes)
// =============================================================================

import { api } from './api';
import { addToCart } from './cart.service';
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

export interface WishlistToggleResponse {
  inWishlist: boolean;
}

function productName(product: any): string {
  return (
    product?.nameAr ||
    product?.nameEn ||
    product?.name ||
    product?.title ||
    'Product'
  );
}

function productImage(product: any): string {
  const img = product?.images?.[0];
  if (typeof img === 'string') return img;
  return img?.url || product?.thumbnail || product?.image || '';
}

function mapEntry(entry: any): WishlistItem {
  const product = entry?.product || entry;
  const productId = entry?.productId || product?.id || '';
  return {
    id: entry?.id || productId,
    productId,
    name: productName(product),
    price: Number(product?.salePrice ?? product?.price ?? 0),
    image: productImage(product),
    addedAt:
      entry?.addedAt ||
      entry?.createdAt ||
      product?.createdAt ||
      new Date().toISOString(),
    product,
  };
}

function normalizeWishlist(payload: any): Wishlist {
  if (!payload) return { items: [], totalItems: 0 };

  if (Array.isArray(payload?.items)) {
    const items = payload.items.map(mapEntry);
    return {
      items,
      totalItems: Number(payload.count ?? payload.totalItems ?? items.length),
    };
  }

  if (Array.isArray(payload)) {
    const items = payload.map(mapEntry);
    return { items, totalItems: items.length };
  }

  if (payload?.productId || payload?.product) {
    const item = mapEntry(payload);
    return { items: [item], totalItems: 1 };
  }

  return { items: [], totalItems: 0 };
}

export async function getWishlist(): Promise<Wishlist> {
  const response = await api.get<{ success: boolean; data: any }>('/wishlist');
  return normalizeWishlist(response.data.data);
}

export async function addToWishlist(productId: string): Promise<Wishlist> {
  await api.post(`/wishlist/${productId}`);
  return getWishlist();
}

export async function removeFromWishlist(productId: string): Promise<Wishlist> {
  await api.delete(`/wishlist/${productId}`);
  return getWishlist();
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const response = await api.get<{ success: boolean; data: { inWishlist: boolean } }>(
    `/wishlist/check/${productId}`,
  );
  return Boolean(response.data.data?.inWishlist);
}

export async function toggleWishlist(
  productId: string,
): Promise<WishlistToggleResponse> {
  const response = await api.post<{
    success: boolean;
    data: WishlistToggleResponse;
  }>(`/wishlist/toggle/${productId}`);
  return {
    inWishlist: Boolean(response.data.data?.inWishlist),
  };
}

/** No dedicated BE endpoint — add to cart then remove from wishlist. */
export async function moveToCart(
  productId: string,
  variantId?: string,
): Promise<{ message: string }> {
  await addToCart({
    productId,
    quantity: 1,
    ...(variantId ? { variantId } : {}),
  });
  try {
    await api.delete(`/wishlist/${productId}`);
  } catch {
    // cart add succeeded; wishlist cleanup is best-effort
  }
  return { message: 'Moved to cart' };
}

export async function clearWishlist(): Promise<{ message: string }> {
  await api.delete('/wishlist');
  return { message: 'Wishlist cleared' };
}

export const wishlistService = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  toggleWishlist,
  moveToCart,
  clearWishlist,
};
