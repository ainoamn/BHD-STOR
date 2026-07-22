// =============================================================================
// BHD Oman Marketplace - Analytics Service
// =============================================================================

import { api, buildQueryString } from './api';
import { isDemoMode } from '@/lib/demo-mode';
import { getDemoAdminStats, getDemoAdminAnalytics } from '@/lib/demo-admin-data';
import {
  AnalyticsData,
  ChartData,
  TopProduct,
  TopStore,
} from '../types';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface StoreAnalyticsFilters {
  storeId?: string;
  period?: AnalyticsPeriod;
  fromDate?: string;
  toDate?: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  orders: number;
  conversionRate: number;
  revenue: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
  }>;
}

export interface ProductAnalytics {
  productId: string;
  name: string;
  image?: string;
  views: number;
  cartAdds: number;
  purchases: number;
  conversionRate: number;
  revenue: number;
  stock: number;
}

export interface GeoAnalytics {
  country: string;
  region?: string;
  orders: number;
  revenue: number;
  customers: number;
}

// Admin dashboard types
export type AdminAnalyticsPeriod = 'week' | 'month' | 'year';

export interface AdminDashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalUsers: number;
  usersChange: number;
  totalStores: number;
  storesChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts?: number;
}

export interface AdminAnalyticsData {
  salesChart: Array<{ date: string; revenue: number; orders: number }>;
  categoryBreakdown: Array<{ name: string; value: number; color?: string }>;
  summary?: {
    totalRevenue?: number;
    revenueChange?: number;
    totalOrders?: number;
    ordersChange?: number;
    newUsers?: number;
    usersChange?: number;
    newStores?: number;
    storesChange?: number;
  };
  topProducts?: Array<{ name: string; revenue: number }>;
  revenueBreakdown?: Array<{ name: string; value: number }>;
  platformGrowth?: Array<{ date: string; users: number; stores: number }>;
}

// ---------------------------------------------------------------------------
// Store Analytics Endpoints
// ---------------------------------------------------------------------------

/**
 * Get comprehensive analytics for a store (vendor dashboard).
 * @param period - Time period (e.g., '7d', '30d', '90d', '1y')
 * @param storeId - Optional store ID (for admin viewing specific store)
 * @returns Full analytics data with summary and daily stats
 */
export async function getStoreAnalytics(
  period: AnalyticsPeriod = '30d',
  storeId?: string
): Promise<AnalyticsData> {
  const query = buildQueryString({ period, storeId } as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: AnalyticsData }>(
    `/analytics/store${query}`
  );
  return response.data.data;
}

/**
 * Get sales chart data for a store.
 * @param period - Time period
 * @param storeId - Optional store ID
 * @returns Daily sales data points for charting
 */
export async function getSalesChart(
  period: AnalyticsPeriod = '30d',
  storeId?: string
): Promise<ChartData[]> {
  const query = buildQueryString({ period, storeId } as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: ChartData[] }>(
    `/analytics/store/sales-chart${query}`
  );
  return response.data.data;
}

/**
 * Get revenue chart data for a store.
 * @param period - Time period
 * @param storeId - Optional store ID
 * @returns Daily revenue data points for charting
 */
export async function getRevenueChart(
  period: AnalyticsPeriod = '30d',
  storeId?: string
): Promise<ChartData[]> {
  const query = buildQueryString({ period, storeId } as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: ChartData[] }>(
    `/analytics/store/revenue-chart${query}`
  );
  return response.data.data;
}

/**
 * Get top selling products for a store.
 * @param limit - Number of products to return (default 10)
 * @param period - Time period
 * @param storeId - Optional store ID
 * @returns Top selling products with sales data
 */
export async function getTopProducts(
  limit = 10,
  period: AnalyticsPeriod = '30d',
  storeId?: string
): Promise<TopProduct[]> {
  const query = buildQueryString({ limit, period, storeId } as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: TopProduct[] }>(
    `/analytics/store/top-products${query}`
  );
  return response.data.data;
}

/**
 * Get top performing stores (admin only).
 * @param limit - Number of stores to return (default 10)
 * @param period - Time period
 * @returns Top performing stores
 */
export async function getTopStores(
  limit = 10,
  period: AnalyticsPeriod = '30d'
): Promise<TopStore[]> {
  const query = buildQueryString({ limit, period });
  const response = await api.get<{ success: boolean; data: TopStore[] }>(
    `/analytics/admin/top-stores${query}`
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Admin Dashboard Endpoints
// ---------------------------------------------------------------------------

/**
 * Get admin dashboard summary (platform-wide).
 * @returns Summary metrics for the entire platform
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (isDemoMode()) {
    const demo = getDemoAdminStats();
    return {
      totalRevenue: demo.totalRevenue,
      totalOrders: demo.totalOrders,
      totalCustomers: demo.totalUsers,
      totalProducts: 156,
      pendingOrders: 12,
      lowStockProducts: 8,
      revenueGrowth: demo.revenueChange,
      orderGrowth: demo.ordersChange,
    };
  }
  const response = await api.get<{ success: boolean; data: DashboardSummary }>(
    '/analytics/admin/summary'
  );
  return response.data.data;
}

export async function getAdminStats(): Promise<AdminDashboardStats> {
  if (isDemoMode()) return getDemoAdminStats();
  const response = await api.get<{ success: boolean; data: AdminDashboardStats }>(
    '/analytics/admin/stats'
  );
  return response.data.data;
}

export async function getAdminAnalytics(
  _period: AdminAnalyticsPeriod = 'month'
): Promise<AdminAnalyticsData> {
  if (isDemoMode()) return getDemoAdminAnalytics();
  const response = await api.get<{ success: boolean; data: AdminAnalyticsData }>(
    '/analytics/admin/analytics',
    { params: { period: _period } }
  );
  return response.data.data;
}

/**
 * Get platform-wide revenue chart (admin only).
 * @param period - Time period
 * @returns Revenue data points
 */
export async function getPlatformRevenueChart(
  period: AnalyticsPeriod = '30d'
): Promise<ChartData[]> {
  const response = await api.get<{ success: boolean; data: ChartData[] }>(
    '/analytics/admin/revenue-chart',
    { params: { period } }
  );
  return response.data.data;
}

/**
 * Get platform-wide order chart (admin only).
 * @param period - Time period
 * @returns Order count data points
 */
export async function getPlatformOrdersChart(
  period: AnalyticsPeriod = '30d'
): Promise<ChartData[]> {
  const response = await api.get<{ success: boolean; data: ChartData[] }>(
    '/analytics/admin/orders-chart',
    { params: { period } }
  );
  return response.data.data;
}

/**
 * Get traffic source analytics (admin only).
 * @param period - Time period
 * @returns Traffic sources with visitor/order/conversion data
 */
export async function getTrafficSources(
  period: AnalyticsPeriod = '30d'
): Promise<TrafficSource[]> {
  const response = await api.get<{ success: boolean; data: TrafficSource[] }>(
    '/analytics/admin/traffic-sources',
    { params: { period } }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Customer Analytics
// ---------------------------------------------------------------------------

/**
 * Get customer analytics for a store.
 * @param period - Time period
 * @param storeId - Optional store ID
 * @returns Customer metrics and top customers
 */
export async function getCustomerAnalytics(
  period: AnalyticsPeriod = '30d',
  storeId?: string
): Promise<CustomerAnalytics> {
  const query = buildQueryString({ period, storeId } as Record<string, unknown>);
  const response = await api.get<{ success: boolean; data: CustomerAnalytics }>(
    `/analytics/store/customers${query}`
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Product Analytics
// ---------------------------------------------------------------------------

/**
 * Get detailed analytics for a specific product.
 * @param productId - Product UUID
 * @param period - Time period
 * @returns Product analytics with views, conversions, revenue
 */
export async function getProductAnalytics(
  productId: string,
  period: AnalyticsPeriod = '30d'
): Promise<ProductAnalytics> {
  const response = await api.get<{ success: boolean; data: ProductAnalytics }>(
    `/analytics/products/${productId}`,
    { params: { period } }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Geographic Analytics
// ---------------------------------------------------------------------------

/**
 * Get geographic distribution of orders (admin only).
 * @param period - Time period
 * @returns Order/revenue data by country/region
 */
export async function getGeoAnalytics(
  period: AnalyticsPeriod = '30d'
): Promise<GeoAnalytics[]> {
  const response = await api.get<{ success: boolean; data: GeoAnalytics[] }>(
    '/analytics/admin/geo',
    { params: { period } }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Export analytics data as CSV/Excel.
 * @param type - Export type ('orders', 'products', 'customers', 'revenue')
 * @param period - Time period
 * @param storeId - Optional store filter
 * @returns Blob of the exported file
 */
export async function exportAnalytics(
  type: 'orders' | 'products' | 'customers' | 'revenue',
  period: AnalyticsPeriod = '30d',
  storeId?: string
): Promise<Blob> {
  const query = buildQueryString({ type, period, storeId } as Record<string, unknown>);
  const response = await api.get<Blob>(`/analytics/export${query}`, {
    responseType: 'blob',
  });
  return response.data;
}

export const analyticsService = {
  getStoreAnalytics,
  getSalesChart,
  getRevenueChart,
  getTopProducts,
  getTopStores,
  getDashboardSummary,
  getPlatformRevenueChart,
  getPlatformOrdersChart,
  getTrafficSources,
  getCustomerAnalytics,
  getProductAnalytics,
  getGeoAnalytics,
  exportAnalytics,
  getAdminStats,
  getAdminAnalytics,
};
