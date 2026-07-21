import type {
  LoyaltyAccount,
  PointsBalance,
  PointsTransaction,
  Reward,
  LoyaltyTier,
} from "@/services/loyalty.service";
import type {
  ReturnRequest,
} from "@/services/returns.service";
import {
  ReturnStatus,
  ReturnType,
  ReturnReason,
  RefundMethod,
} from "@/services/returns.service";
import type {
  Achievement,
  UserAchievement,
  LeaderboardEntry,
  Challenge,
  ChallengeParticipant,
  UserGamificationStats,
  Badge,
  UserBadge,
} from "@/services/gamification.service";

// ─── Admin Dashboard ───────────────────────────────────────────────

export interface DemoAdminStats {
  totalRevenue: number;
  revenueChange: number;
  totalUsers: number;
  usersChange: number;
  totalStores: number;
  storesChange: number;
  totalOrders: number;
  ordersChange: number;
}

export interface DemoAdminAnalytics {
  salesChart: Array<{ date: string; revenue: number; orders: number }>;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
}

export interface DemoAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  status: string;
  total: number;
  currency: string;
  itemsCount: number;
  createdAt: string;
}

export interface DemoAdminStore {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  productsCount: number;
  revenue: number;
  rating: number;
  createdAt: string;
}

export interface DemoAdminProduct {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  storeName: string;
  price: number;
  stock: number;
  status: string;
  category: string;
  createdAt: string;
}

export interface DemoAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

export function getDemoAdminStats(): DemoAdminStats {
  return {
    totalRevenue: 45280.5,
    revenueChange: 12.4,
    totalUsers: 1847,
    usersChange: 8.2,
    totalStores: 42,
    storesChange: 5.1,
    totalOrders: 326,
    ordersChange: 15.7,
  };
}

export function getDemoAdminAnalytics(): DemoAdminAnalytics {
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
  return {
    salesChart: months.map((date, i) => ({
      date,
      revenue: 5200 + i * 1200 + Math.random() * 800,
      orders: 28 + i * 12,
    })),
    categoryBreakdown: [
      { name: "مواد غذائية", value: 35, color: "#2ECC71" },
      { name: "حرف عمانية", value: 25, color: "#3498DB" },
      { name: "جمال وعناية", value: 20, color: "#9B59B6" },
      { name: "إلكترونيات", value: 12, color: "#E74C3C" },
      { name: "أخرى", value: 8, color: "#95A5A6" },
    ],
  };
}

export const demoAdminOrders: DemoAdminOrder[] = [
  {
    id: "ord-001",
    orderNumber: "BHD-2026-001",
    customerName: "أحمد المعمري",
    customerEmail: "ahmed@example.om",
    storeName: "سوق مسقط",
    status: "delivered",
    total: 45.5,
    currency: "OMR",
    itemsCount: 2,
    createdAt: "2026-07-08T10:30:00Z",
  },
  {
    id: "ord-002",
    orderNumber: "BHD-2026-002",
    customerName: "فاطمة الحارثية",
    customerEmail: "fatima@example.om",
    storeName: "تراث نزوى",
    status: "processing",
    total: 28.9,
    currency: "OMR",
    itemsCount: 1,
    createdAt: "2026-07-08T14:15:00Z",
  },
  {
    id: "ord-003",
    orderNumber: "BHD-2026-003",
    customerName: "سالم البلوشي",
    customerEmail: "salim@example.om",
    storeName: "هدايا صلالة",
    status: "pending",
    total: 67.25,
    currency: "OMR",
    itemsCount: 3,
    createdAt: "2026-07-07T09:00:00Z",
  },
  {
    id: "ord-004",
    orderNumber: "BHD-2026-004",
    customerName: "مريم الشحية",
    customerEmail: "mariam@example.om",
    storeName: "عطور الخليج",
    status: "shipped",
    total: 19.99,
    currency: "OMR",
    itemsCount: 1,
    createdAt: "2026-07-06T16:45:00Z",
  },
  {
    id: "ord-005",
    orderNumber: "BHD-2026-005",
    customerName: "خالد الرواحي",
    customerEmail: "khalid@example.om",
    storeName: "سوق مسقط",
    status: "cancelled",
    total: 12.0,
    currency: "OMR",
    itemsCount: 1,
    createdAt: "2026-07-05T11:20:00Z",
  },
];

export const demoPendingStores: DemoAdminStore[] = [
  {
    id: "store-pending-1",
    name: "Omani Crafts Hub",
    nameAr: "مركز الحرف العمانية",
    slug: "omani-crafts-hub",
    ownerName: "يوسف الهنائي",
    ownerEmail: "yousef@crafts.om",
    status: "pending",
    productsCount: 0,
    revenue: 0,
    rating: 0,
    createdAt: "2026-07-07T08:00:00Z",
  },
  {
    id: "store-pending-2",
    name: "Salalah Spices",
    nameAr: "بهارات صلالة",
    slug: "salalah-spices",
    ownerName: "عائشة اليعقوبية",
    ownerEmail: "aisha@spices.om",
    status: "pending",
    productsCount: 0,
    revenue: 0,
    rating: 0,
    createdAt: "2026-07-06T12:30:00Z",
  },
];

export const demoAdminStores: DemoAdminStore[] = [
  ...demoPendingStores,
  {
    id: "store-1",
    name: "Muscat Souq",
    nameAr: "سوق مسقط",
    slug: "muscat-souq",
    ownerName: "محمد السعيدي",
    ownerEmail: "mohammed@souq.om",
    status: "active",
    productsCount: 48,
    revenue: 12500,
    rating: 4.8,
    createdAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "store-2",
    name: "Nizwa Heritage",
    nameAr: "تراث نزوى",
    slug: "nizwa-heritage",
    ownerName: "علي البوسعيدي",
    ownerEmail: "ali@heritage.om",
    status: "active",
    productsCount: 32,
    revenue: 8900,
    rating: 4.6,
    createdAt: "2025-03-20T00:00:00Z",
  },
];

export const demoAdminProducts: DemoAdminProduct[] = [
  {
    id: "1",
    name: "Omani Dates Premium",
    nameAr: "تمور عمانية فاخرة",
    slug: "omani-dates",
    storeName: "سوق مسقط",
    price: 12.5,
    stock: 50,
    status: "active",
    category: "مواد غذائية",
    createdAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Frankincense Oil",
    nameAr: "زيت اللبان",
    slug: "frankincense-oil",
    storeName: "تراث نزوى",
    price: 8.9,
    stock: 30,
    status: "active",
    category: "جمال وعناية",
    createdAt: "2025-06-15T00:00:00Z",
  },
  {
    id: "3",
    name: "Silver Khanjar",
    nameAr: "خنجر فضي",
    slug: "silver-khanjar",
    storeName: "تراث نزوى",
    price: 45,
    stock: 5,
    status: "low_stock",
    category: "حرف عمانية",
    createdAt: "2025-07-01T00:00:00Z",
  },
];

export const demoAdminUsers: DemoAdminUser[] = [
  {
    id: "user-1",
    email: "ahmed@example.om",
    firstName: "أحمد",
    lastName: "المعمري",
    role: "customer",
    status: "active",
    createdAt: "2025-08-10T00:00:00Z",
  },
  {
    id: "user-2",
    email: "mohammed@souq.om",
    firstName: "محمد",
    lastName: "السعيدي",
    role: "vendor",
    status: "active",
    createdAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "demo-admin-1",
    email: "admin@bhd.om",
    firstName: "مدير",
    lastName: "النظام",
    role: "admin",
    status: "active",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

// ─── Loyalty ───────────────────────────────────────────────────────

export function getDemoLoyaltyAccount(): LoyaltyAccount {
  return {
    id: "loyalty-1",
    userId: "demo-user-1",
    totalPoints: 2450,
    availablePoints: 1850,
    lifetimePoints: 3200,
    redeemedPoints: 750,
    currentTier: "gold",
    referralCode: "BHD-REF-2026",
    referredBy: null,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-07-08T00:00:00Z",
  };
}

export function getDemoPointsBalance(): PointsBalance {
  return {
    available: 1850,
    total: 2450,
    lifetime: 3200,
    redeemed: 750,
    tier: "gold",
  };
}

export function getDemoLoyaltyTier(): { tier: string; tierData: LoyaltyTier } {
  return {
    tier: "gold",
    tierData: {
      name: "Gold",
      nameAr: "ذهبي",
      minPoints: 1500,
      multiplier: 1.5,
      benefits: ["شحن مجاني", "خصم 10%", "دعم أولوية"],
      color: "#FFD700",
      icon: "crown",
    },
  };
}

export const demoRewards: Reward[] = [
  {
    id: "reward-1",
    name: "10% Discount",
    nameAr: "خصم 10%",
    description: "خصم 10% على طلبك القادم",
    pointsCost: 500,
    type: "discount" as Reward["type"],
    discountAmount: null,
    discountPercent: 10,
    minOrderAmount: 10,
    stock: 100,
    image: null,
    active: true,
    startDate: "2026-01-01T00:00:00Z",
    endDate: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "reward-2",
    name: "Free Shipping",
    nameAr: "شحن مجاني",
    description: "شحن مجاني لطلب واحد",
    pointsCost: 300,
    type: "free_shipping" as Reward["type"],
    discountAmount: null,
    discountPercent: null,
    minOrderAmount: 5,
    stock: 50,
    image: null,
    active: true,
    startDate: "2026-01-01T00:00:00Z",
    endDate: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

export const demoPointsTransactions: PointsTransaction[] = [
  {
    id: "pt-1",
    accountId: "loyalty-1",
    type: "earn" as PointsTransaction["type"],
    points: 150,
    description: "شراء طلب BHD-2026-001",
    orderId: "ord-001",
    expiryDate: null,
    createdAt: "2026-07-08T10:30:00Z",
  },
  {
    id: "pt-2",
    accountId: "loyalty-1",
    type: "redeem" as PointsTransaction["type"],
    points: -300,
    description: "استبدال مكافأة شحن مجاني",
    orderId: null,
    expiryDate: null,
    createdAt: "2026-07-05T14:00:00Z",
  },
  {
    id: "pt-3",
    accountId: "loyalty-1",
    type: "bonus" as PointsTransaction["type"],
    points: 100,
    description: "مكافأة ترحيبية",
    orderId: null,
    expiryDate: null,
    createdAt: "2026-06-01T00:00:00Z",
  },
];

// ─── Returns ───────────────────────────────────────────────────────

export const demoReturns: ReturnRequest[] = [
  {
    id: "ret-001",
    orderId: "ord-001",
    userId: "demo-user-1",
    productId: "1",
    type: ReturnType.RETURN,
    reason: ReturnReason.DEFECTIVE,
    description: "المنتج وصل تالفاً",
    status: ReturnStatus.PENDING,
    images: [],
    refundAmount: 12.5,
    refundMethod: RefundMethod.ORIGINAL_PAYMENT,
    exchangeProductId: null,
    exchangeVariant: null,
    pickupAddress: {
      fullName: "أحمد المعمري",
      phone: "+96891234567",
      address: "شارع السلطان قابوس",
      city: "مسقط",
      governorate: "مسقط",
    },
    pickupDate: null,
    trackingNumber: null,
    adminNotes: null,
    timeline: [
      {
        status: ReturnStatus.PENDING,
        note: "تم تقديم طلب الإرجاع",
        timestamp: "2026-07-08T11:00:00Z",
      },
    ],
    createdAt: "2026-07-08T11:00:00Z",
    updatedAt: "2026-07-08T11:00:00Z",
  },
  {
    id: "ret-002",
    orderId: "ord-002",
    userId: "demo-user-1",
    productId: "2",
    type: ReturnType.EXCHANGE,
    reason: ReturnReason.WRONG_ITEM,
    description: "استلمت منتجاً مختلفاً",
    status: ReturnStatus.APPROVED,
    images: [],
    refundAmount: 0,
    refundMethod: RefundMethod.ORIGINAL_PAYMENT,
    exchangeProductId: "2",
    exchangeVariant: null,
    pickupAddress: null,
    pickupDate: "2026-07-10T09:00:00Z",
    trackingNumber: "TRK-789456",
    adminNotes: "تمت الموافقة",
    timeline: [
      {
        status: ReturnStatus.PENDING,
        note: "تم تقديم الطلب",
        timestamp: "2026-07-06T10:00:00Z",
      },
      {
        status: ReturnStatus.APPROVED,
        note: "تمت الموافقة على الطلب",
        timestamp: "2026-07-07T09:00:00Z",
        actor: "admin",
      },
    ],
    createdAt: "2026-07-06T10:00:00Z",
    updatedAt: "2026-07-07T09:00:00Z",
  },
];

// ─── Gamification ──────────────────────────────────────────────────

export const demoAchievements: Achievement[] = [
  {
    id: "ach-1",
    code: "first_order",
    name: "First Order",
    nameAr: "أول طلب",
    description: "أكمل أول طلب لك",
    descriptionAr: "أكمل أول طلب لك على المنصة",
    category: "orders",
    icon: "shopping-bag",
    color: "#2ECC71",
    pointsAwarded: 100,
    conditionType: "first_time",
    conditionValue: 1,
    conditionEntity: "order",
    isSecret: false,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ach-2",
    code: "reviewer",
    name: "Reviewer",
    nameAr: "مُقيّم",
    description: "اكتب 5 تقييمات",
    descriptionAr: "اكتب 5 تقييمات للمنتجات",
    category: "reviews",
    icon: "star",
    color: "#F39C12",
    pointsAwarded: 200,
    conditionType: "count",
    conditionValue: 5,
    conditionEntity: "review",
    isSecret: false,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ach-3",
    code: "explorer",
    name: "Explorer",
    nameAr: "مستكشف",
    description: "تصفح 20 منتجاً",
    descriptionAr: "تصفح 20 منتجاً مختلفاً",
    category: "exploration",
    icon: "eye",
    color: "#3498DB",
    pointsAwarded: 150,
    conditionType: "count",
    conditionValue: 20,
    conditionEntity: "product_view",
    isSecret: false,
    createdAt: "2025-01-01T00:00:00Z",
  },
];

export function getDemoUserAchievements(userId: string): UserAchievement[] {
  return demoAchievements.map((ach, i) => ({
    id: `ua-${i}`,
    userId,
    achievementId: ach.id,
    progress: i === 0 ? 1 : i === 1 ? 3 : 12,
    target: ach.conditionValue,
    completed: i === 0,
    completedAt: i === 0 ? "2026-06-15T00:00:00Z" : null,
    createdAt: "2025-06-01T00:00:00Z",
    achievement: ach,
  }));
}

export const demoLeaderboard: LeaderboardEntry[] = [
  {
    id: "lb-1",
    userId: "user-1",
    period: "all_time",
    points: 3200,
    rank: 1,
    periodStart: "2025-01-01T00:00:00Z",
    periodEnd: "2026-12-31T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-07-08T00:00:00Z",
  },
  {
    id: "lb-2",
    userId: "user-2",
    period: "all_time",
    points: 2450,
    rank: 2,
    periodStart: "2025-01-01T00:00:00Z",
    periodEnd: "2026-12-31T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-07-08T00:00:00Z",
  },
  {
    id: "lb-3",
    userId: "demo-user-1",
    period: "all_time",
    points: 1850,
    rank: 3,
    periodStart: "2025-01-01T00:00:00Z",
    periodEnd: "2026-12-31T00:00:00Z",
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-07-08T00:00:00Z",
  },
];

export const demoChallenges: Challenge[] = [
  {
    id: "ch-1",
    name: "Weekly Shopper",
    nameAr: "متسوق الأسبوع",
    description: "أكمل 3 طلبات هذا الأسبوع",
    type: "weekly",
    condition: { orders: 3 },
    rewardPoints: 500,
    rewardBadgeId: null,
    startDate: "2026-07-07T00:00:00Z",
    endDate: "2026-07-14T00:00:00Z",
    maxParticipants: null,
    participants: 128,
    active: true,
    createdAt: "2026-07-07T00:00:00Z",
  },
  {
    id: "ch-2",
    name: "Daily Login",
    nameAr: "تسجيل يومي",
    description: "سجّل دخولك 7 أيام متتالية",
    type: "daily",
    condition: { streak: 7 },
    rewardPoints: 200,
    rewardBadgeId: null,
    startDate: "2026-07-01T00:00:00Z",
    endDate: "2026-07-31T00:00:00Z",
    maxParticipants: null,
    participants: 456,
    active: true,
    createdAt: "2026-07-01T00:00:00Z",
  },
];

export function getDemoUserChallenges(userId: string): ChallengeParticipant[] {
  return [
    {
      id: "cp-1",
      userId,
      challengeId: "ch-1",
      progress: 2,
      completed: false,
      completedAt: null,
      createdAt: "2026-07-07T00:00:00Z",
      updatedAt: "2026-07-08T00:00:00Z",
    },
  ];
}

export function getDemoGamificationStats(userId: string): UserGamificationStats {
  return {
    totalPoints: 1850,
    rank: 3,
    achievementsCount: 1,
    totalAchievements: demoAchievements.length,
    badgesCount: 2,
    currentStreak: 5,
    level: 4,
    xpToNextLevel: 350,
  };
}

export const demoBadges: Badge[] = [
  {
    id: "badge-1",
    code: "early_bird",
    name: "Early Bird",
    nameAr: "الطائر المبكر",
    description: "انضممت في أول 100 مستخدم",
    icon: "bird",
    color: "#E74C3C",
    rarity: "rare",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

export function getDemoUserBadges(userId: string): UserBadge[] {
  return [
    {
      id: "ub-1",
      userId,
      badgeId: "badge-1",
      equipped: true,
      earnedAt: "2025-06-01T00:00:00Z",
      badge: demoBadges[0],
    },
  ];
}

// ─── Customer Orders (demo) ────────────────────────────────────────

export interface DemoCustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  itemsCount: number;
  storeName: string;
  createdAt: string;
}

export const demoCustomerOrders: DemoCustomerOrder[] = [
  {
    id: "ord-001",
    orderNumber: "BHD-2026-001",
    status: "delivered",
    total: 45.5,
    currency: "OMR",
    itemsCount: 2,
    storeName: "سوق مسقط",
    createdAt: "2026-07-08T10:30:00Z",
  },
  {
    id: "ord-002",
    orderNumber: "BHD-2026-002",
    status: "processing",
    total: 28.9,
    currency: "OMR",
    itemsCount: 1,
    storeName: "تراث نزوى",
    createdAt: "2026-07-08T14:15:00Z",
  },
];
