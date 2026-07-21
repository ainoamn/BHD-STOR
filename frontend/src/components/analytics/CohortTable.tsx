'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, ArrowRight } from 'lucide-react';

interface CohortData {
  cohortMonth: string;
  cohortSize: number;
  periods: {
    period: number;
    activeUsers: number;
    retentionRate: number;
    revenue: number;
  }[];
}

export function CohortTable() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/cohorts');
      if (res.ok) {
        const data = await res.json();
        setCohorts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find max periods to determine column count
  const maxPeriods = Math.max(...cohorts.map((c) => c.periods.length), 0);
  const periodLabels = Array.from({ length: maxPeriods }, (_, i) => `Month ${i}`);

  const getRetentionColor = (rate: number): string => {
    if (rate >= 60) return 'bg-green-400 text-white';
    if (rate >= 50) return 'bg-green-300 text-green-900';
    if (rate >= 40) return 'bg-green-200 text-green-800';
    if (rate >= 30) return 'bg-yellow-200 text-yellow-800';
    if (rate >= 20) return 'bg-orange-200 text-orange-800';
    if (rate >= 10) return 'bg-red-200 text-red-800';
    return 'bg-gray-100 text-gray-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Cohort Size</p>
              <p className="text-xl font-bold text-gray-900">
                {cohorts.length > 0
                  ? Math.round(cohorts.reduce((s, c) => s + c.cohortSize, 0) / cohorts.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Month-1 Retention</p>
              <p className="text-xl font-bold text-gray-900">
                {cohorts.length > 0
                  ? `${(cohorts.reduce((s, c) => {
                      const p1 = c.periods.find((p) => p.period === 1);
                      return s + (p1 ? p1.retentionRate : 0);
                    }, 0) / cohorts.length).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cohorts</p>
              <p className="text-xl font-bold text-gray-900">{cohorts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Cohort Retention Analysis
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  Cohort
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  Size
                </th>
                {periodLabels.map((label) => (
                  <th key={label} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cohorts.map((cohort) => (
                <tr key={cohort.cohortMonth} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {new Date(cohort.cohortMonth + '-01').toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {cohort.cohortSize}
                  </td>
                  {Array.from({ length: maxPeriods }, (_, i) => {
                    const period = cohort.periods.find((p) => p.period === i);
                    return (
                      <td key={i} className="px-3 py-3 text-center">
                        {period ? (
                          <div
                            className={`inline-flex flex-col items-center justify-center w-14 h-10 rounded-lg text-xs font-medium ${getRetentionColor(
                              period.retentionRate
                            )}`}
                            title={`${period.activeUsers} users · ${formatCurrency(period.revenue)}`}
                          >
                            <span>{period.retentionRate.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Cohort Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-emerald-600" />
            Revenue by Cohort
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  Cohort
                </th>
                {periodLabels.map((label) => (
                  <th key={label} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cohorts.map((cohort) => (
                <tr key={cohort.cohortMonth} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {new Date(cohort.cohortMonth + '-01').toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  {Array.from({ length: maxPeriods }, (_, i) => {
                    const period = cohort.periods.find((p) => p.period === i);
                    return (
                      <td key={i} className="px-3 py-3 text-center">
                        {period ? (
                          <span className="text-xs text-gray-600">
                            {formatCurrency(period.revenue)}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
        <span className="text-xs font-medium text-gray-500">Retention:</span>
        {[
          { min: 60, label: '60%+', color: 'bg-green-400' },
          { min: 50, label: '50-59%', color: 'bg-green-300' },
          { min: 40, label: '40-49%', color: 'bg-green-200' },
          { min: 30, label: '30-39%', color: 'bg-yellow-200' },
          { min: 20, label: '20-29%', color: 'bg-orange-200' },
          { min: 10, label: '10-19%', color: 'bg-red-200' },
          { min: 0, label: '<10%', color: 'bg-gray-100' },
        ].map((item) => (
          <div key={item.min} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${item.color}`} />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
