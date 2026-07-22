// ------------------------------------------------------------------
// BHD Oman Marketplace - Hooks Barrel Export
// ------------------------------------------------------------------

// --- Authentication ---
export {
  useAuth,
  useUser,
  useRegister,
  useLogin,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useUpdateProfile,
  useUpdateAvatar,
  authKeys,
} from './useAuth';
export type { UseAuthReturn } from './useAuth';

// --- Products ---
export {
  useProducts,
  useProduct,
  useProductBySlug,
  useFeaturedProducts,
  useTrendingProducts,
  useProductsByCategory,
  useProductsByStore,
  useSearchProducts,
  useCreateReview,
  useReviews,
  useCreateProduct,
  useUpdateProduct,
  productKeys,
} from './useProducts';

// --- Stores ---
export {
  useStores,
  useStore,
  useStoreBySlug,
  useStoreProducts,
  useCreateStore,
  useUpdateStore,
  useFollowStore,
  useFeaturedStores,
  storeKeys,
} from './useStores';

// --- Orders ---
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useCancelOrder,
  useOrderHistory,
  orderKeys,
} from './useOrders';

// --- Cart ---
export {
  useCart,
  useCartTotals,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  useApplyCoupon,
  useRemoveCoupon,
  cartKeys,
} from './useCart';

// --- Wishlist ---
export {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
  useToggleWishlist,
  useIsInWishlist,
  wishlistKeys,
} from './useWishlist';

// --- Payments ---
export {
  usePaymentHistory,
  usePayment,
  useProcessPayment,
  useGateways,
  useCreateRefund,
  paymentKeys,
} from './usePayments';

// --- Shipping ---
export {
  useShippingRates,
  useCreateShipment,
  useTrackShipment,
  useCarriers,
  shippingKeys,
} from './useShipping';

// --- Currency ---
export {
  useCurrencies,
  useActiveCurrencies,
  useConvert,
  useDefaultCurrency,
  useCurrentCurrency,
  useFormatPrice,
  currencyKeys,
} from './useCurrency';

// --- AI Services ---
export {
  useChat,
  useRecommendations,
  useSmartCartSuggestions,
  useSemanticSearch,
  useTranslate,
  useSentiment,
  aiKeys,
} from './useAI';

// --- Notifications ---
export {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  notificationKeys,
} from './useNotifications';

// --- Admin ---
export {
  useAdminStats,
  useAdminUsers,
  useAdminUpdateUser,
  useAdminStores,
  useAdminVerifyStore,
  useAdminProducts,
  useAdminOrders,
  useAdminUpdateOrderStatus,
  useAdminPayments,
  useAdminAnalytics,
  adminKeys,
} from './useAdmin';

// --- Utilities ---
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBreakpoint,
} from './useMediaQuery';

// --- Analytics ---
export {
  useStoreAnalytics,
  analyticsKeys,
} from './useAnalytics';
export type { StoreDashboardAnalytics } from './useAnalytics';
