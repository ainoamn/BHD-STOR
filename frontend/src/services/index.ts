// =============================================================================
// BHD Oman Marketplace - Services Barrel Export
// =============================================================================
// Import all API services from a single entry point:
//   import { login, getProducts, getCart, processPayment } from '@/services';
// =============================================================================

// ── Core API Instance & Utilities ───────────────────────────────────────────
export {
  api,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  buildQueryString,
  createCancelToken,
  isCancel,
  isAbortError,
  setAuthToken,
  removeAuthToken,
  getAuthToken,
} from './api';
export type { ApiErrorDetail } from './api';
export { default } from './api';

// ── Auth Service ────────────────────────────────────────────────────────────
export {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  updateMe,
  updateAvatar,
  changePassword,
  requestPhoneVerification,
  verifyPhone,
  getOAuthUrl,
  handleOAuthCallback,
} from './auth.service';
export type {
  AuthSuccessResponse,
  TokenRefreshResponse,
  MessageResponse,
  AvatarUpdateResponse,
} from './auth.service';

// ── Products Service ────────────────────────────────────────────────────────
export {
  getProducts,
  getProduct,
  getProductBySlug,
  searchProducts,
  getFeaturedProducts,
  getTrendingProducts,
  getProductsByCategory,
  getProductsByStore,
  getRelatedProducts,
  getProductSuggestions,
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  getReviews,
  createReview,
  markReviewHelpful,
  getReviewSummary,
} from './products.service';
export type { SearchSuggestion as ProductSearchSuggestion } from './products.service';

// ── Stores Service ──────────────────────────────────────────────────────────
export {
  getStores,
  getStore,
  getStoreBySlug,
  getStoreProducts,
  createStore,
  updateStore,
  followStore,
  getFeaturedStores,
  getStoreAnalytics,
  isFollowingStore,
  getFollowedStores,
} from './stores.service';

// ── Orders Service ──────────────────────────────────────────────────────────
export {
  getOrders,
  getOrder,
  getOrderByNumber,
  createOrder,
  cancelOrder,
  getOrderHistory,
  requestReturn,
  getReturnRequests,
  reorder,
  downloadInvoice,
  confirmReceipt,
  getOrderStats,
} from './orders.service';
export type {
  OrderResponse,
  ReorderResponse,
  ReturnRequest,
  ReturnRequestData,
} from './orders.service';

// ── Cart Service ────────────────────────────────────────────────────────────
export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartTotals,
  mergeCart,
  moveToWishlist,
  syncCart,
  validateCart,
  getCartShippingOptions,
  selectShippingMethod,
} from './cart.service';
export type {
  ApplyCouponResponse,
  MoveToWishlistResponse,
} from './cart.service';

// ── Wishlist Service ────────────────────────────────────────────────────────
export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  toggleWishlist,
  moveToCart,
  clearWishlist,
} from './wishlist.service';
export type { WishlistToggleResponse } from './wishlist.service';

// ── Payments Service ────────────────────────────────────────────────────────
export {
  processPayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  createRefund,
  getGateways,
  getSavedCards,
  deleteSavedCard,
  setDefaultCard,
  createThawaniSession,
  createCBPaymentSession,
  verifyThawaniPayment,
  verifyCBPayment,
  getWalletBalance,
  getWalletTransactions,
} from './payments.service';
export type {
  PaymentInitResponse,
  PaymentVerificationResponse,
  SavedCard,
} from './payments.service';

// ── Shipping Service ────────────────────────────────────────────────────────
export {
  calculateRates,
  createShipment,
  trackShipment,
  getCarriers,
  validateAddress,
  getOmanGovernorates,
  getOrderShipments,
  getShipment,
  schedulePickup,
  downloadLabel,
  getEstimatedDelivery,
} from './shipping.service';
export type {
  CreateShipmentData,
  ShippingAddressValidation,
  PickupScheduleRequest,
} from './shipping.service';

// ── Currency Service ────────────────────────────────────────────────────────
export {
  getCurrencies,
  getActiveCurrencies,
  convert,
  getDefaultCurrency,
  getUserCurrency,
  setUserCurrency,
  batchConvert,
  getExchangeRates,
} from './currency.service';

// ── AI Service ──────────────────────────────────────────────────────────────
export {
  chat,
  chatStream,
  getRecommendations,
  getSmartCartSuggestions,
  getCustomersAlsoViewed,
  semanticSearch,
  visualSearch,
  translate,
  translateProduct,
  analyzeSentiment,
  analyzeProductSentiment,
  generateProductDescription,
  generateReplySuggestion,
} from './ai.service';
export type {
  ChatMessage,
  ChatContext,
  ChatResponse,
  ChatStreamChunk,
  RecommendationFilters,
  SearchResult,
  SentimentResult,
  ImageSearchResult,
  ProductDescriptionResult,
} from './ai.service';

// ── Notifications Service ───────────────────────────────────────────────────
export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteReadNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  subscribePush,
  unsubscribePush,
  subscribeToRealtimeNotifications,
} from './notifications.service';
export type { NotificationPreferences } from './notifications.service';

// ── WhatsApp Service ────────────────────────────────────────────────────────
export {
  sendMessage,
  sendTemplate,
  getTemplates,
  getConversations,
  getConversationMessages,
  markConversationAsRead,
  archiveConversation,
  getAccountStatus,
  sendOrderConfirmation,
  sendShippingNotification,
  sendDeliveryNotification,
} from './whatsapp.service';
export type {
  SendMessageOptions,
  SendTemplateData,
} from './whatsapp.service';

// ── Analytics Service ───────────────────────────────────────────────────────
export {
  getStoreAnalytics,
  getSalesChart,
  getRevenueChart,
  getTopProducts,
  getTopStores,
  getDashboardSummary,
  getPlatformRevenueChart,
  getPlatformOrdersChart,
  getTrafficSources,
  getCustomerAnalytics,
  getProductAnalytics,
  getGeoAnalytics,
  exportAnalytics,
} from './analytics.service';
export type {
  AnalyticsPeriod,
  StoreAnalyticsFilters,
  DashboardSummary,
  TrafficSource,
  CustomerAnalytics,
  ProductAnalytics,
  GeoAnalytics,
} from './analytics.service';
