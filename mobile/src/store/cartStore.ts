import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  storeId: string;
  storeName: string;
  variant?: {
    name: string;
    value: string;
  };
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  coupon: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null;
  isLoading: boolean;

  // Computed
  totalCount: () => number;
  subtotal: () => number;
  discount: () => number;
  shipping: () => number;
  total: () => number;

  // Actions
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number, type: 'percentage' | 'fixed') => void;
  removeCoupon: () => void;
  setLoading: (value: boolean) => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isLoading: false,

      totalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      subtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      discount: () => {
        const { coupon } = get();
        const subtotal = get().subtotal();
        if (!coupon) return 0;
        if (coupon.type === 'percentage') {
          return (subtotal * coupon.discount) / 100;
        }
        return Math.min(coupon.discount, subtotal);
      },

      shipping: () => {
        const subtotal = get().subtotal();
        return subtotal > 25 ? 0 : 2.5;
      },

      total: () => {
        const subtotal = get().subtotal();
        const discount = get().discount();
        const shipping = get().shipping();
        return Math.max(0, subtotal - discount + shipping);
      },

      setItems: (items) => set({ items }),

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (i) =>
            i.productId === item.productId &&
            i.variant?.value === item.variant?.value
        );

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? {
                    ...i,
                    quantity: Math.min(
                      i.quantity + item.quantity,
                      i.maxQuantity
                    ),
                  }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === itemId
              ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (code, discount, type) =>
        set({ coupon: { code, discount, type } }),

      removeCoupon: () => set({ coupon: null }),

      setLoading: (isLoading) => set({ isLoading }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
      }),
    }
  )
);
