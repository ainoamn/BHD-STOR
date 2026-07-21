'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { useGamification } from '@/hooks/useGamification';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Target, Flame, Calendar, Zap } from 'lucide-react';
import { useState } from 'react';

export default function ChallengesPage() {
  const t = useTranslations('gamification');
  const { activeChallenges, userChallenges, isLoading, joinChallenge } = useGamification();
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');

  const filteredChallenges = activeChallenges?.filter((c) => {
    if (filter === 'all') return true;
    return c.type === filter;
  }) || [];

  const isJoined = (challengeId: string) => {
    return userChallenges?.some((uc) => uc.challengeId === challengeId) || false;
  };

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
            <Target className="w-8 h-8 text-red-500" />
            {t('challenges.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('challenges.subtitle')}</p>
        </div>
        <PointsDisplay />
      </div>

      {/* My Active Challenges */}
      {userChallenges && userChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {t('challenges.myChallenges')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userChallenges.slice(0, 3).map((uc) => {
              const challenge = activeChallenges?.find((c) => c.id === uc.challengeId);
              if (!challenge) return null;
              return (
                <ChallengeCard
                  key={uc.id}
                  challenge={challenge}
                  isJoined={true}
                  progress={uc.progress}
                  onJoin={() => {}}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">{t('challenges.all')}</TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {t('challenges.daily')}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {t('challenges.weekly')}
            </TabsTrigger>
            <TabsTrigger value="special" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {t('challenges.special')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            isJoined={isJoined(challenge.id)}
            onJoin={() => joinChallenge(challenge.id)}
          />
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('challenges.empty')}</p>
        </div>
      )}
    </div>
  );
}
