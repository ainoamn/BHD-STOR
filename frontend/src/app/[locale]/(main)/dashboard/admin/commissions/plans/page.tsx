'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Percent,
  DollarSign,
  TrendingUp,
  Users,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';
import { CommissionPlanForm } from '@/components/commission/CommissionPlanForm';

interface CommissionPlan {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered' | 'mlm';
  rate: number | null;
  amount: number | null;
  tiers: { minAmount: number; maxAmount?: number; rate: number }[] | null;
  levels: { level: number; rate: number; description?: string }[] | null;
  applicableTo: string;
  productIds: string[];
  categoryIds: string[];
  active: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  percentage: { icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Percentage' },
  fixed: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Fixed' },
  tiered: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Tiered' },
  mlm: { icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', label: 'MLM' },
};

export default function CommissionPlansPage() {
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/commissions/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`/api/commissions/plans/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleToggleActive = async (plan: CommissionPlan) => {
    try {
      const res = await fetch(`/api/commissions/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !plan.active }),
      });
      if (res.ok) fetchPlans();
    } catch (error) {
      console.error('Error toggling plan:', error);
    }
  };

  const formatRate = (plan: CommissionPlan) => {
    switch (plan.type) {
      case 'percentage':
        return `${((plan.rate || 0) * 100).toFixed(2)}%`;
      case 'fixed':
        return `$${(plan.amount || 0).toLocaleString()}`;
      case 'tiered':
        return `${(plan.tiers || []).length} tiers`;
      case 'mlm':
        return `${(plan.levels || []).length} levels`;
      default:
        return '-';
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commission Plans</h1>
            <p className="text-gray-500 mt-1">{plans.length} plans configured</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Plan Form Modal */}
      {showForm && (
        <CommissionPlanForm
          plan={editingPlan}
          onClose={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingPlan(null);
            fetchPlans();
          }}
        />
      )}

      {/* Plans List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Layers className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No commission plans yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first commission plan to start tracking payouts</p>
          <button
            onClick={() => {
              setEditingPlan(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const config = typeConfig[plan.type] || typeConfig.percentage;
            const Icon = config.icon;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
              >
                {/* Plan Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <span className={`text-xs ${config.color} font-medium`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        plan.active ? 'hover:bg-green-50' : 'hover:bg-gray-100'
                      }`}
                      title={plan.active ? 'Active' : 'Inactive'}
                    >
                      {plan.active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setShowForm(true);
                      }}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Rate/Amount</p>
                    <p className="text-sm font-semibold text-gray-900">{formatRate(plan)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Applies To</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {plan.applicableTo.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Tiers/Levels Preview */}
                {plan.type === 'tiered' && plan.tiers && plan.tiers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Tiers:</p>
                    <div className="space-y-1">
                      {plan.tiers.map((tier, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">
                            ${tier.minAmount.toLocaleString()}
                            {tier.maxAmount ? ` - $${tier.maxAmount.toLocaleString()}` : ' +'}
                          </span>
                          <span className="font-medium text-blue-600">{(tier.rate * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.type === 'mlm' && plan.levels && plan.levels.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">MLM Levels:</p>
                    <div className="space-y-1">
                      {plan.levels.map((level, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">
                            Level {level.level}
                            {level.description && ` - ${level.description}`}
                          </span>
                          <span className="font-medium text-orange-600">{(level.rate * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product/Category filters */}
                {(plan.productIds.length > 0 || plan.categoryIds.length > 0) && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {plan.productIds.map((id) => (
                      <span key={id} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        Product: {id.slice(0, 8)}...
                      </span>
                    ))}
                    {plan.categoryIds.map((id) => (
                      <span key={id} className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                        Cat: {id.slice(0, 8)}...
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Created: {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
