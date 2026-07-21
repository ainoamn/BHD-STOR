import { useMemo, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { wishlistService } from '@/services/wishlist.service';
import type {
  Wishlist,
  WishlistItem,
} from '@/services/wishlist.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const wishlistKeys = {
  all: ['wishlist'] as const,
  detail: () => wishlistKeys.all,
};

// ------------------------------------------------------------------
// Wishlist Query Hook
// ------------------------------------------------------------------

/**
 * Hook: useWishlist
 * Fetch the current user's wishlist.
 */
export function useWishlist(): UseQueryResult<Wishlist, Error> {
  return useQuery({
    queryKey: wishlistKeys.detail(),
    queryFn: () => wishlistService.getWishlist(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ------------------------------------------------------------------
// Derived Hook
// ------------------------------------------------------------------

/**
 * Hook: useIsInWishlist
 * Check if a specific product is in the wishlist.
 */
export function useIsInWishlist(productId: string): boolean {
  const { data: wishlist } = useWishlist();

  return useMemo(() => {
    if (!wishlist?.items) return false;
    return wishlist.items.some((item) => item.productId === productId);
  }, [wishlist, productId]);
}

// ------------------------------------------------------------------
// Wishlist Mutation Hooks (with Optimistic Updates)
// ------------------------------------------------------------------

/**
 * Hook: useAddToWishlist
 * Add a product to the wishlist with optimistic update.
 */
export function useAddToWishlist(): UseMutationResult<
  Wishlist,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      wishlistService.addToWishlist(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.detail() });

      const previousWishlist = queryClient.getQueryData<Wishlist>(
        wishlistKeys.detail(),
      );

      if (previousWishlist) {
        const alreadyExists = previousWishlist.items.some(
          (item) => item.productId === productId,
        );

        if (!alreadyExists) {
          const optimisticItem: WishlistItem = {
            id: `optimistic-${Date.now()}`,
            productId,
            name: 'Loading...',
            price: 0,
            image: '',
            addedAt: new Date().toISOString(),
          };

          queryClient.setQueryData(wishlistKeys.detail(), {
            ...previousWishlist,
            items: [...previousWishlist.items, optimisticItem],
            totalItems: (previousWishlist.totalItems || 0) + 1,
          });
        }
      }

      return { previousWishlist };
    },
    onError: (_err, _productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(wishlistKeys.detail(), context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.detail() });
    },
  });
}

/**
 * Hook: useRemoveFromWishlist
 * Remove a product from the wishlist with optimistic update.
 */
export function useRemoveFromWishlist(): UseMutationResult<
  Wishlist,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      wishlistService.removeFromWishlist(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.detail() });

      const previousWishlist = queryClient.getQueryData<Wishlist>(
        wishlistKeys.detail(),
      );

      if (previousWishlist) {
        const newItems = previousWishlist.items.filter(
          (item) => item.productId !== productId,
        );

        queryClient.setQueryData(wishlistKeys.detail(), {
          ...previousWishlist,
          items: newItems,
          totalItems: Math.max(0, (previousWishlist.totalItems || 0) - 1),
        });
      }

      return { previousWishlist };
    },
    onError: (_err, _productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(wishlistKeys.detail(), context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.detail() });
    },
  });
}

/**
 * Hook: useToggleWishlist
 * Toggle a product in/out of the wishlist.
 * Automatically determines whether to add or remove.
 */
export function useToggleWishlist(): UseMutationResult<
  Wishlist,
  Error,
  string
> {
  const queryClient = useQueryClient();
  const { data: wishlist } = useWishlist();

  return useMutation({
    mutationFn: (productId: string) => {
      const isInWishlist = wishlist?.items.some(
        (item) => item.productId === productId,
      );
      if (isInWishlist) {
        return wishlistService.removeFromWishlist(productId);
      }
      return wishlistService.addToWishlist(productId);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.detail() });

      const previousWishlist = queryClient.getQueryData<Wishlist>(
        wishlistKeys.detail(),
      );

      if (previousWishlist) {
        const isInWishlist = previousWishlist.items.some(
          (item) => item.productId === productId,
        );

        if (isInWishlist) {
          // Remove optimistically
          const newItems = previousWishlist.items.filter(
            (item) => item.productId !== productId,
          );
          queryClient.setQueryData(wishlistKeys.detail(), {
            ...previousWishlist,
            items: newItems,
            totalItems: Math.max(0, (previousWishlist.totalItems || 0) - 1),
          });
        } else {
          // Add optimistically
          const optimisticItem: WishlistItem = {
            id: `optimistic-${Date.now()}`,
            productId,
            name: 'Loading...',
            price: 0,
            image: '',
            addedAt: new Date().toISOString(),
          };
          queryClient.setQueryData(wishlistKeys.detail(), {
            ...previousWishlist,
            items: [...previousWishlist.items, optimisticItem],
            totalItems: (previousWishlist.totalItems || 0) + 1,
          });
        }
      }

      return { previousWishlist };
    },
    onError: (_err, _productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(wishlistKeys.detail(), context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.detail() });
    },
  });
}
