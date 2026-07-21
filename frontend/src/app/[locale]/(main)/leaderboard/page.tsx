'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LeaderboardTable } from '@/components/gamification/LeaderboardTable';
import { useGamification } from '@/hooks/useGamification';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Crown, Medal, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const t = useTranslations('gamification');
  const { leaderboard, userStats, isLoading } = useGamification();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');

  const filteredLeaderboard = leaderboard?.filter((entry) => entry.period === period) || [];

  const topThree = filteredLeaderboard.slice(0, 3);
  const rest = filteredLeaderboard.slice(3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          {t('leaderboard.title')}
        </h1>
        <p className="text-muted-foreground">{t('leaderboard.subtitle')}</p>
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="mb-8">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="daily">{t('leaderboard.daily')}</TabsTrigger>
          <TabsTrigger value="weekly">{t('leaderboard.weekly')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('leaderboard.monthly')}</TabsTrigger>
          <TabsTrigger value="all_time">{t('leaderboard.allTime')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Podium - Top 3 */}
      {topThree.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-10">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
                <Medal className="w-10 h-10 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-600">#2</div>
              <div className="text-sm font-medium">{topThree[1].userId?.slice(0, 8)}</div>
              <div className="text-lg font-bold text-primary">{topThree[1].points.toLocaleString()} XP</div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="order-1 md:order-2 flex flex-col items-center -mt-4">
              <Crown className="w-8 h-8 text-yellow-500 mb-1" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 flex items-center justify-center mb-2 shadow-xl ring-4 ring-yellow-200">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">#1</div>
              <div className="text-sm font-medium">{topThree[0].userId?.slice(0, 8)}</div>
              <div className="text-xl font-bold text-primary">{topThree[0].points.toLocaleString()} XP</div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="order-3 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-600 to-amber-700 flex items-center justify-center mb-2 shadow-lg">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div className="text-lg font-bold text-amber-700">#3</div>
              <div className="text-sm font-medium">{topThree[2].userId?.slice(0, 8)}</div>
              <div className="text-lg font-bold text-primary">{topThree[2].points.toLocaleString()} XP</div>
            </div>
          )}
        </div>
      )}

      {/* Full Table */}
      <LeaderboardTable entries={rest} userRank={userStats?.rank} />

      {filteredLeaderboard.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('leaderboard.empty')}</p>
        </div>
      )}
    </div>
  );
}
