'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Check,
} from 'lucide-react';

interface Commission {
  id: string;
  planId: string;
  userId: string;
  orderId: string;
  productId: string | null;
  saleAmount: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt: string | null;
  createdAt: string;
  plan?: { name: string; type: string };
}

interface CommissionTableProps {
  dateRange?: { start: string; end: string };
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-purple-700', bg: 'bg-purple-100', label: 'Approved' },
  paid: { icon: DollarSign, color: 'text-green-700', bg: 'bg-green-100', label: 'Paid' },
  cancelled: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-100', label: 'Cancelled' },
};

export function CommissionTable({ dateRange }: CommissionTableProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('startDate', dateRange.start);
      if (dateRange?.end) params.set('endDate', dateRange.end);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/commissions/report?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.data.commissions || []);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/commissions/${id}/approve`, { method: 'POST' });
      if (res.ok) fetchCommissions();
    } catch (error) {
      console.error('Error approving commission:', error);
    }
  };

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(`/api/commissions/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) fetchCommissions();
    } catch (error) {
      console.error('Error paying commission:', error);
    }
  };

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      await handleApprove(id);
    }
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === commissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(commissions.map((c) => c.id));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const filteredCommissions = commissions.filter((c) =>
    statusFilter ? c.status === statusFilter : true
  );

  const paginatedCommissions = filteredCommissions.slice(
    (page - 1) * limit,
    page * limit
  );
  const totalPages = Math.ceil(filteredCommissions.length / limit);

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedIds.length} commission(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Selected
            </button>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            !statusFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = commissions.filter((c) => c.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === key
                  ? `${config.bg} ${config.color} ring-1 ring-inset`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {config.label}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === commissions.length && commissions.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Sale Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Commission</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : paginatedCommissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No commissions found for the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedCommissions.map((commission) => {
                  const config = statusConfig[commission.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(commission.id)}
                          onChange={() => toggleSelect(commission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {commission.plan?.name || 'Unknown Plan'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {commission.plan?.type || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono">
                          {commission.userId.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(commission.saleAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatCurrency(commission.commissionAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.bg} ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {commission.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(commission.id)}
                              className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {commission.status === 'approved' && (
                            <button
                              onClick={() => handlePay(commission.id)}
                              className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600"
                              title="Pay"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {Math.min((page - 1) * limit + 1, filteredCommissions.length)} to{' '}
              {Math.min(page * limit, filteredCommissions.length)} of {filteredCommissions.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
