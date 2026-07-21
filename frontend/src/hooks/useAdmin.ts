import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { authService } from '@/services/auth.service';
import { storesService } from '@/services/stores.service';
import { productsService } from '@/services/products.service';
import { ordersService } from '@/services/orders.service';
import { paymentsService } from '@/services/payments.service';
import type {
  AdminDashboardStats,
  AdminAnalyticsPeriod,
  AdminAnalyticsData,
} from '@/services/analytics.service';
import type {
  AdminUser,
  AdminUserFilters,
  PaginatedAdminUsers,
  UpdateUserData,
} from '@/services/auth.service';
import type {
  AdminStore,
  AdminStoreFilters,
  PaginatedAdminStores,
} from '@/services/stores.service';
import type {
  AdminProduct,
  AdminProductFilters,
  PaginatedAdminProducts,
} from '@/services/products.service';
import type {
  AdminOrder,
  AdminOrderFilters,
  PaginatedAdminOrders,
  UpdateOrderStatusData,
} from '@/services/orders.service';
import type {
  AdminPayment,
  AdminPaymentFilters,
  PaginatedAdminPayments,
} from '@/services/payments.service';

// ------------------------------------------------------------------
// Query & Mutation Keys
// ------------------------------------------------------------------
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  analytics: (period: AdminAnalyticsPeriod) =>
    [...adminKeys.all, 'analytics', period] as const,
  users: {
    all: () => [...adminKeys.all, 'users'] as const,
    list: (filters: AdminUserFilters) =>
      [...adminKeys.users.all(), filters] as const,
  },
  stores: {
    all: () => [...adminKeys.all, 'stores'] as const,
    list: (filters: AdminStoreFilters) =>
      [...adminKeys.stores.all(), filters] as const,
  },
  products: {
    all: () => [...adminKeys.all, 'products'] as const,
    list: (filters: AdminProductFilters) =>
      [...adminKeys.products.all(), filters] as const,
  },
  orders: {
    all: () => [...adminKeys.all, 'orders'] as const,
    list: (filters: AdminOrderFilters) =>
      [...adminKeys.orders.all(), filters] as const,
  },
  payments: {
    all: () => [...adminKeys.all, 'payments'] as const,
    list: (filters: AdminPaymentFilters) =>
      [...adminKeys.payments.all(), filters] as const,
  },
};

// ------------------------------------------------------------------
// Admin Dashboard Stats
// ------------------------------------------------------------------

/**
 * Hook: useAdminStats
 * Fetch admin dashboard statistics (sales, users, orders, revenue).
 */
export function useAdminStats(): UseQueryResult<AdminDashboardStats, Error> {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => analyticsService.getAdminStats(),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,
    refetchInterval: 60000, // 1 minute
    refetchIntervalInBackground: false,
  });
}

// ------------------------------------------------------------------
// Admin Users Management
// ------------------------------------------------------------------

/**
 * Hook: useAdminUsers
 * Fetch paginated list of users for admin management.
 */
export function useAdminUsers(
  filters: AdminUserFilters = {},
): UseQueryResult<PaginatedAdminUsers, Error> {
  return useQuery({
    queryKey: adminKeys.users.list(filters),
    queryFn: () => authService.getAdminUsers(filters),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook: useAdminUpdateUser
 * Mutation to update a user's details (role, status, etc.) as admin.
 */
export function useAdminUpdateUser(): UseMutationResult<
  AdminUser,
  Error,
  { userId: string; data: UpdateUserData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      authService.adminUpdateUser(userId, data),
    onSuccess: (_updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
      queryClient.invalidateQueries({
        queryKey: ['auth', 'user', variables.userId],
      });
    },
  });
}

// ------------------------------------------------------------------
// Admin Stores Management
// ------------------------------------------------------------------

/**
 * Hook: useAdminStores
 * Fetch paginated list of stores for admin management.
 */
export function useAdminStores(
  filters: AdminStoreFilters = {},
): UseQueryResult<PaginatedAdminStores, Error> {
  return useQuery({
    queryKey: adminKeys.stores.list(filters),
    queryFn: () => storesService.getAdminStores(filters),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook: useAdminVerifyStore
 * Mutation to verify/approve a store as admin.
 */
export function useAdminVerifyStore(): UseMutationResult<
  AdminStore,
  Error,
  { storeId: string; verified: boolean; notes?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      verified,
      notes,
    }: {
      storeId: string;
      verified: boolean;
      notes?: string;
    }) => storesService.verifyStore(storeId, verified, notes),
    onSuccess: (_updatedStore, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.stores.all() });
      queryClient.invalidateQueries({
        queryKey: ['stores', 'detail', variables.storeId],
      });
    },
  });
}

// ------------------------------------------------------------------
// Admin Products Management
// ------------------------------------------------------------------

/**
 * Hook: useAdminProducts
 * Fetch paginated list of products for admin management.
 */
export function useAdminProducts(
  filters: AdminProductFilters = {},
): UseQueryResult<PaginatedAdminProducts, Error> {
  return useQuery({
    queryKey: adminKeys.products.list(filters),
    queryFn: () => productsService.getAdminProducts(filters),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });
}

// ------------------------------------------------------------------
// Admin Orders Management
// ------------------------------------------------------------------

/**
 * Hook: useAdminOrders
 * Fetch paginated list of orders for admin management.
 */
export function useAdminOrders(
  filters: AdminOrderFilters = {},
): UseQueryResult<PaginatedAdminOrders, Error> {
  return useQuery({
    queryKey: adminKeys.orders.list(filters),
    queryFn: () => ordersService.getAdminOrders(filters),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook: useAdminUpdateOrderStatus
 * Mutation to update an order's status as admin.
 */
export function useAdminUpdateOrderStatus(): UseMutationResult<
  AdminOrder,
  Error,
  { orderId: string; data: UpdateOrderStatusData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateOrderStatusData;
    }) => ordersService.updateOrderStatus(orderId, data),
    onSuccess: (_updatedOrder, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orders.all() });
      queryClient.invalidateQueries({
        queryKey: ['orders', 'detail', variables.orderId],
      });
    },
  });
}

// ------------------------------------------------------------------
// Admin Payments Management
// ------------------------------------------------------------------

/**
 * Hook: useAdminPayments
 * Fetch paginated list of payments for admin management.
 */
export function useAdminPayments(
  filters: AdminPaymentFilters = {},
): UseQueryResult<PaginatedAdminPayments, Error> {
  return useQuery({
    queryKey: adminKeys.payments.list(filters),
    queryFn: () => paymentsService.getAdminPayments(filters),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });
}

// ------------------------------------------------------------------
// Admin Analytics
// ------------------------------------------------------------------

/**
 * Hook: useAdminAnalytics
 * Fetch detailed analytics data for a specified time period.
 */
export function useAdminAnalytics(
  period: AdminAnalyticsPeriod,
): UseQueryResult<AdminAnalyticsData, Error> {
  return useQuery({
    queryKey: adminKeys.analytics(period),
    queryFn: () => analyticsService.getAdminAnalytics(period),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
  });
}
