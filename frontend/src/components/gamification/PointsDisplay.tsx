'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, TrendingUp } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface PointsDisplayProps {
  compact?: boolean;
}

interface FloatingPoint {
  id: string;
  points: number;
  x: number;
  y: number;
}

export function PointsDisplay({ compact = false }: PointsDisplayProps) {
  const { userStats } = useGamification();
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const [prevPoints, setPrevPoints] = useState(userStats?.totalPoints || 0);

  // Detect point changes and show floating animation
  useEffect(() => {
    const currentPoints = userStats?.totalPoints || 0;
    if (currentPoints > prevPoints) {
      const gained = currentPoints - prevPoints;
      const id = Date.now().toString();
      const newFloat: FloatingPoint = {
        id,
        points: gained,
        x: Math.random() * 40 - 20,
        y: 0,
      };
      setFloatingPoints((prev) => [...prev, newFloat]);

      setTimeout(() => {
        setFloatingPoints((prev) => prev.filter((p) => p.id !== id));
      }, 2000);
    }
    setPrevPoints(currentPoints);
  }, [userStats?.totalPoints]);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
          {(userStats?.totalPoints || 0).toLocaleString()}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Points Badge */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
      >
        <Zap className="w-5 h-5 text-white fill-white" />
        <span className="text-white font-bold text-lg">
          {(userStats?.totalPoints || 0).toLocaleString()}
        </span>
        <span className="text-white/80 text-xs font-medium">XP</span>
        <TrendingUp className="w-4 h-4 text-white/80" />
      </motion.div>

      {/* Floating Points Animation */}
      <AnimatePresence>
        {floatingPoints.map((fp) => (
          <motion.div
            key={fp.id}
            initial={{ opacity: 1, y: 0, x: fp.x }}
            animate={{ opacity: 0, y: -60, x: fp.x }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50"
          >
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold shadow-lg">
              <Zap className="w-3 h-3" />
              +{fp.points}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
