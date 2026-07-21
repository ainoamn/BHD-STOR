'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LevelProgressProps {
  level: number;
  xp: number;
  xpToNext: number;
  compact?: boolean;
}

function getLevelTitle(level: number): string {
  if (level >= 50) return 'Legend';
  if (level >= 40) return 'Grandmaster';
  if (level >= 30) return 'Master';
  if (level >= 20) return 'Expert';
  if (level >= 10) return 'Veteran';
  if (level >= 5) return 'Regular';
  return 'Novice';
}

function getLevelColor(level: number): string {
  if (level >= 50) return '#DC2626';
  if (level >= 40) return '#EA580C';
  if (level >= 30) return '#D97706';
  if (level >= 20) return '#059669';
  if (level >= 10) return '#2563EB';
  if (level >= 5) return '#7C3AED';
  return '#6B7280';
}

export function LevelProgress({ level, xp, xpToNext, compact = false }: LevelProgressProps) {
  const levelTitle = getLevelTitle(level);
  const levelColor = getLevelColor(level);
  const xpInLevel = xp % 100;
  const progressPercentage = Math.min(100, Math.max(0, 100 - (xpToNext / 100) * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: levelColor }}
        >
          {level}
        </div>
        <div className="w-24">
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border rounded-xl p-4 min-w-[200px]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: levelColor + '20' }}
          >
            <Star className="w-5 h-5" style={{ color: levelColor }} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">Level {level}</span>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </motion.div>
            </div>
            <span className="text-xs text-muted-foreground">{levelTitle}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold">{xp.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground"> XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress value={progressPercentage} className="h-2.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{xpInLevel} / 100 XP</span>
          <span className="flex items-center gap-0.5">
            <ArrowUp className="w-3 h-3" />
            {xpToNext} to Level {level + 1}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function LevelBadge({ level, showTitle = false }: { level: number; showTitle?: boolean }) {
  const levelColor = getLevelColor(level);
  const levelTitle = getLevelTitle(level);

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
        style={{ backgroundColor: levelColor }}
      >
        {level}
      </div>
      {showTitle && (
        <span className="text-xs font-medium text-muted-foreground">{levelTitle}</span>
      )}
    </div>
  );
}
