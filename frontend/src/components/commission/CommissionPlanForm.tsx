'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Percent, DollarSign, TrendingUp, Users } from 'lucide-react';

interface CommissionPlanFormProps {
  plan?: {
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
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const typeOptions = [
  { value: 'percentage', label: 'Percentage', icon: Percent, desc: 'Fixed % of sale amount' },
  { value: 'fixed', label: 'Fixed Amount', icon: DollarSign, desc: 'Flat fee per sale' },
  { value: 'tiered', label: 'Tiered', icon: TrendingUp, desc: 'Different rates based on volume' },
  { value: 'mlm', label: 'MLM', icon: Users, desc: 'Multi-level commissions' },
];

const applicableOptions = [
  { value: 'all_products', label: 'All Products' },
  { value: 'categories', label: 'Specific Categories' },
  { value: 'specific_products', label: 'Specific Products' },
];

export function CommissionPlanForm({ plan, onClose, onSuccess }: CommissionPlanFormProps) {
  const isEditing = !!plan;

  const [name, setName] = useState(plan?.name || '');
  const [type, setType] = useState<'percentage' | 'fixed' | 'tiered' | 'mlm'>(
    plan?.type || 'percentage'
  );
  const [rate, setRate] = useState(plan?.rate ? String(plan.rate * 100) : '');
  const [amount, setAmount] = useState(plan?.amount ? String(plan.amount) : '');
  const [tiers, setTiers] = useState<{ minAmount: string; maxAmount: string; rate: string }[]>(
    plan?.tiers?.map((t) => ({
      minAmount: String(t.minAmount),
      maxAmount: t.maxAmount ? String(t.maxAmount) : '',
      rate: String(t.rate * 100),
    })) || [{ minAmount: '0', maxAmount: '', rate: '' }]
  );
  const [levels, setLevels] = useState<{ level: string; rate: string; description: string }[]>(
    plan?.levels?.map((l) => ({
      level: String(l.level),
      rate: String(l.rate * 100),
      description: l.description || '',
    })) || [{ level: '1', rate: '', description: '' }]
  );
  const [applicableTo, setApplicableTo] = useState(plan?.applicableTo || 'all_products');
  const [productIds, setProductIds] = useState(plan?.productIds?.join(', ') || '');
  const [categoryIds, setCategoryIds] = useState(plan?.categoryIds?.join(', ') || '');
  const [active, setActive] = useState(plan?.active ?? true);
  const [saving, setSaving] = useState(false);

  const addTier = () =>
    setTiers([...tiers, { minAmount: '', maxAmount: '', rate: '' }]);

  const removeTier = (index: number) =>
    setTiers(tiers.filter((_, i) => i !== index));

  const updateTier = (index: number, field: string, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const addLevel = () =>
    setLevels([
      ...levels,
      { level: String(levels.length + 1), rate: '', description: '' },
    ]);

  const removeLevel = (index: number) =>
    setLevels(levels.filter((_, i) => i !== index));

  const updateLevel = (index: number, field: string, value: string) => {
    const updated = [...levels];
    updated[index] = { ...updated[index], [field]: value };
    setLevels(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        name,
        type,
        applicableTo,
        active,
        productIds: productIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        categoryIds: categoryIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (type === 'percentage') {
        payload.rate = parseFloat(rate) / 100;
      } else if (type === 'fixed') {
        payload.amount = parseFloat(amount);
      } else if (type === 'tiered') {
        payload.tiers = tiers
          .filter((t) => t.minAmount && t.rate)
          .map((t) => ({
            minAmount: parseFloat(t.minAmount),
            maxAmount: t.maxAmount ? parseFloat(t.maxAmount) : null,
            rate: parseFloat(t.rate) / 100,
          }));
      } else if (type === 'mlm') {
        payload.levels = levels
          .filter((l) => l.rate)
          .map((l) => ({
            level: parseInt(l.level),
            rate: parseFloat(l.rate) / 100,
            description: l.description || null,
          }));
      }

      const url = isEditing ? `/api/commissions/plans/${plan.id}` : '/api/commissions/plans';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Commission Plan' : 'New Commission Plan'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Affiliate 10%"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Commission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value as any)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      type === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        type === option.value ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          type === option.value ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type-specific fields */}
          {type === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {type === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Amount ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="25.00"
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {type === 'tiered' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Tiers</label>
                <button
                  type="button"
                  onClick={addTier}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  Add Tier
                </button>
              </div>
              <div className="space-y-2">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={tier.minAmount}
                      onChange={(e) => updateTier(index, 'minAmount', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max $"
                      value={tier.maxAmount}
                      onChange={(e) => updateTier(index, 'maxAmount', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Rate %"
                      value={tier.rate}
                      onChange={(e) => updateTier(index, 'rate', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'mlm' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">MLM Levels</label>
                <button
                  type="button"
                  onClick={addLevel}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  Add Level
                </button>
              </div>
              <div className="space-y-2">
                {levels.map((level, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Level"
                      value={level.level}
                      onChange={(e) => updateLevel(index, 'level', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Rate %"
                      value={level.rate}
                      onChange={(e) => updateLevel(index, 'rate', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={level.description}
                      onChange={(e) => updateLevel(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeLevel(index)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applicable To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applies To
            </label>
            <select
              value={applicableTo}
              onChange={(e) => setApplicableTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {applicableOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Product/Category IDs */}
          {applicableTo === 'specific_products' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product IDs (comma-separated)
              </label>
              <input
                value={productIds}
                onChange={(e) => setProductIds(e.target.value)}
                placeholder="uuid-1, uuid-2, uuid-3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {applicableTo === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category IDs (comma-separated)
              </label>
              <input
                value={categoryIds}
                onChange={(e) => setCategoryIds(e.target.value)}
                placeholder="cat-1, cat-2, cat-3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700">
              Plan is active
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {isEditing ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
