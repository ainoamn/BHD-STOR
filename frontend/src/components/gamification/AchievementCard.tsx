'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Star, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  icon: string;
  color: string;
  pointsAwarded: number;
  conditionType: string;
  conditionValue: number;
  isSecret: boolean;
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
  achievement: Achievement;
}

interface AchievementCardProps {
  userAchievement: UserAchievement;
}

export function AchievementCard({ userAchievement }: AchievementCardProps) {
  const { achievement, progress, target, completed } = userAchievement;
  const percentage = Math.min(100, Math.round((progress / target) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-xl border-2 p-5 transition-all ${
        completed
          ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20'
          : 'border-muted bg-card hover:border-primary/50'
      }`}
    >
      {/* Completed Badge */}
      {completed && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Secret Overlay */}
      {achievement.isSecret && !completed && (
        <div className="absolute inset-0 bg-muted/80 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-sm">
          <Lock className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium text-muted-foreground">Secret Achievement</span>
          <span className="text-xs text-muted-foreground">Complete tasks to unlock</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ backgroundColor: achievement.color + '20' }}
        >
          <Star className="w-7 h-7" style={{ color: achievement.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{achievement.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {achievement.description}
          </p>

          {/* Points */}
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600">
              +{achievement.pointsAwarded} XP
            </span>
          </div>

          {/* Progress */}
          {!completed ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{progress} / {target}</span>
                <span className="font-medium text-primary">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
              <Check className="w-3 h-3" />
              Completed
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
