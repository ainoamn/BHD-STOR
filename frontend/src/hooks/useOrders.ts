import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import type {
  Order,
  OrderFilters,
  PaginatedOrders,
  CreateOrderData,
  OrderStatus,
  OrderHistoryItem,
} from '@/services/orders.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  history: (id: string) =>
    [...orderKeys.detail(id), 'history'] as const,
};

// ------------------------------------------------------------------
// Order Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useOrders
 * Fetch paginated orders with optional filters (status, date range).
 */
export function useOrders(
  filters: OrderFilters = {},
): UseQueryResult<PaginatedOrders, Error> {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => ordersService.getOrders(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook: useOrder
 * Fetch a single order by its ID.
 */
export function useOrder(id: string): UseQueryResult<Order, Error> {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersService.getOrder(id),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

/**
 * Hook: useOrderHistory
 * Fetch the status history timeline for a specific order.
 */
export function useOrderHistory(
  id: string,
): UseQueryResult<OrderHistoryItem[], Error> {
  return useQuery({
    queryKey: orderKeys.history(id),
    queryFn: () => ordersService.getOrderHistory(id),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  });
}

// ------------------------------------------------------------------
// Order Mutation Hooks
// ------------------------------------------------------------------

/**
 * Hook: useCreateOrder
 * Mutation to create a new order. On success: clears cart & invalidates orders.
 */
export function useCreateOrder(): UseMutationResult<
  Order,
  Error,
  CreateOrderData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => (await ordersService.createOrder(data)).order,
    onSuccess: () => {
      // Invalidate orders list so the new order appears
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Clear cart data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Hook: useCancelOrder
 * Mutation to cancel an existing order.
 */
export function useCancelOrder(): UseMutationResult<
  Order,
  Error,
  { orderId: string; reason?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      ordersService.cancelOrder(orderId, reason ?? 'Cancelled by user'),
    onSuccess: (updatedOrder) => {
      // Update the specific order cache
      queryClient.setQueryData(
        orderKeys.detail(updatedOrder.id),
        updatedOrder,
      );
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
