'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { loyaltyService, LoyaltyAccount, PointsTransaction, Reward, PointsBalance } from '@/services/loyalty.service';

const LOYALTY_KEY = 'loyalty';

export function useLoyaltyAccount(options?: UseQueryOptions<LoyaltyAccount>) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'account'],
    queryFn: () => loyaltyService.getAccount(),
    ...options,
  });
}

export function usePointsBalance(options?: UseQueryOptions<PointsBalance>) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'balance'],
    queryFn: () => loyaltyService.getBalance(),
    ...options,
  });
}

export function useRewards(tier?: string, options?: UseQueryOptions<Reward[]>) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'rewards', tier],
    queryFn: () => loyaltyService.getRewards(tier),
    ...options,
  });
}

export function useTransactions(page = 1, limit = 20, options?: UseQueryOptions<{ items: PointsTransaction[]; total: number }>) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'transactions', page, limit],
    queryFn: () => loyaltyService.getTransactions(page, limit),
    ...options,
  });
}

export function useReferralCode(options?: UseQueryOptions<{ code: string; url: string }>) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'referral'],
    queryFn: () => loyaltyService.getReferralCode(),
    ...options,
  });
}

export function useTier(options?: UseQueryOptions<{ tier: string; tierData: any }>) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'tier'],
    queryFn: () => loyaltyService.getTier(),
    ...options,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => loyaltyService.redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY] });
    },
  });
}

export function useApplyReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (referralCode: string) => loyaltyService.applyReferral(referralCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY] });
    },
  });
}
