import { useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { cartService } from '@/services/cart.service';
import type {
  Cart,
  CartItem,
  CartTotals,
} from '@/types';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const cartKeys = {
  all: ['cart'] as const,
  detail: () => cartKeys.all,
  totals: () => [...cartKeys.all, 'totals'] as const,
};

// ------------------------------------------------------------------
// Type Helpers
// ------------------------------------------------------------------
interface AddToCartVariables {
  productId: string;
  quantity?: number;
  variantId?: string;
}

interface UpdateCartItemVariables {
  itemId: string;
  quantity: number;
}

interface RemoveFromCartVariables {
  itemId: string;
}

// ------------------------------------------------------------------
// Cart Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useCart
 * Fetch the current user's (or guest's) cart.
 * Refetches every 30s to keep cart state fresh for guest carts.
 */
export function useCart(): UseQueryResult<Cart, Error> {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => cartService.getCart(),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10,
    refetchInterval: 30000, // 30 seconds for guest cart sync
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on 401 for guests
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook: useCartTotals
 * Derive cart totals directly from useCart data.
 */
export function useCartTotals(): CartTotals | null {
  const { data: cart } = useCart();

  return useMemo(() => {
    if (!cart) return null;
    return cart.totals ?? {
      subtotal: cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      discount: cart.discount ?? 0,
      tax: cart.tax ?? 0,
      shipping: cart.shipping ?? 0,
      total: cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ) - (cart.discount ?? 0) + (cart.tax ?? 0) + (cart.shipping ?? 0),
    };
  }, [cart]);
}

// ------------------------------------------------------------------
// Cart Mutation Hooks (with Optimistic Updates)
// ------------------------------------------------------------------

/**
 * Hook: useAddToCart
 * Add an item to the cart with optimistic update.
 */
export function useAddToCart(): UseMutationResult<
  Cart,
  Error,
  AddToCartVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity, variantId }: AddToCartVariables) =>
      cartService.addToCart({ productId, quantity, variantId }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      if (previousCart) {
        // Optimistically add/update the item
        const existingItemIndex = previousCart.items.findIndex(
          (item) =>
            item.productId === variables.productId &&
            item.variantId === variables.variantId,
        );

        let newItems: CartItem[];
        if (existingItemIndex >= 0) {
          newItems = previousCart.items.map((item, idx) =>
            idx === existingItemIndex
              ? { ...item, quantity: item.quantity + (variables.quantity ?? 1) }
              : item,
          );
        } else {
          const optimisticItem: CartItem = {
            id: `optimistic-${Date.now()}`,
            productId: variables.productId,
            variantId: variables.variantId,
            name: 'Loading...',
            price: 0,
            quantity: variables.quantity ?? 1,
            image: '',
            stock: 0,
          };
          newItems = [...previousCart.items, optimisticItem];
        }

        queryClient.setQueryData(cartKeys.detail(), {
          ...previousCart,
          items: newItems,
        });
      }

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    },
  });
}

/**
 * Hook: useUpdateCartItem
 * Update the quantity of a cart item with optimistic update.
 */
export function useUpdateCartItem(): UseMutationResult<
  Cart,
  Error,
  UpdateCartItemVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: UpdateCartItemVariables) =>
      cartService.updateCartItem(itemId, quantity),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      if (previousCart) {
        const newItems = previousCart.items.map((item) =>
          item.id === variables.itemId
            ? { ...item, quantity: variables.quantity }
            : item,
        );

        queryClient.setQueryData(cartKeys.detail(), {
          ...previousCart,
          items: newItems,
        });
      }

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    },
  });
}

/**
 * Hook: useRemoveFromCart
 * Remove an item from the cart with optimistic update.
 */
export function useRemoveFromCart(): UseMutationResult<
  Cart,
  Error,
  RemoveFromCartVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId }: RemoveFromCartVariables) =>
      cartService.removeFromCart(itemId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      if (previousCart) {
        const newItems = previousCart.items.filter(
          (item) => item.id !== variables.itemId,
        );

        queryClient.setQueryData(cartKeys.detail(), {
          ...previousCart,
          items: newItems,
        });
      }

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    },
  });
}

/**
 * Hook: useClearCart
 * Clear all items from the cart.
 */
export function useClearCart(): UseMutationResult<Cart, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartService.clearCart(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

      const previousCart = queryClient.getQueryData<Cart>(cartKeys.detail());

      if (previousCart) {
        queryClient.setQueryData(cartKeys.detail(), {
          ...previousCart,
          items: [],
          totals: {
            subtotal: 0,
            discount: 0,
            tax: 0,
            shipping: 0,
            total: 0,
          },
        });
      }

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    },
  });
}

/**
 * Hook: useApplyCoupon
 * Apply a coupon code to the cart.
 */
export function useApplyCoupon(): UseMutationResult<
  Cart,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    },
  });
}

/**
 * Hook: useRemoveCoupon
 * Remove the applied coupon from the cart.
 */
export function useRemoveCoupon(): UseMutationResult<Cart, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartService.removeCoupon(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
    },
  });
}
