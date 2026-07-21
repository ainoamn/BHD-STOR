'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Medal, Crown, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  userId: string;
  period: string;
  points: number;
  rank: number;
  periodStart: string;
  periodEnd: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  userRank?: number;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
}

function TrendIndicator({ rank }: { rank: number }) {
  // Simulated trend - in real app would compare with previous period
  const trend = rank % 3 === 0 ? 'up' : rank % 3 === 1 ? 'down' : 'same';

  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export function LeaderboardTable({ entries, userRank }: LeaderboardTableProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
        <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No more entries yet</p>
      </div>
    );
  }

  // Add offset to ranks (since these are entries after top 3)
  const offsetEntries = entries.map((e, i) => ({
    ...e,
    rank: e.rank || i + 4,
  }));

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-1">Rank</div>
        <div className="col-span-5">User</div>
        <div className="col-span-3 text-right">Points</div>
        <div className="col-span-2 text-center">Trend</div>
        <div className="col-span-1 text-center">Status</div>
      </div>

      {/* Rows */}
      {offsetEntries.map((entry, index) => {
        const isCurrentUser = userRank === entry.rank;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-t transition-colors hover:bg-muted/30 ${
              isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''
            }`}
          >
            {/* Rank */}
            <div className="col-span-1 flex items-center">
              <RankIcon rank={entry.rank} />
            </div>

            {/* User */}
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-bold text-primary">
                {entry.userId?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium truncate max-w-[150px]">
                  User {entry.userId?.slice(0, 8)}
                </div>
                {isCurrentUser && (
                  <span className="text-[10px] text-primary font-medium">You</span>
                )}
              </div>
            </div>

            {/* Points */}
            <div className="col-span-3 text-right">
              <span className="text-sm font-bold">{entry.points.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground ml-1">XP</span>
            </div>

            {/* Trend */}
            <div className="col-span-2 flex justify-center">
              <TrendIndicator rank={entry.rank} />
            </div>

            {/* Status */}
            <div className="col-span-1 flex justify-center">
              {entry.rank <= 10 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  Top 10
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800">
                  -
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
