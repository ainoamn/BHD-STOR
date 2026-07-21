'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserAchievements,
  getUserBadges,
  getLeaderboard,
  getActiveChallenges,
  getUserChallenges,
  getUserStats,
  joinChallenge,
  equipBadge,
  trackProgress,
} from '@/services/gamification.service';

export interface UserGamificationStats {
  totalPoints: number;
  rank: number;
  achievementsCount: number;
  totalAchievements: number;
  badgesCount: number;
  currentStreak: number;
  level: number;
  xpToNextLevel: number;
}

export function useGamification() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user ID from auth context or localStorage
  const getUserId = useCallback((): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';
    }
    return '00000000-0000-0000-0000-000000000000';
  }, []);

  const userId = getUserId();

  // ─── Queries ──────────────────────────────────────────────────────

  const {
    data: userAchievements,
    isLoading: achievementsLoading,
    error: achievementsError,
  } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => getUserAchievements(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: userBadges,
    isLoading: badgesLoading,
  } = useQuery({
    queryKey: ['badges', userId],
    queryFn: () => getUserBadges(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: leaderboard,
    isLoading: leaderboardLoading,
  } = useQuery({
    queryKey: ['leaderboard', 'all_time'],
    queryFn: () => getLeaderboard('all_time', 50),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const {
    data: activeChallenges,
    isLoading: challengesLoading,
  } = useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: () => getActiveChallenges(),
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: userChallenges,
    isLoading: userChallengesLoading,
  } = useQuery({
    queryKey: ['userChallenges', userId],
    queryFn: () => getUserChallenges(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: userStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => getUserStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  // ─── Mutations ────────────────────────────────────────────────────

  const joinChallengeMutation = useMutation({
    mutationFn: (challengeId: string) => joinChallenge(userId, challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChallenges', userId] });
      queryClient.invalidateQueries({ queryKey: ['challenges', 'active'] });
    },
  });

  const equipBadgeMutation = useMutation({
    mutationFn: (badgeId: string) => equipBadge(userId, badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });
    },
  });

  const trackProgressMutation = useMutation({
    mutationFn: ({ action, value }: { action: string; value?: number }) =>
      trackProgress(userId, action, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', userId] });
      queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  // ─── Actions ──────────────────────────────────────────────────────

  const handleJoinChallenge = useCallback(
    async (challengeId: string) => {
      await joinChallengeMutation.mutateAsync(challengeId);
    },
    [joinChallengeMutation],
  );

  const handleEquipBadge = useCallback(
    async (badgeId: string) => {
      await equipBadgeMutation.mutateAsync(badgeId);
    },
    [equipBadgeMutation],
  );

  const handleTrackProgress = useCallback(
    async (action: string, value?: number) => {
      await trackProgressMutation.mutateAsync({ action, value });
    },
    [trackProgressMutation],
  );

  // ─── Computed ─────────────────────────────────────────────────────

  const isLoading =
    achievementsLoading ||
    badgesLoading ||
    leaderboardLoading ||
    challengesLoading ||
    userChallengesLoading ||
    statsLoading;

  const error = achievementsError;

  // ─── Effects ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isInitialized && userId) {
      setIsInitialized(true);
    }
  }, [userId, isInitialized]);

  return {
    // Data
    userAchievements,
    userBadges,
    leaderboard,
    activeChallenges,
    userChallenges,
    userStats: userStats as UserGamificationStats | undefined,

    // Loading
    isLoading,
    error,

    // Actions
    joinChallenge: handleJoinChallenge,
    equipBadge: handleEquipBadge,
    trackProgress: handleTrackProgress,

    // Mutation states
    isJoining: joinChallengeMutation.isPending,
    isEquipping: equipBadgeMutation.isPending,
    isTracking: trackProgressMutation.isPending,
  };
}
