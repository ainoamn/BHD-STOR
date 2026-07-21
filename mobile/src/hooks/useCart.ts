import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore, CartItem } from '@store/cartStore';
import { cartService } from '@services/cart.service';
import Toast from 'react-native-toast-message';

export const useCart = () => {
  const queryClient = useQueryClient();
  const {
    items,
    coupon,
    isLoading: storeLoading,
    addItem: storeAddItem,
    removeItem: storeRemoveItem,
    updateQuantity: storeUpdateQuantity,
    clearCart: storeClearCart,
    applyCoupon: storeApplyCoupon,
    removeCoupon: storeRemoveCoupon,
    setItems: storeSetItems,
    totalCount,
    subtotal,
    discount,
    shipping,
    total,
  } = useCartStore();

  // Fetch cart from server
  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
    staleTime: 30 * 1000,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (data: Parameters<typeof cartService.addToCart>[0]) =>
      cartService.addToCart(data),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);

      // Optimistic update
      storeAddItem({
        id: Date.now().toString(),
        productId: newItem.productId,
        name: 'Loading...',
        price: 0,
        image: '',
        quantity: newItem.quantity,
        storeId: '',
        storeName: '',
        variant: newItem.variant,
        maxQuantity: 99,
      });

      return { previousCart };
    },
    onSuccess: (response) => {
      if (response.success) {
        storeSetItems(response.data.items);
        Toast.show({
          type: 'success',
          text1: 'Added to Cart',
          text2: 'Item added successfully',
        });
      }
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to add item',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeFromCart(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      storeRemoveItem(itemId);
      return { previousItems: items };
    },
    onSuccess: (response) => {
      if (response.success) {
        storeSetItems(response.data.items);
      }
    },
    onError: (_error, _itemId, context) => {
      if (context?.previousItems) {
        storeSetItems(context.previousItems);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: (data: { itemId: string; quantity: number }) =>
      cartService.updateCartItem(data),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      storeUpdateQuantity(itemId, quantity);
      return { previousItems: items };
    },
    onSuccess: (response) => {
      if (response.success) {
        storeSetItems(response.data.items);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        storeSetItems(context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      storeClearCart();
      Toast.show({
        type: 'success',
        text1: 'Cart Cleared',
        text2: 'All items removed',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to clear cart',
      });
    },
  });

  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (response) => {
      if (response.success && response.data.coupon) {
        storeApplyCoupon(
          response.data.coupon.code,
          response.data.coupon.discount,
          response.data.coupon.type
        );
        Toast.show({
          type: 'success',
          text1: 'Coupon Applied',
          text2: 'Discount applied successfully',
        });
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Invalid Coupon',
        text2: error.response?.data?.message || 'Failed to apply coupon',
      });
    },
  });

  // Remove coupon mutation
  const removeCouponMutation = useMutation({
    mutationFn: () => cartService.removeCoupon(),
    onSuccess: () => {
      storeRemoveCoupon();
      Toast.show({
        type: 'success',
        text1: 'Coupon Removed',
      });
    },
  });

  return {
    // State
    items,
    coupon,
    itemCount: totalCount(),
    subtotal: subtotal(),
    discount: discount(),
    shipping: shipping(),
    total: total(),
    isLoading: storeLoading || cartQuery.isLoading,

    // Queries
    cartData: cartQuery.data?.data,

    // Actions
    addToCart: (item: Omit<CartItem, 'id'>) => {
      storeAddItem(item as CartItem);
      // Also sync to server
      addToCartMutation.mutate({
        productId: item.productId,
        quantity: item.quantity,
        variant: item.variant,
      });
    },
    removeFromCart: (itemId: string) => {
      storeRemoveItem(itemId);
      removeFromCartMutation.mutate(itemId);
    },
    updateQuantity: (itemId: string, quantity: number) => {
      storeUpdateQuantity(itemId, quantity);
      updateQuantityMutation.mutate({ itemId, quantity });
    },
    clearCart: () => clearCartMutation.mutateAsync(),
    applyCoupon: (code: string) => applyCouponMutation.mutateAsync(code),
    removeCoupon: () => removeCouponMutation.mutateAsync(),

    // Mutation states
    isAddingToCart: addToCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isApplyingCoupon: applyCouponMutation.isPending,
  };
};

export default useCart;
