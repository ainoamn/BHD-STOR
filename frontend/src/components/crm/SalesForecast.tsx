'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';

interface ForecastData {
  month: string;
  expectedRevenue: number;
  weightedRevenue: number;
}

export function SalesForecast() {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/forecast');
      if (res.ok) {
        const data = await res.json();
        setForecast(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const totalExpected = forecast.reduce((s, f) => s + f.expectedRevenue, 0);
  const totalWeighted = forecast.reduce((s, f) => s + f.weightedRevenue, 0);

  // Calculate growth rate between first and last month
  const growthRate =
    forecast.length >= 2 && forecast[0].weightedRevenue > 0
      ? ((forecast[forecast.length - 1].weightedRevenue - forecast[0].weightedRevenue) /
          forecast[0].weightedRevenue) *
        100
      : 0;

  // Find max for chart scaling
  const maxValue = Math.max(
    ...forecast.map((f) => Math.max(f.expectedRevenue, f.weightedRevenue)),
    1,
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sales Forecast</h3>
            <p className="text-xs text-gray-500">6-month revenue projection</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Expected</p>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalExpected)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Weighted</p>
            <p className="text-sm font-semibold text-blue-600">{formatCurrency(totalWeighted)}</p>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              growthRate >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {growthRate >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(growthRate).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-400"></div>
          <span className="text-xs text-gray-600">Expected Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-400"></div>
          <span className="text-xs text-gray-600">Weighted Revenue</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative">
        <div className="flex items-end justify-between gap-3 h-48">
          {forecast.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-1 h-36">
                {/* Expected Revenue Bar */}
                <div
                  className="w-full max-w-[32px] bg-blue-400 rounded-t-md transition-all hover:bg-blue-500 relative group"
                  style={{
                    height: `${(item.expectedRevenue / maxValue) * 100}%`,
                    minHeight: item.expectedRevenue > 0 ? 4 : 0,
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(item.expectedRevenue)}
                  </div>
                </div>
                {/* Weighted Revenue Bar */}
                <div
                  className="w-full max-w-[32px] bg-emerald-400 rounded-t-md transition-all hover:bg-emerald-500 relative group"
                  style={{
                    height: `${(item.weightedRevenue / maxValue) * 100}%`,
                    minHeight: item.weightedRevenue > 0 ? 4 : 0,
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(item.weightedRevenue)}
                  </div>
                </div>
              </div>
              {/* Month Label */}
              <span className="text-[10px] text-gray-500 font-medium truncate max-w-full">
                {formatMonth(item.month)}
              </span>
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-gray-100"
              style={{ bottom: `${(i / 3) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Forecast Table */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 font-medium text-right">Expected</th>
                <th className="pb-2 font-medium text-right">Weighted</th>
                <th className="pb-2 font-medium text-right">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {forecast.map((item) => {
                const gap = item.expectedRevenue - item.weightedRevenue;
                const gapPercent =
                  item.expectedRevenue > 0 ? (gap / item.expectedRevenue) * 100 : 0;

                return (
                  <tr key={item.month} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatMonth(item.month)}
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {formatCurrency(item.expectedRevenue)}
                    </td>
                    <td className="py-2 text-right text-emerald-600 font-medium">
                      {formatCurrency(item.weightedRevenue)}
                    </td>
                    <td className="py-2 text-right">
                      <span className="text-xs text-gray-500">
                        {formatCurrency(gap)} ({gapPercent.toFixed(0)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
