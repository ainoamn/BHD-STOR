'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useB2bAuth, useB2bAccount, useB2bBilling } from '../../../../../hooks/useB2b';

export default function B2bBillingPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useB2bAuth();
  const { account } = useB2bAccount();
  const { statements, loading: billingLoading } = useB2bBilling();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/en/shipping-portal');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  const creditUsagePercent = account
    ? Math.round((account.creditUsed / account.creditLimit) * 100)
    : 0;

  const creditStatusColor =
    creditUsagePercent > 90
      ? 'text-red-600'
      : creditUsagePercent > 70
      ? 'text-amber-600'
      : 'text-emerald-600';

  // Mock payment history
  const paymentHistory = [
    { id: 1, date: '2024-12-15', amount: 4500000, method: 'Bank Transfer', status: 'completed' },
    { id: 2, date: '2024-11-15', amount: 3200000, method: 'Bank Transfer', status: 'completed' },
    { id: 3, date: '2024-10-15', amount: 5800000, method: 'Bank Transfer', status: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/en/shipping-portal/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </button>
            <span className="text-gray-300 mx-3">|</span>
            <h1 className="font-semibold text-gray-800">Billing</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
          <p className="text-gray-500 mt-1">Manage your account balance and view statements</p>
        </div>

        {/* Credit Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Current Balance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className={`text-2xl font-bold ${creditStatusColor}`}>
                  {formatCurrency(account?.creditUsed || 0)}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  creditUsagePercent > 90
                    ? 'bg-red-500'
                    : creditUsagePercent > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {creditUsagePercent}% of credit limit used
            </p>
          </div>

          {/* Credit Limit */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account?.creditLimit || 0)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Available:{' '}
              <span className="font-semibold text-emerald-600">
                {formatCurrency(account?.creditAvailable || 0)}
              </span>
            </p>
          </div>

          {/* Next Due Date */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Statement</p>
                <p className="text-2xl font-bold text-gray-900">Jan 31, 2025</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Payment due: <span className="font-semibold">Feb 15, 2025</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statements List */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statements</h3>
            {billingLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                <svg className="w-6 h-6 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading statements...
              </div>
            ) : statements.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No statements available</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          Period
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          Shipments
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {statements.map((stmt) => (
                        <tr key={stmt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{stmt.period}</p>
                            <p className="text-xs text-gray-500">
                              Due: {new Date(stmt.dueDate).toLocaleDateString('en-US')}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono text-blue-600">
                            {stmt.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(stmt.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {stmt.shipmentCount}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stmt.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : stmt.status === 'overdue'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {stmt.status === 'paid'
                                ? 'Paid'
                                : stmt.status === 'overdue'
                                ? 'Overdue'
                                : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                alert(`Downloading invoice ${stmt.invoiceNumber}...`)
                              }
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download Invoice"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Payment History */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Payment History
              </h3>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{payment.method}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Limit Indicator */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Credit Utilization
              </h3>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={creditUsagePercent > 90 ? '#ef4444' : creditUsagePercent > 70 ? '#f59e0b' : '#10b981'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${creditUsagePercent * 2.64} ${264 - creditUsagePercent * 2.64}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${creditStatusColor}`}>
                    {creditUsagePercent}%
                  </span>
                  <span className="text-xs text-gray-500">used</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Limit</span>
                  <span className="font-medium">{formatCurrency(account?.creditLimit || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Used</span>
                  <span className="font-medium">{formatCurrency(account?.creditUsed || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(account?.creditAvailable || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">
                Payment Information
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p>
                  <span className="font-medium">Bank:</span> BHD Logistics Co., Ltd.
                </p>
                <p>
                  <span className="font-medium">Account:</span> 123456789
                </p>
                <p>
                  <span className="font-medium">Bank Name:</span> Vietcombank
                </p>
                <p className="text-blue-600 text-xs mt-3">
                  Please include your company ID in the transfer description.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
