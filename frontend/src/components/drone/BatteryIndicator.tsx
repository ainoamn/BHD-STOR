/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Battery Indicator                        │
 * │  Visual battery gauge with color-coded levels               │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useMemo } from 'react';

export interface BatteryIndicatorProps {
  level: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  charging?: boolean;
}

const sizeMap = {
  sm: { width: 32, height: 16, font: 'text-[10px]' },
  md: { width: 48, height: 22, font: 'text-xs' },
  lg: { width: 64, height: 28, font: 'text-sm' },
};

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  level,
  size = 'md',
  showLabel = true,
  charging = false,
}) => {
  const clamped = Math.max(0, Math.min(100, level));
  const s = sizeMap[size];

  const colorClass = useMemo(() => {
    if (clamped > 50) return 'bg-emerald-500';
    if (clamped > 25) return 'bg-amber-500';
    if (clamped > 10) return 'bg-orange-500';
    return 'bg-red-600 animate-pulse';
  }, [clamped]);

  const textColor = useMemo(() => {
    if (clamped > 50) return 'text-emerald-400';
    if (clamped > 25) return 'text-amber-400';
    return 'text-red-400';
  }, [clamped]);

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative" style={{ width: s.width, height: s.height }}>
        {/* Battery body */}
        <div
          className="absolute inset-0 rounded-sm border-2 border-slate-500 bg-slate-800"
          style={{ width: s.width, height: s.height }}
        />
        {/* Battery tip */}
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 rounded-r-sm bg-slate-500"
          style={{ width: 3, height: s.height * 0.5 }}
        />
        {/* Fill */}
        <div
          className={`absolute left-[2px] top-[2px] bottom-[2px] rounded-[1px] transition-all duration-500 ${colorClass}`}
          style={{ width: Math.max(0, (s.width - 4) * (clamped / 100)) }}
        />
        {/* Charging bolt */}
        {charging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="text-yellow-300 drop-shadow"
              width={s.height * 0.6}
              height={s.height * 0.8}
              viewBox="0 0 12 16"
              fill="currentColor"
            >
              <path d="M7 0L0 9h5l-2 7 9-9H7l2-7z" />
            </svg>
          </div>
        )}
      </div>
      {showLabel && (
        <span className={`font-mono font-semibold ${s.font} ${textColor}`}>
          {clamped}%
        </span>
      )}
    </div>
  );
};

export default BatteryIndicator;
