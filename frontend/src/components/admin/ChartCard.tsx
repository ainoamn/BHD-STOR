'use client';

import React, { ReactNode } from 'react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  period?: string;
  onPeriodChange?: (period: string) => void;
  children: ReactNode;
  isLoading?: boolean;
  action?: ReactNode;
}

const periods = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

export default function ChartCard({
  title,
  subtitle,
  period,
  onPeriodChange,
  children,
  isLoading = false,
  action,
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onPeriodChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => onPeriodChange(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    period === p.value
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={
                    period === p.value ? { backgroundColor: BHD_GREEN } : undefined
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {action}
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: BHD_GOLD, borderTopColor: 'transparent' }}
              />
              <span className="text-sm text-gray-400">Loading chart...</span>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-0">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
