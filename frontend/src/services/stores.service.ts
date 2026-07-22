// =============================================================================
// BHD Oman Marketplace - Stores Service
// =============================================================================

import { api, buildQueryString, uploadFile } from './api';
import { isDemoMode } from '@/lib/demo-mode';
import { demoAdminStores, demoPendingStores } from '@/lib/demo-admin-data';
import {
  Store,
  StoreFilters,
  PaginatedResponse,
  Product,
  ProductFilters,
  CreateStoreData,
  UpdateStoreData,
} from '../types';

export type {
  Store,
  StoreFilters,
  Product,
  CreateStoreData,
  UpdateStoreData,
};
export type PaginatedStores = PaginatedResponse<Store>;

// ---------------------------------------------------------------------------
// Store Endpoints
// ---------------------------------------------------------------------------

/**
 * Get a paginated list of stores with optional filters.
 * @param filters - Store filter/sort/pagination options
 * @returns Paginated list of stores
 */
export async function getStores(
  filters?: StoreFilters
): Promise<PaginatedResponse<Store>> {
  const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Store> }>(
    `/stores${query}`
  );
  return response.data.data;
}

/**
 * Get a single store by its ID.
 * @param id - Store UUID
 * @returns Store details
 */
export async function getStore(id: string): Promise<Store> {
  const response = await api.get<{ success: boolean; data: Store }>(
    `/stores/${id}`
  );
  return response.data.data;
}

/**
 * Get a single store by its URL slug.
 * @param slug - Store URL slug
 * @returns Store details
 */
export async function getStoreBySlug(slug: string): Promise<Store> {
  const response = await api.get<{ success: boolean; data: Store }>(
    `/stores/slug/${slug}`
  );
  return response.data.data;
}

/**
 * Get products belonging to a specific store.
 * @param storeId - Store UUID
 * @param filters - Additional product filters (pagination, sort, etc.)
 * @returns Paginated list of store products
 */
export async function getStoreProducts(
  storeId: string,
  filters?: Omit<ProductFilters, 'store'>
): Promise<PaginatedResponse<Product>> {
  const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>(
    `/stores/${storeId}/products${query}`
  );
  return response.data.data;
}

/**
 * Create a new store (vendor registration).
 * @param data - Store creation data
 * @returns The newly created Store
 */
export async function createStore(data: CreateStoreData): Promise<Store> {
  // If logo or banner are File objects, use multipart upload
  const hasFiles = data.logo instanceof File || data.banner instanceof File;

  if (hasFiles) {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.slug) formData.append('slug', data.slug);
    if (data.description) formData.append('description', data.description);
    if (data.logo instanceof File) formData.append('logo', data.logo);
    if (data.banner instanceof File) formData.append('banner', data.banner);
    if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
    if (data.contactPhone) formData.append('contactPhone', data.contactPhone);
    if (data.address) formData.append('address', JSON.stringify(data.address));
    if (data.socialLinks) formData.append('socialLinks', JSON.stringify(data.socialLinks));
    if (data.businessHours) formData.append('businessHours', JSON.stringify(data.businessHours));
    if (data.returnPolicy) formData.append('returnPolicy', data.returnPolicy);
    if (data.shippingPolicy) formData.append('shippingPolicy', data.shippingPolicy);

    const response = await api.post<{ success: boolean; data: Store }>(
      '/stores',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  }

  const response = await api.post<{ success: boolean; data: Store }>('/stores', data);
  return response.data.data;
}

/**
 * Update an existing store.
 * @param id - Store UUID
 * @param data - Partial store data to update
 * @returns The updated Store
 */
export async function updateStore(id: string, data: UpdateStoreData): Promise<Store> {
  const hasFiles = data.logo instanceof File || data.banner instanceof File;

  if (hasFiles) {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.slug) formData.append('slug', data.slug);
    if (data.description) formData.append('description', data.description);
    if (data.logo instanceof File) formData.append('logo', data.logo);
    if (data.banner instanceof File) formData.append('banner', data.banner);
    if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
    if (data.contactPhone) formData.append('contactPhone', data.contactPhone);
    if (data.address) formData.append('address', JSON.stringify(data.address));
    if (data.socialLinks) formData.append('socialLinks', JSON.stringify(data.socialLinks));
    if (data.businessHours) formData.append('businessHours', JSON.stringify(data.businessHours));
    if (data.returnPolicy) formData.append('returnPolicy', data.returnPolicy);
    if (data.shippingPolicy) formData.append('shippingPolicy', data.shippingPolicy);
    if (data.status) formData.append('status', data.status);

    const response = await api.patch<{ success: boolean; data: Store }>(
      `/stores/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  }

  const response = await api.patch<{ success: boolean; data: Store }>(
    `/stores/${id}`,
    data
  );
  return response.data.data;
}

/**
 * Follow or unfollow a store.
 * @param id - Store UUID
 * @returns Object indicating new follow status
 */
export async function followStore(id: string): Promise<{ following: boolean; followersCount: number }> {
  const response = await api.post<{ success: boolean; data: { following: boolean; followersCount?: number } }>(
    `/stores/${id}/follow`
  );
  return {
    following: response.data.data.following,
    followersCount: response.data.data.followersCount ?? 0,
  };
}

/**
 * Get a list of featured stores.
 * @returns List of featured stores
 */
export async function getFeaturedStores(): Promise<Store[]> {
  const response = await api.get<{ success: boolean; data: Store[] }>(
    '/stores/featured'
  );
  return response.data.data;
}

/**
 * Get store analytics (vendor-only).
 * @param id - Store UUID
 * @param period - Period string, e.g. '7d', '30d', '90d', '1y'
 * @returns Store analytics data
 */
export async function getStoreAnalytics(
  id: string,
  period: string
): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  conversionRate: number;
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      totalRevenue: number;
      totalOrders: number;
      totalProducts: number;
      totalCustomers: number;
      conversionRate: number;
    };
  }>(`/stores/${id}/analytics`, { params: { period } });
  return response.data.data;
}

/**
 * Check if the current user follows a store.
 * @param id - Store UUID
 * @returns Whether the user follows the store
 */
export async function isFollowingStore(id: string): Promise<boolean> {
  const response = await api.get<{ success: boolean; data: { following: boolean } }>(
    `/stores/${id}/following`
  );
  return response.data.data.following;
}

/**
 * Get stores followed by the current user.
 * @returns List of followed stores
 */
export async function getFollowedStores(): Promise<Store[]> {
  const response = await api.get<{ success: boolean; data: Store[] }>(
    '/stores/followed'
  );
  return response.data.data;
}

// Admin types
export interface AdminStore {
  id: string;
  name: string;
  description?: string;
  ownerName: string;
  ownerEmail: string;
  category: string;
  address?: string;
  phone?: string;
  verificationStatus: string;
  logo?: string;
  createdAt: string;
  productsCount: number;
  ordersCount: number;
}

export interface AdminStoreFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedAdminStores {
  stores: AdminStore[];
  total: number;
}

function toAdminStores(status?: string): AdminStore[] {
  const source =
    status === 'pending'
      ? demoPendingStores
      : status
        ? demoAdminStores.filter((s) => s.status === status)
        : demoAdminStores;

  return source.map((s) => ({
    id: s.id,
    name: s.nameAr || s.name,
    description: s.nameAr,
    ownerName: s.ownerName,
    ownerEmail: s.ownerEmail,
    category: 'Ø¹Ø§Ù…',
    verificationStatus: s.status === 'pending' ? 'pending' : 'verified',
    createdAt: s.createdAt,
    productsCount: s.productsCount,
    ordersCount: Math.floor(s.revenue / 50),
  }));
}

export async function getAdminStores(
  filters?: AdminStoreFilters
): Promise<PaginatedAdminStores> {
  if (isDemoMode()) {
    let stores = toAdminStores(filters?.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      stores = stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q)
      );
    }
    const limit = filters?.limit || 10;
    const page = filters?.page || 1;
    const start = (page - 1) * limit;
    return { stores: stores.slice(start, start + limit), total: stores.length };
  }
  const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: PaginatedAdminStores }>(
    `/admin/stores${query}`
  );
  return response.data.data;
}

export const storesService = {
  getStores,
  getStoreById: getStore,
  getStoreBySlug,
  getStoreProducts,
  createStore,
  updateStore,
  followStore,
  getFeaturedStores,
  getStoreAnalytics,
  isFollowingStore,
  getAdminStores,
  verifyStore: async (
    storeId: string,
    verified: boolean,
    _notes?: string,
  ): Promise<AdminStore> => ({
    id: storeId,
    name: '',
    ownerName: '',
    ownerEmail: '',
    category: '',
    verificationStatus: verified ? 'verified' : 'pending',
    createdAt: new Date().toISOString(),
    productsCount: 0,
    ordersCount: 0,
  }),
  getFollowedStores,
};
