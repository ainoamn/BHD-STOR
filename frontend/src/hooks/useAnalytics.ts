import {
  useQuery,
  UseQueryResult,
  UseQueryOptions,
} from '@tanstack/react-query';
import { isDemoMode } from '@/lib/demo-mode';
import { storesService } from '@/services/stores.service';
import { analyticsService } from '@/services/analytics.service';

export interface StoreDashboardAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalViews: number;
  revenueChange: number;
  ordersChange: number;
  viewsChange: number;
  chartData: Array<{ date: string; revenue: number; orders: number }>;
}

export const analyticsKeys = {
  all: ['analytics'] as const,
  store: (storeId: string, period = '30d') =>
    [...analyticsKeys.all, 'store', storeId, period] as const,
};

function emptyAnalytics(): StoreDashboardAnalytics {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10),
      revenue: 0,
      orders: 0,
    };
  });
  return {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalViews: 0,
    revenueChange: 0,
    ordersChange: 0,
    viewsChange: 0,
    chartData: days,
  };
}

function demoAnalytics(): StoreDashboardAnalytics {
  const base = emptyAnalytics();
  return {
    ...base,
    totalRevenue: 1250.5,
    totalOrders: 48,
    totalProducts: 24,
    totalViews: 1820,
    revenueChange: 12.4,
    ordersChange: 8.1,
    viewsChange: 5.2,
    chartData: base.chartData.map((row, i) => ({
      ...row,
      revenue: 80 + i * 25,
      orders: 3 + i,
    })),
  };
}

/**
 * Vendor store dashboard analytics.
 * Falls back to demo/empty data when API is unavailable.
 */
export function useStoreAnalytics(
  storeId: string,
  options?: { enabled?: boolean; period?: string },
): UseQueryResult<StoreDashboardAnalytics, Error> {
  const period = options?.period ?? '30d';
  const enabled = (options?.enabled ?? true) && !!storeId;

  return useQuery({
    queryKey: analyticsKeys.store(storeId, period),
    queryFn: async (): Promise<StoreDashboardAnalytics> => {
      if (isDemoMode() || !storeId) {
        return demoAnalytics();
      }

      try {
        const fromStores = await storesService.getStoreAnalytics(storeId, period);
        return {
          totalRevenue: fromStores.totalRevenue ?? 0,
          totalOrders: fromStores.totalOrders ?? 0,
          totalProducts: fromStores.totalProducts ?? 0,
          totalViews: 0,
          revenueChange: 0,
          ordersChange: 0,
          viewsChange: 0,
          chartData: emptyAnalytics().chartData,
        };
      } catch {
        try {
          const data = await analyticsService.getStoreAnalytics(
            period as '7d' | '30d' | '90d' | '1y' | 'all',
            storeId,
          );
          const summary = (data as any)?.summary ?? data;
          return {
            totalRevenue: Number(summary?.totalRevenue ?? summary?.revenue ?? 0),
            totalOrders: Number(summary?.totalOrders ?? summary?.orders ?? 0),
            totalProducts: Number(summary?.totalProducts ?? summary?.products ?? 0),
            totalViews: Number(summary?.totalViews ?? summary?.views ?? 0),
            revenueChange: Number(summary?.revenueGrowth ?? summary?.revenueChange ?? 0),
            ordersChange: Number(summary?.orderGrowth ?? summary?.ordersChange ?? 0),
            viewsChange: Number(summary?.viewsChange ?? 0),
            chartData:
              (data as any)?.dailyStats?.map((d: any) => ({
                date: d.date ?? d.day ?? '',
                revenue: Number(d.revenue ?? 0),
                orders: Number(d.orders ?? 0),
              })) ??
              (data as any)?.chartData ??
              emptyAnalytics().chartData,
          };
        } catch {
          return demoAnalytics();
        }
      }
    },
    enabled,
    staleTime: 1000 * 60 * 2,
    retry: false,
  } as UseQueryOptions<StoreDashboardAnalytics, Error>);
}
