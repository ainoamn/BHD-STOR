'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Activity,
  Flame,
  Brain,
  Globe,
  Calendar,
  Download,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { HeatmapChart } from '@/components/analytics/HeatmapChart';
import { RFMSegments } from '@/components/analytics/RFMSegments';
import { CohortTable } from '@/components/analytics/CohortTable';
import { GeoMap } from '@/components/analytics/GeoMap';
import { RealTimeStats } from '@/components/analytics/RealTimeStats';

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  topProducts: { name: string; sales: number; revenue: number }[];
  recentActivity: { type: string; description: string; timestamp: string }[];
}

export default function AdvancedAnalyticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'heatmap' | 'segments' | 'cohorts' | 'geo' | 'realtime'
  >('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/dashboard');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
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

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { key: 'heatmap' as const, label: 'Sales Heatmap', icon: Flame },
    { key: 'segments' as const, label: 'Customer Segments', icon: Users },
    { key: 'cohorts' as const, label: 'Cohort Analysis', icon: Calendar },
    { key: 'geo' as const, label: 'Geography', icon: Globe },
    { key: 'realtime' as const, label: 'Real-time', icon: Activity },
  ];

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(summary?.totalRevenue ?? 0),
      change: '+12.5%',
      up: true,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Orders',
      value: (summary?.totalOrders ?? 0).toLocaleString(),
      change: '+8.3%',
      up: true,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Customers',
      value: (summary?.totalCustomers ?? 0).toLocaleString(),
      change: '+15.2%',
      up: true,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(summary?.avgOrderValue ?? 0),
      change: '-2.1%',
      up: false,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-500 mt-1">
            Deep insights into sales, customers, and marketplace performance
          </p>
        </div>
        <button
          onClick={async () => {
            const res = await fetch('/api/analytics/export?type=csv&period=monthly', {
              method: 'POST',
            });
            if (res.ok) {
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'analytics-report.csv';
              a.click();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Top Products
            </h3>
            <div className="space-y-3">
              {summary?.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-500">{product.sales.toLocaleString()} sales</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {summary?.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.type === 'order' ? 'bg-blue-500' :
                      activity.type === 'customer' ? 'bg-green-500' :
                      activity.type === 'commission' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <RFMSegments compact />
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && <HeatmapChart />}
      {activeTab === 'segments' && <RFMSegments />}
      {activeTab === 'cohorts' && <CohortTable />}
      {activeTab === 'geo' && <GeoMap />}
      {activeTab === 'realtime' && <RealTimeStats />}
    </div>
  );
}
