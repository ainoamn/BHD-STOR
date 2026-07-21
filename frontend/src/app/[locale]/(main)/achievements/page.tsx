'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { useGamification } from '@/hooks/useGamification';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Lock, Unlock, Flame, Star, Eye, MessageSquare, ShoppingBag, Zap } from 'lucide-react';

type AchievementCategory = 'all' | 'orders' | 'reviews' | 'social' | 'exploration' | 'streak' | 'special';

const categoryIcons: Record<string, React.ReactNode> = {
  orders: <ShoppingBag className="w-4 h-4" />,
  reviews: <MessageSquare className="w-4 h-4" />,
  social: <Star className="w-4 h-4" />,
  exploration: <Eye className="w-4 h-4" />,
  streak: <Flame className="w-4 h-4" />,
  special: <Zap className="w-4 h-4" />,
};

export default function AchievementsPage() {
  const t = useTranslations('gamification');
  const { userAchievements, userStats, isLoading } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');
  const [showLocked, setShowLocked] = useState(true);

  const filteredAchievements = userAchievements?.filter((ua) => {
    if (selectedCategory !== 'all' && ua.achievement?.category !== selectedCategory) return false;
    if (!showLocked && !ua.completed) return false;
    return true;
  }) || [];

  const completedCount = userAchievements?.filter((ua) => ua.completed).length || 0;
  const totalCount = userAchievements?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            {t('achievements.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('achievements.subtitle', { completed: completedCount, total: totalCount })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PointsDisplay />
          {userStats && <LevelProgress level={userStats.level} xp={userStats.totalPoints} xpToNext={userStats.xpToNextLevel} />}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{completedCount}</div>
          <div className="text-sm text-muted-foreground">{t('achievements.completed')}</div>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{totalCount - completedCount}</div>
          <div className="text-sm text-muted-foreground">{t('achievements.remaining')}</div>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{userStats?.badgesCount || 0}</div>
          <div className="text-sm text-muted-foreground">{t('badges.title')}</div>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{userStats?.currentStreak || 0}d</div>
          <div className="text-sm text-muted-foreground">{t('streak.current')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as AchievementCategory)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">{t('categories.all')}</TabsTrigger>
            {(['orders', 'reviews', 'social', 'exploration', 'streak'] as const).map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                {categoryIcons[cat]}
                {t(`categories.${cat}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <button
          onClick={() => setShowLocked(!showLocked)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
        >
          {showLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {showLocked ? t('filters.hideLocked') : t('filters.showLocked')}
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((userAchievement) => (
          <AchievementCard
            key={userAchievement.id}
            userAchievement={userAchievement}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('achievements.empty')}</p>
        </div>
      )}
    </div>
  );
}
