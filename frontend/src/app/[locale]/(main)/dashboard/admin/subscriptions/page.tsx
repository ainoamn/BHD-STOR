'use client';

import React, { useState } from 'react';
import StatsCard from '@/components/admin/StatsCard';
import DataTable from '@/components/admin/DataTable';
import {
  Crown,
  Users,
  CreditCard,
  TrendingUp,
  Check,
  X,
  Edit3,
  Plus,
} from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';
const BHD_RED = '#C41E3A';

const mockPlans = [
  {
    id: 'plan-001',
    name: 'Basic',
    price: 0,
    interval: 'month',
    description: 'Free tier for new sellers',
    features: ['5 products', 'Basic analytics', 'Standard support'],
    isActive: true,
    subscribers: 156,
  },
  {
    id: 'plan-002',
    name: 'Professional',
    price: 9.99,
    interval: 'month',
    description: 'For growing businesses',
    features: ['100 products', 'Advanced analytics', 'Priority support', 'Featured listings'],
    isActive: true,
    subscribers: 89,
  },
  {
    id: 'plan-003',
    name: 'Business',
    price: 29.99,
    interval: 'month',
    description: 'For established sellers',
    features: ['Unlimited products', 'Premium analytics', '24/7 support', 'Featured listings', 'API access'],
    isActive: true,
    subscribers: 34,
  },
  {
    id: 'plan-004',
    name: 'Enterprise',
    price: 99.99,
    interval: 'month',
    description: 'For large enterprises',
    features: ['Unlimited everything', 'Dedicated account manager', 'Custom integrations', 'White-label option'],
    isActive: false,
    subscribers: 5,
  },
];

const mockSubscribers = [
  {
    id: 'sub-001',
    user: { name: 'Ahmed Al-Rashdi', email: 'ahmed@email.com' },
    plan: 'Professional',
    status: 'active',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-01T00:00:00Z',
  },
  {
    id: 'sub-002',
    user: { name: 'Fatima Al-Balushi', email: 'fatima@email.com' },
    plan: 'Business',
    status: 'active',
    startDate: '2024-01-05T00:00:00Z',
    endDate: '2024-02-05T00:00:00Z',
  },
  {
    id: 'sub-003',
    user: { name: 'Mariam Al-Habsi', email: 'mariam@email.com' },
    plan: 'Professional',
    status: 'cancelled',
    startDate: '2023-12-01T00:00:00Z',
    endDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sub-004',
    user: { name: 'Yusuf Al-Riyami', email: 'yusuf@email.com' },
    plan: 'Basic',
    status: 'active',
    startDate: '2024-01-10T00:00:00Z',
    endDate: '2024-02-10T00:00:00Z',
  },
  {
    id: 'sub-005',
    user: { name: 'Nasser Al-Zadjali', email: 'nasser@email.com' },
    plan: 'Business',
    status: 'expired',
    startDate: '2023-11-01T00:00:00Z',
    endDate: '2023-12-01T00:00:00Z',
  },
];

const statusColors: Record<string, string> = {
  active: BHD_GREEN,
  cancelled: BHD_RED,
  expired: '#6b7280',
};

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers'>('plans');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const totalSubscribers = mockSubscribers.length;
  const activeSubscribers = mockSubscribers.filter((s) => s.status === 'active').length;
  const totalRevenue = mockPlans.reduce(
    (sum, p) => sum + p.price * p.subscribers,
    0
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage subscription plans and subscribers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowPlanModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: BHD_GREEN }}
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Subscribers"
          value={totalSubscribers}
          icon={<Users size={22} />}
          color="blue"
        />
        <StatsCard
          title="Active Subscribers"
          value={activeSubscribers}
          icon={<Check size={22} />}
          color="green"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<CreditCard size={22} />}
          color="gold"
        />
        <StatsCard
          title="Growth"
          value="12.5%"
          trend={12.5}
          icon={<TrendingUp size={22} />}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { key: 'plans' as const, label: 'Plans' },
          { key: 'subscribers' as const, label: 'Subscribers' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={
              activeTab === tab.key ? { color: BHD_GREEN, borderColor: BHD_GREEN } : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
                plan.isActive ? 'border-gray-200' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${BHD_GOLD}15` }}
                  >
                    <Crown size={20} style={{ color: BHD_GOLD }} />
                  </div>
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-3">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Free' : `OMR ${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-gray-500">/month</span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Features:
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} style={{ color: BHD_GREEN }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {plan.subscribers} subscribers
                  </span>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: plan.isActive
                        ? `${BHD_GREEN}15`
                        : '#f3f4f6',
                      color: plan.isActive ? BHD_GREEN : '#6b7280',
                    }}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subscribers' && (
        <DataTable
          columns={[
            {
              key: 'user.name',
              header: 'User',
              render: (row: any) => (
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: BHD_GREEN }}
                  >
                    {row.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{row.user.name}</p>
                    <p className="text-xs text-gray-500">{row.user.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'plan',
              header: 'Plan',
              render: (row: any) => (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    backgroundColor: `${BHD_GOLD}15`,
                    color: BHD_GOLD,
                  }}
                >
                  {row.plan}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: any) => (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    backgroundColor: `${statusColors[row.status]}15`,
                    color: statusColors[row.status],
                  }}
                >
                  {row.status}
                </span>
              ),
            },
            {
              key: 'startDate',
              header: 'Started',
              render: (row: any) => (
                <span className="text-gray-500">{formatDate(row.startDate)}</span>
              ),
            },
            {
              key: 'endDate',
              header: 'Expires',
              render: (row: any) => (
                <span className="text-gray-500">{formatDate(row.endDate)}</span>
              ),
            },
          ]}
          data={mockSubscribers}
          rowId={(row) => row.id}
          searchKeys={['user.name', 'user.email', 'plan']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
              ],
            },
            {
              key: 'plan',
              label: 'Plan',
              options: mockPlans.map((p) => ({
                value: p.name,
                label: p.name,
              })),
            },
          ]}
          pagination={{
            page,
            limit,
            total: mockSubscribers.length,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPlanModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  defaultValue={editingPlan?.name || ''}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                  placeholder="e.g. Professional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (OMR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={editingPlan?.price || ''}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  defaultValue={editingPlan?.description || ''}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                  rows={2}
                  placeholder="Short description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  defaultValue={editingPlan?.features?.join('\n') || ''}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                  rows={4}
                  placeholder="Feature 1\nFeature 2\nFeature 3"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={editingPlan?.isActive ?? true}
                  id="planActive"
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="planActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: BHD_GREEN }}
              >
                {editingPlan ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
