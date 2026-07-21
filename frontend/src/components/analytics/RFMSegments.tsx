'use client';

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Clock, ShoppingCart, Award } from 'lucide-react';

interface RFMCustomer {
  customerId: string;
  recency: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  segment: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
}

interface RFMSegmentsProps {
  compact?: boolean;
}

const segmentConfig: Record<string, { color: string; bg: string; description: string; icon: React.ElementType }> = {
  Champions: { color: 'text-amber-700', bg: 'bg-amber-100', description: 'Best customers', icon: Award },
  'Loyal Customers': { color: 'text-blue-700', bg: 'bg-blue-100', description: 'Consistent buyers', icon: Users },
  'Potential Loyalists': { color: 'text-emerald-700', bg: 'bg-emerald-100', description: 'Recent customers', icon: TrendingUp },
  'New Customers': { color: 'text-purple-700', bg: 'bg-purple-100', description: 'First-time buyers', icon: ShoppingCart },
  'At Risk': { color: 'text-orange-700', bg: 'bg-orange-100', description: 'Declining activity', icon: Clock },
  Hibernating: { color: 'text-gray-700', bg: 'bg-gray-100', description: 'Inactive customers', icon: Clock },
};

export function RFMSegments({ compact = false }: RFMSegmentsProps) {
  const [segments, setSegments] = useState<RFMCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/segments');
      if (res.ok) {
        const data = await res.json();
        setSegments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching RFM segments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by segment
  const grouped = segments.reduce<Record<string, RFMCustomer[]>>((acc, c) => {
    if (!acc[c.segment]) acc[c.segment] = [];
    acc[c.segment].push(c);
    return acc;
  }, {});

  // Distribution
  const distribution = Object.entries(grouped).map(([segment, customers]) => ({
    segment,
    count: customers.length,
    avgSpend: customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length,
    totalSpend: customers.reduce((s, c) => s + c.totalSpent, 0),
    avgOrders: customers.reduce((s, c) => s + c.orderCount, 0) / customers.length,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Customer Segments
        </h3>
        <div className="space-y-3">
          {distribution.map((d) => {
            const config = segmentConfig[d.segment] || segmentConfig.Hibernating;
            const pct = segments.length > 0 ? (d.count / segments.length) * 100 : 0;
            return (
              <div key={d.segment}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{d.segment}</span>
                  <span className="text-xs text-gray-500">{d.count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${config.bg.replace('bg-', 'bg-opacity-80 bg-')}`}
                    style={{ width: `${Math.max(pct, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {distribution.map((d) => {
          const config = segmentConfig[d.segment] || segmentConfig.Hibernating;
          const Icon = config.icon;
          const pct = segments.length > 0 ? (d.count / segments.length) * 100 : 0;

          return (
            <div key={d.segment} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                  {d.count} customers
                </span>
              </div>
              <h4 className="font-semibold text-gray-900">{d.segment}</h4>
              <p className="text-xs text-gray-500 mb-3">{config.description}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Avg Spend</span>
                  <span className="font-medium text-gray-900">{formatCurrency(d.avgSpend)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Avg Orders</span>
                  <span className="font-medium text-gray-900">{d.avgOrders.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-gray-900">{formatCurrency(d.totalSpend)}</span>
                </div>
              </div>
              <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Customer Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Segment</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">R</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">F</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">M</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {segments.map((customer) => {
                const config = segmentConfig[customer.segment] || segmentConfig.Hibernating;
                return (
                  <tr key={customer.customerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {customer.customerId.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={customer.rScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={customer.fScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={customer.mScore} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {customer.orderCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
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

function ScoreBadge({ score }: { score: number }) {
  const colors: Record<number, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-blue-100 text-blue-700',
    5: 'bg-green-100 text-green-700',
  };

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${colors[score] || 'bg-gray-100'}`}>
      {score}
    </span>
  );
}
