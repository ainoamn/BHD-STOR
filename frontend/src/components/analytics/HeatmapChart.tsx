'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, DollarSign, ShoppingCart } from 'lucide-react';

interface HeatmapData {
  dayOfWeek: number;
  hourOfDay: number;
  sales: number;
  revenue: number;
  dayLabel: string;
}

export function HeatmapChart() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [metric, setMetric] = useState<'sales' | 'revenue'>('sales');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/heatmap');
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getCellValue = (day: number, hour: number): number => {
    const cell = data.find((d) => d.dayOfWeek === day && d.hourOfDay === hour);
    return cell ? (metric === 'sales' ? cell.sales : cell.revenue) : 0;
  };

  const getMaxValue = () => {
    return Math.max(...data.map((d) => (metric === 'sales' ? d.sales : d.revenue)), 1);
  };

  const getColor = (value: number) => {
    const max = getMaxValue();
    const ratio = max > 0 ? value / max : 0;

    if (metric === 'sales') {
      if (ratio === 0) return 'bg-gray-50';
      if (ratio < 0.1) return 'bg-blue-100';
      if (ratio < 0.2) return 'bg-blue-200';
      if (ratio < 0.35) return 'bg-blue-300';
      if (ratio < 0.5) return 'bg-blue-400';
      if (ratio < 0.65) return 'bg-blue-500';
      if (ratio < 0.8) return 'bg-blue-600';
      return 'bg-blue-700';
    } else {
      if (ratio === 0) return 'bg-gray-50';
      if (ratio < 0.1) return 'bg-emerald-100';
      if (ratio < 0.2) return 'bg-emerald-200';
      if (ratio < 0.35) return 'bg-emerald-300';
      if (ratio < 0.5) return 'bg-emerald-400';
      if (ratio < 0.65) return 'bg-emerald-500';
      if (ratio < 0.8) return 'bg-emerald-600';
      return 'bg-emerald-700';
    }
  };

  const getTextColor = (value: number) => {
    const max = getMaxValue();
    const ratio = max > 0 ? value / max : 0;
    return ratio > 0.5 ? 'text-white' : 'text-gray-700';
  };

  const formatValue = (value: number) => {
    if (metric === 'revenue') {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  };

  // Group hours into 4-hour blocks for compact display
  const hourBlocks = [
    { label: '12am', hours: [0, 1, 2, 3] },
    { label: '4am', hours: [4, 5, 6, 7] },
    { label: '8am', hours: [8, 9, 10, 11] },
    { label: '12pm', hours: [12, 13, 14, 15] },
    { label: '4pm', hours: [16, 17, 18, 19] },
    { label: '8pm', hours: [20, 21, 22, 23] },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Sales Heatmap</h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMetric('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              metric === 'sales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Orders
          </button>
          <button
            onClick={() => setMetric('revenue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              metric === 'revenue' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Revenue
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour headers */}
          <div className="flex mb-1">
            <div className="w-12" /> {/* Day label column */}
            {hourBlocks.map((block) => (
              <div key={block.label} className="flex-1 text-center">
                <span className="text-[10px] text-gray-400 font-medium">{block.label}</span>
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              {/* Day label */}
              <div className="w-12 text-xs font-medium text-gray-500 pr-2 text-right">
                {day}
              </div>

              {/* Hour cells */}
              {hours.map((hour) => {
                const value = getCellValue(dayIndex, hour);
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-8 mx-px rounded-sm ${getColor(value)} ${getTextColor(
                      value
                    )} flex items-center justify-center text-[10px] font-medium cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all`}
                    title={`${day} ${hour}:00 - ${metric === 'sales' ? `${value} orders` : `$${value.toLocaleString()}`}`}
                  >
                    {value > 0 ? value : ''}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">Low</span>
            <div className="flex gap-0.5">
              {metric === 'sales'
                ? ['bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'].map(
                    (c, i) => <div key={i} className={`w-5 h-3 ${c} rounded-sm`} />
                  )
                : ['bg-emerald-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600', 'bg-emerald-700'].map(
                    (c, i) => <div key={i} className={`w-5 h-3 ${c} rounded-sm`} />
                  )}
            </div>
            <span className="text-xs text-gray-400">High</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Peak Day</p>
          <p className="text-lg font-semibold text-gray-900">Saturday</p>
          <p className="text-xs text-gray-400">Highest order volume</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Peak Hour</p>
          <p className="text-lg font-semibold text-gray-900">2:00 PM - 4:00 PM</p>
          <p className="text-xs text-gray-400">Afternoon shopping window</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Quietest Time</p>
          <p className="text-lg font-semibold text-gray-900">2:00 AM - 6:00 AM</p>
          <p className="text-xs text-gray-400">Lowest activity period</p>
        </div>
      </div>
    </div>
  );
}
