import { apiClient } from '@/lib/api-client';
import { isDemoMode } from '@/lib/demo-mode';
import {
  getDemoLoyaltyAccount,
  getDemoPointsBalance,
  getDemoLoyaltyTier,
  demoRewards,
  demoPointsTransactions,
} from '@/lib/demo-admin-data';

export enum PointsTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
  REFERRAL = 'referral',
}

export enum RewardType {
  DISCOUNT = 'discount',
  FREE_SHIPPING = 'free_shipping',
  FREE_PRODUCT = 'free_product',
  CASHBACK = 'cashback',
}

export interface LoyaltyTier {
  name: string;
  nameAr?: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
  color?: string;
  icon?: string;
}

export interface LoyaltyAccount {
  id: string;
  userId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  currentTier: string;
  referralCode: string;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  accountId: string;
  type: PointsTransactionType;
  points: number;
  description: string;
  orderId: string | null;
  expiryDate: string | null;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  pointsCost: number;
  type: RewardType;
  discountAmount: number | null;
  discountPercent: number | null;
  minOrderAmount: number | null;
  stock: number | null;
  image: string | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  accountId: string;
  rewardId: string;
  pointsUsed: number;
  status: 'pending' | 'completed' | 'cancelled';
  code: string;
  usedAt: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface PointsBalance {
  available: number;
  total: number;
  lifetime: number;
  redeemed: number;
  tier: string;
}

export const loyaltyService = {
  getAccount: async (): Promise<LoyaltyAccount> => {
    if (isDemoMode()) return getDemoLoyaltyAccount();
    try {
      const res = await apiClient.get<LoyaltyAccount>('/loyalty/account');
      return res.data;
    } catch {
      return getDemoLoyaltyAccount();
    }
  },

  getBalance: async (): Promise<PointsBalance> => {
    if (isDemoMode()) return getDemoPointsBalance();
    try {
      const res = await apiClient.get<PointsBalance>('/loyalty/balance');
      return res.data;
    } catch {
      return getDemoPointsBalance();
    }
  },

  getRewards: async (_tier?: string): Promise<Reward[]> => {
    if (isDemoMode()) return demoRewards;
    try {
      const res = await apiClient.get<Reward[]>('/loyalty/rewards', { params: { tier: _tier } });
      return res.data;
    } catch {
      return demoRewards;
    }
  },

  redeemReward: async (rewardId: string): Promise<{
    redemption: RewardRedemption;
    remainingPoints: number;
  }> => {
    if (isDemoMode()) {
      return {
        redemption: {
          id: 'red-1',
          accountId: 'loyalty-1',
          rewardId,
          pointsUsed: 300,
          status: 'completed',
          code: 'DEMO-REWARD',
          usedAt: null,
          orderId: null,
          createdAt: new Date().toISOString(),
        },
        remainingPoints: 1550,
      };
    }
    const res = await apiClient.post<{ redemption: RewardRedemption; remainingPoints: number }>(
      '/loyalty/redeem',
      { rewardId }
    );
    return res.data;
  },

  getTransactions: async (page = 1, limit = 20): Promise<{
    items: PointsTransaction[];
    total: number;
  }> => {
    if (isDemoMode()) {
      return { items: demoPointsTransactions, total: demoPointsTransactions.length };
    }
    try {
      const res = await apiClient.get<{ items: PointsTransaction[]; total: number }>(
        '/loyalty/transactions',
        { params: { page, limit } }
      );
      return res.data;
    } catch {
      return { items: demoPointsTransactions, total: demoPointsTransactions.length };
    }
  },

  getReferralCode: async (): Promise<{ code: string; url: string }> => {
    if (isDemoMode()) {
      return { code: 'BHD-REF-2026', url: 'https://bhd.om/ref/BHD-REF-2026' };
    }
    try {
      const res = await apiClient.get<{ code: string; url: string }>('/loyalty/referral');
      return res.data;
    } catch {
      return { code: 'BHD-REF-2026', url: 'https://bhd.om/ref/BHD-REF-2026' };
    }
  },

  applyReferral: async (_referralCode: string): Promise<{
    success: boolean;
    bonus: number;
  }> => {
    if (isDemoMode()) return { success: true, bonus: 100 };
    const res = await apiClient.post<{ success: boolean; bonus: number }>(
      '/loyalty/referral/apply',
      { referralCode: _referralCode }
    );
    return res.data;
  },

  getTier: async (): Promise<{
    tier: string;
    tierData: LoyaltyTier | null;
  }> => {
    if (isDemoMode()) return getDemoLoyaltyTier();
    try {
      const res = await apiClient.get<{ tier: string; tierData: LoyaltyTier | null }>('/loyalty/tier');
      return res.data;
    } catch {
      return getDemoLoyaltyTier();
    }
  },
};
