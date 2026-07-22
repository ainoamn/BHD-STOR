'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Trophy, Target, Calendar, Zap, Check, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/Button';

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SPECIAL = 'special',
}

interface Challenge {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  type: ChallengeType | 'daily' | 'weekly' | 'special';
  condition: Record<string, unknown>;
  rewardPoints: number;
  rewardBadgeId: string | null;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  participants: number;
  active: boolean;
}

interface ChallengeCardProps {
  challenge: Challenge;
  isJoined: boolean;
  progress?: number;
  onJoin: () => void;
}

const typeConfig: Record<ChallengeType, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  [ChallengeType.DAILY]: {
    label: 'Daily',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    icon: <Calendar className="w-4 h-4" />,
  },
  [ChallengeType.WEEKLY]: {
    label: 'Weekly',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    icon: <Zap className="w-4 h-4" />,
  },
  [ChallengeType.SPECIAL]: {
    label: 'Special',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    icon: <Target className="w-4 h-4" />,
  },
};

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

export function ChallengeCard({ challenge, isJoined, progress = 0, onJoin }: ChallengeCardProps) {
  const config =
    typeConfig[challenge.type as ChallengeType] || typeConfig[ChallengeType.DAILY];
  const timeLeft = useCountdown(challenge.endDate);
  const [joining, setJoining] = useState(false);

  const participantPercentage = challenge.maxParticipants
    ? Math.round((challenge.participants / challenge.maxParticipants) * 100)
    : 0;

  const handleJoin = async () => {
    setJoining(true);
    try {
      await onJoin();
    } finally {
      setJoining(false);
    }
  };

  const isFull = challenge.maxParticipants !== null && challenge.participants >= challenge.maxParticipants;
  const isExpired = new Date(challenge.endDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-xl border p-5 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
          {config.icon}
          {config.label}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-1">{challenge.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{challenge.description}</p>

      {/* Participants */}
      {challenge.maxParticipants && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {challenge.participants} / {challenge.maxParticipants}
            </span>
            <span className="font-medium">{participantPercentage}%</span>
          </div>
          <Progress value={participantPercentage} className="h-1.5" />
        </div>
      )}

      {/* Progress if joined */}
      {isJoined && (
        <div className="mb-3 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">Your Progress</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Reward */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">+{challenge.rewardPoints} XP</span>
        {challenge.rewardBadgeId && (
          <span className="text-xs text-muted-foreground">+ Badge</span>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={handleJoin}
        disabled={isJoined || isFull || isExpired || joining}
        className="w-full"
        variant={isJoined ? 'outline' : 'default'}
      >
        {joining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isJoined ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Joined
          </>
        ) : isFull ? (
          'Full'
        ) : isExpired ? (
          'Expired'
        ) : (
          'Join Challenge'
        )}
      </Button>
    </motion.div>
  );
}
