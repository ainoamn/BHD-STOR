// =============================================================================
// BHD Oman Marketplace - Shared TypeScript Types & Interfaces
// =============================================================================

// -----------------------------------------------------------------------------
// Core API Response Types
// -----------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

// -----------------------------------------------------------------------------
// Address
// -----------------------------------------------------------------------------

export interface Address {
  id?: string;
  label?: string; // e.g., "Home", "Office"
  fullName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

// -----------------------------------------------------------------------------
// User
// -----------------------------------------------------------------------------

export type UserRole = 'customer' | 'seller' | 'vendor' | 'admin' | 'super_admin' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  addresses: Address[];
  preferences?: UserPreferences;
  storeId?: string; // for vendors
  store?: { id: string; name?: string; slug?: string };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  preferences?: Partial<UserPreferences>;
}

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export type StoreStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  ownerId: string;
  status: StoreStatus;
  isVerified: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  followerCount: number;
  followersCount?: number;
  isFollowing?: boolean;
  productCount: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: Address;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  businessHours?: BusinessHours;
  returnPolicy?: string;
  shippingPolicy?: string;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}

export interface StoreFilters {
  search?: string;
  status?: StoreStatus;
  isVerified?: boolean;
  isFeatured?: boolean;
  category?: string;
  minRating?: number;
  city?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'rating' | 'createdAt' | 'productCount' | 'followerCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateStoreData {
  name: string;
  slug?: string;
  description?: string;
  logo?: File | string;
  banner?: File | string;
  contactEmail?: string;
  contactPhone?: string;
  phone?: string;
  ownerId?: string;
  address?: Omit<Address, 'id'> | string;
  socialLinks?: Store['socialLinks'];
  businessHours?: BusinessHours;
  returnPolicy?: string;
  shippingPolicy?: string;
}

export interface UpdateStoreData extends Partial<CreateStoreData> {
  status?: StoreStatus;
}

// -----------------------------------------------------------------------------
// Category
// -----------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string | null;
  children?: Category[];
  level: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Product
// -----------------------------------------------------------------------------

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'archived';
export type ProductCondition = 'new' | 'used' | 'refurbished';

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  status: ProductStatus;
  condition: ProductCondition;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  /** UI/demo convenience alias for quantity */
  stock?: number;
  /** Primary image URL (UI/demo convenience) */
  image?: string;
  images: ProductImage[];
  categoryId: string;
  category?: Category | string;
  storeId: string;
  store?: Store;
  storeName?: string;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  reviewsCount?: number;
  soldCount: number;
  viewCount: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isOnSale?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string | string[];
  displayType?: 'text' | 'color' | 'image';
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  attributes: Record<string, string>;
  image?: string;
  barcode?: string;
  isActive: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  categorySlug?: string;
  store?: string;
  storeSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  condition?: ProductCondition;
  isFeatured?: boolean;
  isTrending?: boolean;
  attributes?: Record<string, string | string[]>;
  tags?: string[];
  inStock?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'soldCount' | 'viewCount' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// -----------------------------------------------------------------------------
// Review
// -----------------------------------------------------------------------------

export interface Review {
  id: string;
  productId: string;
  userId: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  response?: {
    comment: string;
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
  orderId?: string;
}

// -----------------------------------------------------------------------------
// Order
// -----------------------------------------------------------------------------

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  couponCode?: string;
  couponDiscount?: number;
  notes?: string;
  cancellationReason?: string;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryAt?: string;
  trackingNumber?: string;
  carrier?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variantName?: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
  currency: string;
  storeId: string;
  storeName?: string;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  store?: string;
  user?: string;
  fromDate?: string;
  toDate?: string;
  minTotal?: number;
  maxTotal?: number;
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'grandTotal' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
    variantAttributes?: Record<string, string>;
  }>;
  shippingAddress?: {
    fullName: string;
    phone: string;
    city: string;
    street: string;
    country?: string;
    governorate?: string;
  };
  shippingAddressId?: string;
  billingAddressId?: string;
  couponCode?: string;
  notes?: string;
  paymentMethod: string;
  shippingMethod?: string;
  currency?: string;
}

export interface OrderStatusEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Cart
// -----------------------------------------------------------------------------

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  itemCount: number;
  expiresAt?: string;
  updatedAt: string;
  discount?: number;
  tax?: number;
  shipping?: number;
  totals?: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variantName?: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  total: number;
  currency: string;
  storeId: string;
  storeName?: string;
  addedAt: string;
  stock?: number;
}

export interface AddToCartData {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  itemCount: number;
  savings: number;
}

// -----------------------------------------------------------------------------
// Wishlist
// -----------------------------------------------------------------------------

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
}

// -----------------------------------------------------------------------------
// Payment
// -----------------------------------------------------------------------------

export type PaymentStatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'apple_pay' | 'google_pay' | 'bank_transfer' | 'cash_on_delivery' | 'wallet';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatusType;
  method: PaymentMethod;
  gateway?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  cardLastFour?: string;
  cardBrand?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPaymentData {
  orderId: string;
  method: PaymentMethod;
  gateway?: string;
  cardToken?: string;
  saveCard?: boolean;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  supportsRefund: boolean;
  supportsSaveCard: boolean;
  supportedMethods: PaymentMethod[];
  config?: Record<string, unknown>;
  sortOrder: number;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gatewayRefundId?: string;
  processedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  storeId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  feeTotal: number;
  netAmount: number;
  processedAt?: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Shipping
// -----------------------------------------------------------------------------

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  serviceCode: string;
  estimatedDays: number;
  cost: number;
  currency: string;
  insuranceIncluded: boolean;
  trackingIncluded: boolean;
  isExpress: boolean;
}

export interface RateRequest {
  origin: Address;
  destination: Address;
  weight: number;
  weightUnit: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
    weight?: number;
  }>;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  status: 'pending' | 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  origin: Address;
  destination: Address;
  weight: number;
  weightUnit: string;
  cost: number;
  currency: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface TrackingResult {
  trackingNumber: string;
  carrier: string;
  status: Shipment['status'];
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  currentLocation?: string;
}

export interface Carrier {
  id: string;
  name: string;
  code: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  supportedServices: Array<{
    code: string;
    name: string;
    isExpress: boolean;
  }>;
}

// -----------------------------------------------------------------------------
// Subscription
// -----------------------------------------------------------------------------

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  productLimit: number;
  storageLimit: number; // in MB
  commissionRate: number; // percentage
  isActive: boolean;
  isPopular?: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  storeId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialEndsAt?: string;
  paymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// AI / Chat
// -----------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    products?: Product[];
    actions?: Array<{
      type: string;
      label: string;
      payload: Record<string, unknown>;
    }>;
  };
}

export interface ChatContext {
  sessionId?: string;
  previousMessages?: ChatMessage[];
  userId?: string;
  intent?: string;
  cartItems?: CartItem[];
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  suggestedActions?: Array<{
    type: string;
    label: string;
    payload: Record<string, unknown>;
  }>;
  relatedProducts?: Product[];
}

// -----------------------------------------------------------------------------
// Notification
// -----------------------------------------------------------------------------

export type NotificationType =
  | 'order'
  | 'payment'
  | 'shipping'
  | 'product'
  | 'review'
  | 'store'
  | 'promotion'
  | 'system'
  | 'chat';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  image?: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Currency
// -----------------------------------------------------------------------------

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  flag?: string;
  decimalPlaces: number;
  exchangeRate: number; // relative to base currency (OMR)
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  locale?: string;
  symbolPosition?: 'before' | 'after';
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: string;
}

// -----------------------------------------------------------------------------
// WhatsApp
// -----------------------------------------------------------------------------

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'buttons';
    text?: string;
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      value: string;
    }>;
  }>;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export interface Conversation {
  id: string;
  phone: string;
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

export interface AnalyticsData {
  period: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
    returnRate: number;
    revenueGrowth: number; // percentage
    orderGrowth: number;
  };
  dailyStats: Array<{
    date: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
  color?: string;
}

export interface TopProduct {
  productId: string;
  name: string;
  image?: string;
  totalSold: number;
  totalRevenue: number;
  currency: string;
}

export interface TopStore {
  storeId: string;
  name: string;
  logo?: string;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
  averageRating: number;
}

// -----------------------------------------------------------------------------
// Search
// -----------------------------------------------------------------------------

export interface SearchSuggestion {
  type: 'product' | 'category' | 'store';
  id: string;
  name: string;
  image?: string;
  slug: string;
}

export interface SearchFilters {
  type?: ('product' | 'category' | 'store')[];
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

// -----------------------------------------------------------------------------
// File / Upload
// -----------------------------------------------------------------------------

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Settings / Config
// -----------------------------------------------------------------------------

export interface AppSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  contactEmail: string;
  contactPhone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  supportedLanguages: Array<{
    code: string;
    name: string;
    isDefault: boolean;
  }>;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  maintenanceMode: boolean;
  allowVendorRegistration: boolean;
  commissionRate: number;
}
