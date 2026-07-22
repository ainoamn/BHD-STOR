'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import StatsCard from '@/components/admin/StatsCard';
import DataTable from '@/components/admin/DataTable';
import {
  useAdminPaymentGateways,
  useAdminTogglePaymentGateway,
} from '@/hooks/useAdmin';
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  ArrowUpRight,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';
const BHD_RED = '#C41E3A';

const mockPayments = [
  {
    id: 'pay-001',
    transactionId: 'TXN-8291432',
    orderId: 'ORD-8291',
    customer: 'Ahmed Al-Rashdi',
    amount: 85.5,
    method: 'credit_card',
    status: 'completed',
    date: '2024-01-15T10:30:00Z',
  },
  {
    id: 'pay-002',
    transactionId: 'TXN-8291433',
    orderId: 'ORD-8292',
    customer: 'Fatima Al-Balushi',
    amount: 245.0,
    method: 'bank_transfer',
    status: 'completed',
    date: '2024-01-15T11:15:00Z',
  },
  {
    id: 'pay-003',
    transactionId: 'TXN-8291434',
    orderId: 'ORD-8293',
    customer: 'Khalid Al-Siyabi',
    amount: 132.75,
    method: 'credit_card',
    status: 'pending',
    date: '2024-01-15T12:00:00Z',
  },
  {
    id: 'pay-004',
    transactionId: 'TXN-8291435',
    orderId: 'ORD-8294',
    customer: 'Mariam Al-Habsi',
    amount: 48.0,
    method: 'apple_pay',
    status: 'completed',
    date: '2024-01-15T13:45:00Z',
  },
  {
    id: 'pay-005',
    transactionId: 'TXN-8291436',
    orderId: 'ORD-8295',
    customer: 'Yusuf Al-Riyami',
    amount: 189.25,
    method: 'credit_card',
    status: 'completed',
    date: '2024-01-15T14:20:00Z',
  },
  {
    id: 'pay-006',
    transactionId: 'TXN-8291437',
    orderId: 'ORD-8296',
    customer: 'Said Al-Amri',
    amount: 75.0,
    method: 'bank_transfer',
    status: 'refunded',
    date: '2024-01-14T09:30:00Z',
  },
  {
    id: 'pay-007',
    transactionId: 'TXN-8291438',
    orderId: 'ORD-8297',
    customer: 'Nasser Al-Zadjali',
    amount: 567.0,
    method: 'credit_card',
    status: 'completed',
    date: '2024-01-15T15:00:00Z',
  },
];

const mockPayouts = [
  {
    id: 'payout-001',
    store: 'Oman Crafts LLC',
    storeId: 'str-001',
    amount: 2450.75,
    status: 'pending',
    period: 'Jan 1-15, 2024',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'payout-002',
    store: 'Muscat Electronics',
    storeId: 'str-002',
    amount: 5820.0,
    status: 'processing',
    period: 'Jan 1-15, 2024',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'payout-003',
    store: 'Desert Rose Fashion',
    storeId: 'str-003',
    amount: 1890.5,
    status: 'completed',
    period: 'Dec 16-31, 2023',
    createdAt: '2023-12-31T00:00:00Z',
  },
];

const statusColors: Record<string, string> = {
  completed: BHD_GREEN,
  pending: '#f59e0b',
  failed: BHD_RED,
  refunded: '#6b7280',
  partially_refunded: '#2563eb',
};

const payoutStatusColors: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#2563eb',
  completed: BHD_GREEN,
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<
    'gateways' | 'transactions' | 'payouts'
  >('gateways');

  const {
    data: gateways = [],
    isLoading: gatewaysLoading,
    isError: gatewaysError,
    refetch: refetchGateways,
  } = useAdminPaymentGateways();
  const toggleGateway = useAdminTogglePaymentGateway();

  const totalRevenue = mockPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = mockPayments.filter((p) => p.status === 'completed').length;
  const pendingPayments = mockPayments.filter((p) => p.status === 'pending').length;
  const refundedPayments = mockPayments.filter((p) => p.status === 'refunded').length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleToggle = async (idOrCode: string, next: boolean) => {
    try {
      await toggleGateway.mutateAsync({ idOrCode, isActive: next });
      toast.success(next ? 'Gateway enabled' : 'Gateway disabled');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update gateway';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enable payment gateways, review transactions, and store payouts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={22} />}
          color="green"
        />
        <StatsCard
          title="Completed"
          value={completedPayments}
          icon={<CheckCircle size={22} />}
          color="blue"
        />
        <StatsCard
          title="Pending"
          value={pendingPayments}
          icon={<Clock size={22} />}
          color="gold"
        />
        <StatsCard
          title="Refunded"
          value={refundedPayments}
          icon={<XCircle size={22} />}
          color="red"
        />
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {(
          [
            { key: 'gateways' as const, label: 'Gateways' },
            { key: 'transactions' as const, label: 'Transactions' },
            { key: 'payouts' as const, label: 'Store Payouts' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={
              activeTab === tab.key
                ? { color: BHD_GREEN, borderColor: BHD_GREEN }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Only active gateways appear at checkout. COD needs no API keys;
              card gateways also require env credentials.
            </p>
            <button
              type="button"
              onClick={() => refetchGateways()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          {gatewaysLoading && (
            <p className="text-sm text-gray-500">Loading gateways…</p>
          )}

          {gatewaysError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={16} />
              Could not load gateways. Ensure you are signed in as admin and the
              API is running.
            </div>
          )}

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
            {gateways.map((gw) => (
              <div
                key={gw.id || gw.code}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CreditCard size={16} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-900">{gw.name}</span>
                    <span className="font-mono text-xs text-gray-500">
                      {gw.code}
                    </span>
                    {gw.isSandbox && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${BHD_GOLD}22`,
                          color: '#92650a',
                        }}
                      >
                        sandbox
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {gw.isConfigured
                      ? 'Environment keys configured'
                      : gw.missingKeys?.length
                        ? `Missing: ${gw.missingKeys.join(', ')}`
                        : 'Not configured in environment'}
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
                  <span className="text-xs text-gray-500">
                    {gw.isActive ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={gw.isActive}
                    disabled={toggleGateway.isPending}
                    onClick={() => handleToggle(gw.id || gw.code, !gw.isActive)}
                    className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: gw.isActive ? BHD_GREEN : '#d1d5db',
                    }}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        gw.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>
            ))}

            {!gatewaysLoading && !gatewaysError && gateways.length === 0 && (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">
                No gateways found. They are created automatically on first API
                call.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <DataTable
          columns={[
            {
              key: 'transactionId',
              header: 'Transaction ID',
              render: (row: (typeof mockPayments)[0]) => (
                <span className="font-mono text-xs text-gray-600">
                  {row.transactionId}
                </span>
              ),
            },
            {
              key: 'orderId',
              header: 'Order',
              render: (row: (typeof mockPayments)[0]) => (
                <span className="font-mono text-xs" style={{ color: BHD_GREEN }}>
                  {row.orderId}
                </span>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (row: (typeof mockPayments)[0]) => (
                <span className="text-gray-900">{row.customer}</span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              sortable: true,
              render: (row: (typeof mockPayments)[0]) => (
                <span className="font-bold text-gray-900">
                  {formatCurrency(row.amount)}
                </span>
              ),
            },
            {
              key: 'method',
              header: 'Method',
              render: (row: (typeof mockPayments)[0]) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                  {row.method.replace('_', ' ')}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              render: (row: (typeof mockPayments)[0]) => (
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
              key: 'date',
              header: 'Date',
              sortable: true,
              render: (row: (typeof mockPayments)[0]) => (
                <span className="text-gray-500">{formatDate(row.date)}</span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row: (typeof mockPayments)[0]) =>
                row.status === 'completed' ? (
                  <button
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50"
                    style={{ color: BHD_RED, borderColor: '#fecaca' }}
                  >
                    <ArrowUpRight size={13} />
                    Refund
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                ),
            },
          ]}
          data={mockPayments}
          rowId={(row) => row.id}
          searchKeys={['transactionId', 'customer', 'orderId']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ],
            },
            {
              key: 'method',
              label: 'Method',
              options: [
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'apple_pay', label: 'Apple Pay' },
              ],
            },
          ]}
          pagination={{
            page,
            limit,
            total: mockPayments.length,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      )}

      {activeTab === 'payouts' && (
        <DataTable
          columns={[
            {
              key: 'store',
              header: 'Store',
              render: (row: (typeof mockPayouts)[0]) => (
                <span className="font-medium text-gray-900">{row.store}</span>
              ),
            },
            {
              key: 'period',
              header: 'Period',
              render: (row: (typeof mockPayouts)[0]) => (
                <span className="text-gray-600">{row.period}</span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              sortable: true,
              render: (row: (typeof mockPayouts)[0]) => (
                <span className="font-bold text-gray-900">
                  {formatCurrency(row.amount)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: (typeof mockPayouts)[0]) => (
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    backgroundColor: `${payoutStatusColors[row.status]}15`,
                    color: payoutStatusColors[row.status],
                  }}
                >
                  {row.status}
                </span>
              ),
            },
            {
              key: 'createdAt',
              header: 'Created',
              render: (row: (typeof mockPayouts)[0]) => (
                <span className="text-gray-500">
                  {formatDate(row.createdAt)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (row: (typeof mockPayouts)[0]) =>
                row.status === 'pending' ? (
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90"
                    style={{ backgroundColor: BHD_GREEN }}
                  >
                    <Wallet size={13} />
                    Process
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">Processed</span>
                ),
            },
          ]}
          data={mockPayouts}
          rowId={(row) => row.id}
          selectable={false}
          pagination={{
            page,
            limit,
            total: mockPayouts.length,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      )}
    </div>
  );
}
