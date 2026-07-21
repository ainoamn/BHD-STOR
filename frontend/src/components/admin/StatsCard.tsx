'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';
const BHD_RED = '#C41E3A';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color?: 'green' | 'gold' | 'red' | 'blue' | 'purple';
  isLoading?: boolean;
}

const colorMap = {
  green: { bg: '#f0fdf4', icon: BHD_GREEN },
  gold: { bg: '#fefce8', icon: BHD_GOLD },
  red: { bg: '#fef2f2', icon: BHD_RED },
  blue: { bg: '#eff6ff', icon: '#2563eb' },
  purple: { bg: '#faf5ff', icon: '#9333ea' },
};

export default function StatsCard({
  title,
  value,
  trend,
  trendLabel = 'vs last period',
  icon,
  color = 'green',
  isLoading = false,
}: StatsCardProps) {
  const colors = colorMap[color];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral = trend !== undefined && trend === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  trendPositive
                    ? 'text-green-600'
                    : trendNegative
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {trendPositive && <TrendingUp size={12} />}
                {trendNegative && <TrendingDown size={12} />}
                {trendNeutral && <Minus size={12} />}
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              <span className="text-xs text-gray-400">{trendLabel}</span>
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ml-3"
          style={{ backgroundColor: colors.bg }}
        >
          <span style={{ color: colors.icon }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
