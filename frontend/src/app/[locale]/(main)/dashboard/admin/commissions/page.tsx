'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  DollarSign,
  Users,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Filter,
  Download,
  BarChart3,
  Layers,
  TreePine,
} from 'lucide-react';
import { CommissionTable } from '@/components/commission/CommissionTable';
import { MLMTree } from '@/components/commission/MLMTree';

interface CommissionSummary {
  totalCommission: number;
  totalSales: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  cancelledAmount: number;
  countByStatus: Record<string, number>;
}

export default function CommissionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'commissions' | 'mlm'>('commissions');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);

      const res = await fetch(`/api/commissions/report?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching commission report:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      label: 'Total Commissions',
      value: formatCurrency(summary?.totalCommission ?? 0),
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Sales',
      value: formatCurrency(summary?.totalSales ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending',
      value: formatCurrency(summary?.pendingAmount ?? 0),
      count: summary?.countByStatus?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Approved',
      value: formatCurrency(summary?.approvedAmount ?? 0),
      count: summary?.countByStatus?.approved || 0,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Paid',
      value: formatCurrency(summary?.paidAmount ?? 0),
      count: summary?.countByStatus?.paid || 0,
      icon: Wallet,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Cancelled',
      value: formatCurrency(summary?.cancelledAmount ?? 0),
      count: summary?.countByStatus?.cancelled || 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-500 mt-1">Manage commissions, plans, and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/dashboard/admin/commissions/plans`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Layers className="w-4 h-4" />
            Commission Plans
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (dateRange.start) params.set('startDate', dateRange.start);
              if (dateRange.end) params.set('endDate', dateRange.end);
              window.open(`/api/commissions/report?${params}&format=csv`, '_blank');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.count !== undefined && (
                <span className="text-xs text-gray-500">{stat.count} items</span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Date Range:</span>
        </div>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === 'commissions'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Commissions
          {activeTab === 'commissions' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('mlm')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === 'mlm'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TreePine className="w-4 h-4" />
          MLM Network
          {activeTab === 'mlm' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'commissions' && (
        <CommissionTable dateRange={dateRange} />
      )}

      {activeTab === 'mlm' && (
        <MLMTree />
      )}
    </div>
  );
}
