import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';
import type {
  Payment,
  PaymentFilters,
  PaginatedPayments,
  ProcessPaymentData,
  PaymentGateway,
  RefundData,
  PaymentInitResponse,
  Refund,
} from '@/services/payments.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilters) =>
    [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  gateways: () => [...paymentKeys.all, 'gateways'] as const,
};

// ------------------------------------------------------------------
// Payment Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: usePaymentHistory
 * Fetch paginated payment history for the authenticated user.
 */
export function usePaymentHistory(
  filters: PaymentFilters = {},
): UseQueryResult<PaginatedPayments, Error> {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentsService.getPaymentHistory(filters.page ?? 1, filters.limit ?? 10),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook: usePayment
 * Fetch a single payment by its ID.
 */
export function usePayment(id: string): UseQueryResult<Payment, Error> {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsService.getPaymentDetails(id),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  });
}

/**
 * Hook: useGateways
 * Fetch available payment gateways.
 */
export function useGateways(): UseQueryResult<PaymentGateway[], Error> {
  return useQuery({
    queryKey: paymentKeys.gateways(),
    queryFn: () => paymentsService.getPaymentGateways(),
    staleTime: 1000 * 60 * 10, // 10 minutes - gateways don't change often
    gcTime: 1000 * 60 * 30,
  });
}

// ------------------------------------------------------------------
// Payment Mutation Hooks
// ------------------------------------------------------------------

/**
 * Hook: useProcessPayment
 * Mutation to process a payment transaction.
 */
export function useProcessPayment(): UseMutationResult<
  PaymentInitResponse,
  Error,
  ProcessPaymentData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessPaymentData) =>
      paymentsService.processPayment(data),
    onSuccess: () => {
      // Invalidate payment history and orders after a payment
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Hook: useCreateRefund
 * Mutation to request a refund for a payment.
 */
export function useCreateRefund(): UseMutationResult<
  Refund,
  Error,
  RefundData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RefundData) =>
      paymentsService.createRefund(data.paymentId, data.amount, data.reason),
    onSuccess: (_refund, variables) => {
      // Invalidate the specific payment
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(variables.paymentId),
      });
      // Invalidate payment history
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      // Invalidate related orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
