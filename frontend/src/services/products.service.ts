// =============================================================================
// BHD Oman Marketplace - Products Service
// =============================================================================

import { api, buildQueryString, uploadFile } from './api';
import { isDemoMode } from '@/lib/demo-mode';
import { demoAdminProducts } from '@/lib/demo-admin-data';
import {
  Product,
  ProductFilters,
  PaginatedResponse,
  Category,
  Review,
  CreateReviewData,
} from '../types';

// ---------------------------------------------------------------------------
// Additional local types
// ---------------------------------------------------------------------------

export interface SearchSuggestion {
  type: 'product' | 'category' | 'store';
  id: string;
  name: string;
  image?: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Product Endpoints
// ---------------------------------------------------------------------------

/**
 * Get a paginated list of products with optional filters.
 * @param filters - Product filter/sort/pagination options
 * @returns Paginated list of products
 */
export async function getProducts(
  filters?: ProductFilters
): Promise<PaginatedResponse<Product>> {
  const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>(
    `/products${query}`
  );
  return response.data.data;
}

/**
 * Get a single product by its ID.
 * @param id - Product UUID
 * @returns Product details
 */
export async function getProduct(id: string): Promise<Product> {
  const response = await api.get<{ success: boolean; data: Product }>(
    `/products/${id}`
  );
  return response.data.data;
}

/**
 * Get a single product by its URL slug.
 * @param slug - Product URL slug
 * @returns Product details
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  const response = await api.get<{ success: boolean; data: Product }>(
    `/products/slug/${slug}`
  );
  return response.data.data;
}

/**
 * Search products by query string with optional filters.
 * @param query - Search query text
 * @param filters - Additional filters to apply
 * @returns Paginated list of matching products
 */
export async function searchProducts(
  query: string,
  filters?: ProductFilters
): Promise<PaginatedResponse<Product>> {
  const params: Record<string, unknown> = { search: query, ...(filters ?? {}) };
  const qs = buildQueryString(params);
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>(
    `/products/search${qs}`
  );
  return response.data.data;
}

/**
 * Get featured products for homepage/display.
 * @returns List of featured products
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  const response = await api.get<{ success: boolean; data: Product[] }>(
    '/products/featured'
  );
  return response.data.data;
}

/**
 * Get trending products based on sales/views.
 * @returns List of trending products
 */
export async function getTrendingProducts(): Promise<Product[]> {
  const response = await api.get<{ success: boolean; data: Product[] }>(
    '/products/trending'
  );
  return response.data.data;
}

/**
 * Get products by category ID.
 * @param categoryId - Category UUID
 * @param filters - Additional pagination/sort options
 * @returns Paginated list of products in the category
 */
export async function getProductsByCategory(
  categoryId: string,
  filters?: Omit<ProductFilters, 'category'>
): Promise<PaginatedResponse<Product>> {
  const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>(
    `/categories/${categoryId}/products${query}`
  );
  return response.data.data;
}

/**
 * Get products by store ID.
 * @param storeId - Store UUID
 * @param filters - Additional pagination/sort options
 * @returns Paginated list of products from the store
 */
export async function getProductsByStore(
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
 * Get related/similar products for a given product.
 * @param productId - Product UUID
 * @param limit - Maximum number of results (default 8)
 * @returns List of related products
 */
export async function getRelatedProducts(
  productId: string,
  limit = 8
): Promise<Product[]> {
  const response = await api.get<{ success: boolean; data: Product[] }>(
    `/products/${productId}/related`,
    { params: { limit } }
  );
  return response.data.data;
}

/**
 * Get product suggestions for autocomplete/search-as-you-type.
 * @param query - Partial search text
 * @param limit - Maximum suggestions (default 10)
 * @returns List of search suggestions
 */
export async function getProductSuggestions(
  query: string,
  limit = 10
): Promise<SearchSuggestion[]> {
  const response = await api.get<{ success: boolean; data: SearchSuggestion[] }>(
    '/products/suggestions',
    { params: { q: query, limit } }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Category Endpoints
// ---------------------------------------------------------------------------

/**
 * Get all active categories (flat list).
 * @returns List of categories
 */
export async function getCategories(): Promise<Category[]> {
  const response = await api.get<{ success: boolean; data: Category[] }>(
    '/categories'
  );
  return response.data.data;
}

/**
 * Get category tree (hierarchical structure with children).
 * @returns List of root categories with nested children
 */
export async function getCategoryTree(): Promise<Category[]> {
  const response = await api.get<{ success: boolean; data: Category[] }>(
    '/categories/tree'
  );
  return response.data.data;
}

/**
 * Get a single category by its URL slug.
 * @param slug - Category URL slug
 * @returns Category details with children
 */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  const response = await api.get<{ success: boolean; data: Category }>(
    `/categories/slug/${slug}`
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Review Endpoints
// ---------------------------------------------------------------------------

/**
 * Get reviews for a product.
 * @param productId - Product UUID
 * @param page - Page number (default 1)
 * @param perPage - Items per page (default 10)
 * @returns Paginated list of reviews
 */
export async function getReviews(
  productId: string,
  page = 1,
  perPage = 10
): Promise<PaginatedResponse<Review>> {
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Review> }>(
    `/products/${productId}/reviews`,
    { params: { page, perPage } }
  );
  return response.data.data;
}

/**
 * Create a new review for a product.
 * @param productId - Product UUID
 * @param data - Review data (rating, comment, etc.)
 * @returns The created review
 */
export async function createReview(
  productId: string,
  data: CreateReviewData
): Promise<Review> {
  // Handle image uploads via multipart/form-data
  if (data.images && data.images.length > 0) {
    const formData = new FormData();
    formData.append('rating', String(data.rating));
    if (data.title) formData.append('title', data.title);
    formData.append('comment', data.comment);
    if (data.orderId) formData.append('orderId', data.orderId);
    data.images.forEach((file) => formData.append('images', file));

    const response = await api.post<{ success: boolean; data: Review }>(
      `/products/${productId}/reviews`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  }

  const response = await api.post<{ success: boolean; data: Review }>(
    `/products/${productId}/reviews`,
    data
  );
  return response.data.data;
}

/**
 * Mark a review as helpful.
 * @param reviewId - Review UUID
 * @returns Updated review
 */
export async function markReviewHelpful(reviewId: string): Promise<Review> {
  const response = await api.post<{ success: boolean; data: Review }>(
    `/reviews/${reviewId}/helpful`
  );
  return response.data.data;
}

/**
 * Get review summary (average rating, distribution) for a product.
 * @param productId - Product UUID
 * @returns Rating summary object
 */
export async function getReviewSummary(productId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}> {
  const response = await api.get<{
    success: boolean;
    data: {
      averageRating: number;
      totalReviews: number;
      distribution: Record<number, number>;
    };
  }>(`/products/${productId}/reviews/summary`);
  return response.data.data;
}

// Admin types
export interface AdminProduct {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  storeName: string;
  price: number;
  stock: number;
  status: string;
  category: string;
  image?: string;
  createdAt: string;
}

export interface AdminProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface PaginatedAdminProducts {
  products: AdminProduct[];
  total: number;
  categories?: string[];
}

export async function getAdminProducts(
  filters?: AdminProductFilters
): Promise<PaginatedAdminProducts> {
  if (isDemoMode()) {
    let products = demoAdminProducts.map((p) => ({
      id: p.id,
      name: p.nameAr || p.name,
      nameAr: p.nameAr,
      slug: p.slug,
      storeName: p.storeName,
      price: p.price,
      stock: p.stock,
      status: p.status,
      category: p.category,
      createdAt: p.createdAt,
    }));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q)
      );
    }
    const limit = filters?.limit || 10;
    const page = filters?.page || 1;
    const start = (page - 1) * limit;
    const categories = [...new Set(demoAdminProducts.map((p) => p.category))];
    return {
      products: products.slice(start, start + limit),
      total: products.length,
      categories,
    };
  }
  try {
    const query = buildQueryString((filters ?? {}) as Record<string, unknown>);
    const response = await api.get<{ success: boolean; data: PaginatedAdminProducts }>(
      `/admin/products${query}`
    );
    return response.data.data;
  } catch {
    const categories = [...new Set(demoAdminProducts.map((p) => p.category))];
    return {
      products: demoAdminProducts.map((p) => ({
        id: p.id,
        name: p.nameAr || p.name,
        slug: p.slug,
        storeName: p.storeName,
        price: p.price,
        stock: p.stock,
        status: p.status,
        category: p.category,
        createdAt: p.createdAt,
      })),
      total: demoAdminProducts.length,
      categories,
    };
  }
}

export const productsService = {
  getProducts,
  getProductById: getProduct,
  getProductBySlug,
  searchProducts,
  getFeaturedProducts,
  getTrendingProducts,
  getProductsByCategory,
  getProductsByStore,
  getRelatedProducts,
  getProductSuggestions,
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getReviews,
  createReview,
  markReviewHelpful,
  getReviewSummary,
  getAdminProducts,
};
