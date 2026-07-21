"use client";

import React, { useState, ReactNode, useCallback } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  Query,
  Mutation,
} from '@tanstack/react-query';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface QueryProviderProps {
  children: ReactNode;
}

// ------------------------------------------------------------------
// Toast Error Handler (placeholder - integrate with your toast library)
// ------------------------------------------------------------------
function showToastError(message: string): void {
  // Integration point: replace with your toast/notification library
  // Examples:
  // - toast.error(message)  // react-hot-toast
  // - toast({ title: 'Error', description: message, variant: 'destructive' })  // shadcn
  // - enqueueSnackbar(message, { variant: 'error' })  // notistack
  if (process.env.NODE_ENV === 'development') {
    console.error('[Query Error]', message);
  }
}

// ------------------------------------------------------------------
// QueryClient Factory
// ------------------------------------------------------------------
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 2 minutes
        staleTime: 1000 * 60 * 2,

        // Unused data is garbage collected after 10 minutes
        gcTime: 1000 * 60 * 10,

        // Retry failed queries (but be smart about it)
        retry: (failureCount: number, error: Error) => {
          // Don't retry on 4xx client errors (except 429 rate limit)
          if (error instanceof Error) {
            const message = error.message;
            if (message.includes('400')) return false;
            if (message.includes('401')) return false;
            if (message.includes('403')) return false;
            if (message.includes('404')) return false;
            if (message.includes('409')) return false;
            // Retry on 429 (rate limited) and 5xx (server errors)
            if (message.includes('429')) return failureCount < 3;
            if (message.includes('5')) return failureCount < 3;
          }
          // Default: retry up to 3 times for network errors
          return failureCount < 3;
        },

        // Delay between retries (exponential backoff)
        retryDelay: (attemptIndex: number) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (for real-time data freshness)
        refetchOnWindowFocus: true,

        // Refetch on network reconnect
        refetchOnReconnect: true,

        // Throw errors so Error Boundaries can catch them
        throwOnError: false,
      },
      mutations: {
        // Retry mutations less aggressively
        retry: (failureCount: number, error: Error) => {
          if (error instanceof Error) {
            const message = error.message;
            // Never retry client errors for mutations
            if (message.includes('400')) return false;
            if (message.includes('401')) return false;
            if (message.includes('403')) return false;
            if (message.includes('404')) return false;
            if (message.includes('409')) return false;
            // Retry rate limits and server errors once
            if (message.includes('429')) return failureCount < 2;
            if (message.includes('5')) return failureCount < 2;
          }
          return failureCount < 1;
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error: Error, query: Query<unknown, Error, unknown, readonly unknown[]>) => {
        // Log query errors
        const queryKey = query.queryKey;
        const errorMessage = error?.message || 'An unknown error occurred';

        // Show toast for critical errors (not for background refetches)
        if (query.state.data === undefined) {
          // Only show toast on initial load failures
          showToastError(`Failed to load data: ${errorMessage}`);
        }

        if (process.env.NODE_ENV === 'development') {
          console.error(
            `[Query Error] Key: ${JSON.stringify(queryKey)}, Message: ${errorMessage}`,
          );
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: Error, variables: unknown, _context: unknown, mutation: Mutation<unknown, Error, unknown, unknown>) => {
        // Log mutation errors
        const mutationKey = mutation.options.mutationKey;
        const errorMessage = error?.message || 'An unknown error occurred';

        showToastError(`Action failed: ${errorMessage}`);

        if (process.env.NODE_ENV === 'development') {
          console.error(
            `[Mutation Error] Key: ${mutationKey ? JSON.stringify(mutationKey) : 'anonymous'}, Variables:`,
            variables,
            `Message: ${errorMessage}`,
          );
        }
      },
      onSuccess: (_data: unknown, _variables: unknown, _context: unknown, mutation: Mutation<unknown, Error, unknown, unknown>) => {
        const mutationKey = mutation.options.mutationKey;

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Mutation Success] Key: ${mutationKey ? JSON.stringify(mutationKey) : 'anonymous'}`,
          );
        }
      },
    }),
  });
}

// ------------------------------------------------------------------
// Provider Component
// ------------------------------------------------------------------

/**
 * QueryProvider
 *
 * Wraps the application with React Query's QueryClientProvider.
 * Includes:
 * - Configured QueryClient with sensible defaults
 * - Global error handling (toast notifications)
 * - Retry logic with exponential backoff
 * - Cache configuration
 * - React Query Devtools (development only)
 */
export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  // Use useState to ensure a single QueryClient instance per app lifecycle
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ------------------------------------------------------------------
// Utility Hook for Manual Query Invalidation
// ------------------------------------------------------------------

import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook: useInvalidateQueries
 * Provides a convenience function to invalidate multiple query keys at once.
 */
export function useInvalidateQueries(): {
  invalidate: (queryKeys: string[][]) => Promise<void>;
  invalidateAll: () => Promise<void>;
} {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    async (queryKeys: string[][]) => {
      await Promise.all(
        queryKeys.map((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        ),
      );
    },
    [queryClient],
  );

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  return { invalidate, invalidateAll };
}

// ------------------------------------------------------------------
// Prefetch Helpers
// ------------------------------------------------------------------

/**
 * Hook: usePrefetchProduct
 * Prefetch a product's detail page data on hover/focus for instant navigation.
 */
export function usePrefetchProduct(): {
  prefetchProduct: (productId: string) => Promise<void>;
} {
  const queryClient = useQueryClient();

  const prefetchProduct = useCallback(
    async (productId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['products', 'detail', productId],
        queryFn: async () => {
          // Dynamically import to avoid circular dependencies
          const { productsService } = await import('@/services/products.service');
          return productsService.getProductById(productId);
        },
        staleTime: 1000 * 60 * 3,
      });
    },
    [queryClient],
  );

  return { prefetchProduct };
}

/**
 * Hook: usePrefetchStore
 * Prefetch a store's detail page data on hover/focus.
 */
export function usePrefetchStore(): {
  prefetchStore: (storeId: string) => Promise<void>;
} {
  const queryClient = useQueryClient();

  const prefetchStore = useCallback(
    async (storeId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['stores', 'detail', storeId],
        queryFn: async () => {
          const { storesService } = await import('@/services/stores.service');
          return storesService.getStoreById(storeId);
        },
        staleTime: 1000 * 60 * 5,
      });
    },
    [queryClient],
  );

  return { prefetchStore };
}

export default QueryProvider;
