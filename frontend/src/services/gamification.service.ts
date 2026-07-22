import { apiClient } from '@/lib/api-client';
import { isDemoMode } from '@/lib/demo-mode';
import {
  getDemoUserAchievements,
  demoLeaderboard,
  demoChallenges,
  getDemoUserChallenges,
  getDemoGamificationStats,
  getDemoUserBadges,
  demoAchievements,
} from '@/lib/demo-admin-data';

// ─── Types ──────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: 'orders' | 'reviews' | 'social' | 'exploration' | 'streak' | 'special';
  icon: string;
  color: string;
  pointsAwarded: number;
  conditionType: 'count' | 'amount' | 'streak' | 'first_time' | 'social';
  conditionValue: number;
  conditionEntity: string;
  isSecret: boolean;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  achievement: Achievement;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  points: number;
  rank: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  equipped: boolean;
  earnedAt: string;
  badge: Badge;
}

export interface Challenge {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  condition: Record<string, unknown>;
  rewardPoints: number;
  rewardBadgeId: string | null;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  participants: number;
  active: boolean;
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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

// ─── API Functions ──────────────────────────────────────────────────

const BASE_PATH = '/gamification';

// Achievements
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  if (isDemoMode()) return getDemoUserAchievements(userId);
  try {
    const response = await apiClient.get<UserAchievement[]>(`${BASE_PATH}/users/${userId}/achievements`);
    return response.data;
  } catch {
    return getDemoUserAchievements(userId);
  }
}

export async function getAllAchievements(): Promise<Achievement[]> {
  if (isDemoMode()) return demoAchievements;
  try {
    const response = await apiClient.get<Achievement[]>(`${BASE_PATH}/achievements`);
    return response.data;
  } catch {
    return demoAchievements;
  }
}

export async function trackProgress(
  userId: string,
  action: string,
  value?: number,
): Promise<UserAchievement[]> {
  const response = await apiClient.post<UserAchievement[]>(`${BASE_PATH}/track-progress`, {
    userId,
    action,
    value: value ?? 1,
  });
  return response.data;
}

export async function checkAchievements(userId: string): Promise<UserAchievement[]> {
  const response = await apiClient.post<UserAchievement[]>(
    `${BASE_PATH}/check-achievements/${userId}`,
  );
  return response.data;
}

// Leaderboard
export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
  _limit: number = 50,
): Promise<LeaderboardEntry[]> {
  if (isDemoMode()) return demoLeaderboard;
  try {
    const response = await apiClient.get<LeaderboardEntry[]>(`${BASE_PATH}/leaderboard`, {
      params: { period, limit: _limit },
    });
    return response.data;
  } catch {
    return demoLeaderboard;
  }
}

// Badges
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  if (isDemoMode()) return getDemoUserBadges(userId);
  try {
    const response = await apiClient.get<UserBadge[]>(`${BASE_PATH}/users/${userId}/badges`);
    return response.data;
  } catch {
    return getDemoUserBadges(userId);
  }
}

export async function equipBadge(userId: string, badgeId: string): Promise<UserBadge> {
  const response = await apiClient.post<UserBadge>(`${BASE_PATH}/equip-badge`, {
    userId,
    badgeId,
  });
  return response.data;
}

// Challenges
export async function getActiveChallenges(): Promise<Challenge[]> {
  if (isDemoMode()) return demoChallenges;
  try {
    const response = await apiClient.get<Challenge[]>(`${BASE_PATH}/challenges`);
    return response.data;
  } catch {
    return demoChallenges;
  }
}

export async function joinChallenge(
  userId: string,
  challengeId: string,
): Promise<ChallengeParticipant> {
  const response = await apiClient.post<ChallengeParticipant>(
    `${BASE_PATH}/join-challenge`,
    {
      userId,
      challengeId,
    },
  );
  return response.data;
}

export async function getUserChallenges(userId: string): Promise<ChallengeParticipant[]> {
  if (isDemoMode()) return getDemoUserChallenges(userId);
  try {
    const response = await apiClient.get<ChallengeParticipant[]>(`${BASE_PATH}/users/${userId}/challenges`);
    return response.data;
  } catch {
    return getDemoUserChallenges(userId);
  }
}

export async function getUserStats(userId: string): Promise<UserGamificationStats> {
  if (isDemoMode()) return getDemoGamificationStats(userId);
  try {
    const response = await apiClient.get<UserGamificationStats>(`${BASE_PATH}/users/${userId}/stats`);
    return response.data;
  } catch {
    return getDemoGamificationStats(userId);
  }
}

// Points
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
): Promise<LeaderboardEntry> {
  const response = await apiClient.post<LeaderboardEntry>(`${BASE_PATH}/award-points`, {
    userId,
    points,
    reason,
  });
  return response.data;
}
