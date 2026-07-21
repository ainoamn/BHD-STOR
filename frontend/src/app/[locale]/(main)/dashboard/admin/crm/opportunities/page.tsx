'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  Target,
  DollarSign,
  Calendar,
  User,
  ChevronRight,
  Plus,
  X,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { PipelineBoard } from '@/components/crm/PipelineBoard';
import { SalesForecast } from '@/components/crm/SalesForecast';

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  actualCloseDate: string | null;
  assignedTo: string;
  contactId: string;
  contact?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

const stageConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  prospecting: {
    label: 'Prospecting',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
  qualification: {
    label: 'Qualification',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  proposal: {
    label: 'Proposal',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  negotiation: {
    label: 'Negotiation',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  closed_won: {
    label: 'Closed Won',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  closed_lost: {
    label: 'Closed Lost',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

export default function OpportunitiesPage() {
  const locale = useLocale();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'board' | 'list' | 'forecast'>('board');
  const [showForm, setShowForm] = useState(false);
  const [stageFilter, setStageFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    contactId: '',
    title: '',
    description: '',
    value: '',
    stage: 'prospecting',
    probability: '',
    expectedCloseDate: '',
    assignedTo: '',
  });

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stageFilter) params.set('stage', stageFilter);

      const res = await fetch(`/api/crm/opportunities?${params}`);
      if (res.ok) {
        const data = await res.json();
        const allOpps: Opportunity[] = [];
        Object.values(data.data || {}).forEach((stageOpps: any) => {
          allOpps.push(...stageOpps);
        });
        setOpportunities(allOpps);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        probability: formData.probability ? parseFloat(formData.probability) : undefined,
        expectedCloseDate: new Date(formData.expectedCloseDate).toISOString(),
      };

      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          contactId: '', title: '', description: '', value: '',
          stage: 'prospecting', probability: '', expectedCloseDate: '', assignedTo: '',
        });
        fetchOpportunities();
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
    }
  };

  const handleStageUpdate = async (oppId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/crm/opportunities/${oppId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) fetchOpportunities();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalValue = opportunities.reduce((sum, o) => sum + Number(o.value), 0);
  const weightedValue = opportunities.reduce(
    (sum, o) => sum + Number(o.value) * (Number(o.probability) / 100),
    0,
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500 mt-1">
            {opportunities.length} opportunities · {formatCurrency(totalValue)} total pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['board', 'list', 'forecast'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  activeView === view
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pipeline</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Weighted Pipeline</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(weightedValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Deal Size</p>
              <p className="text-xl font-bold text-gray-900">
                {opportunities.length > 0 ? formatCurrency(totalValue / opportunities.length) : '$0'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Probability</p>
              <p className="text-xl font-bold text-gray-900">
                {opportunities.length > 0
                  ? `${(opportunities.reduce((s, o) => s + Number(o.probability), 0) / opportunities.length).toFixed(0)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Opportunity Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">New Opportunity</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOpportunity} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact ID *</label>
                <input
                  required
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Existing contact UUID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Enterprise Software Deal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
                <input
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="User UUID"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Views */}
      {activeView === 'board' && <PipelineBoard />}

      {activeView === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Opportunity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expected Close</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No opportunities yet. Create your first opportunity.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => {
                    const config = stageConfig[opp.stage] || stageConfig.prospecting;
                    return (
                      <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm text-gray-900">{opp.title}</p>
                          {opp.contact && (
                            <p className="text-xs text-gray-500">{opp.contact.name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(opp.value))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={opp.stage}
                            onChange={(e) => handleStageUpdate(opp.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${config.bg} ${config.color}`}
                          >
                            {Object.entries(stageConfig).map(([key, c]) => (
                              <option key={key} value={key}>{c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${opp.probability}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{opp.probability}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(opp.expectedCloseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">{opp.assignedTo.slice(0, 8)}...</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleStageUpdate(opp.id, e.target.value);
                              e.target.value = '';
                            }}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                            defaultValue=""
                          >
                            <option value="" disabled>Move to...</option>
                            {Object.entries(stageConfig)
                              .filter(([key]) => key !== opp.stage)
                              .map(([key, c]) => (
                                <option key={key} value={key}>{c.label}</option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'forecast' && (
        <div className="space-y-6">
          <SalesForecast />
        </div>
      )}
    </div>
  );
}
