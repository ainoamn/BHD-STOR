'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useB2bAuth,
  useB2bAccount,
  useB2bShipments,
} from '../../../../../hooks/useB2b';
import B2bShipmentTable from '../../../../../components/b2b/B2bShipmentTable';

export default function B2bDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, companyName } = useB2bAuth();
  const { account } = useB2bAccount();
  const { shipments, meta, loading: shipmentsLoading } = useB2bShipments({
    limit: 5,
  });

  // Redirect if not authenticated
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

  // Mock stats (in production, from account API)
  const stats = [
    {
      title: 'Shipments This Month',
      value: account?.totalShipments || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Shipments',
      value: shipments.filter((s) => ['pending_pickup', 'picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Delivered',
      value: shipments.filter((s) => s.status === 'delivered').length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600',
      trend: '98%',
      trendUp: true,
    },
    {
      title: 'Total Spent',
      value: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(shipments.reduce((sum, s) => sum + s.shippingFee, 0)),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-violet-50 text-violet-600',
      trend: null,
      trendUp: null,
    },
  ];

  // Usage chart data (mock - would come from API)
  const usageData = [
    { day: 'Mon', shipments: 12 },
    { day: 'Tue', shipments: 19 },
    { day: 'Wed', shipments: 8 },
    { day: 'Thu', shipments: 25 },
    { day: 'Fri', shipments: 32 },
    { day: 'Sat', shipments: 15 },
    { day: 'Sun', shipments: 5 },
  ];
  const maxShipments = Math.max(...usageData.map((d) => d.shipments));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/en/shipping-portal')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900 hidden sm:inline">BHD Logistics</span>
              </button>
              <span className="text-gray-300">|</span>
              <h1 className="font-semibold text-gray-800">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {account && (
                <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{companyName}</span>
                </div>
              )}
              <button
                onClick={() => router.push('/en/shipping-portal/settings')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {companyName || 'Business Partner'}
          </h2>
          <p className="text-gray-500 mt-1">
            Here is what is happening with your shipments today.
          </p>
        </div>

        {/* Credit Balance Banner */}
        {account && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Available Credit</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0,
                  }).format(account.creditAvailable)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Credit Usage</span>
                  <span className="font-medium text-gray-700">
                    {Math.round((account.creditUsed / account.creditLimit) * 100)}%
                  </span>
                </div>
                <div className="w-full sm:w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((account.creditUsed / account.creditLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  minimumFractionDigits: 0,
                }).format(account.creditUsed)} /{' '}
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  minimumFractionDigits: 0,
                }).format(account.creditLimit)}
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      stat.trendUp
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shipments */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Shipments</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/en/shipping-portal/shipments/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Shipment
                </button>
                <button
                  onClick={() => router.push('/en/shipping-portal/shipments')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  View All
                </button>
              </div>
            </div>
            {shipmentsLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                <svg className="w-6 h-6 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading shipments...
              </div>
            ) : (
              <B2bShipmentTable
                shipments={shipments}
                onViewDetail={(s) => router.push(`/en/shipping-portal/shipments?id=${s.id}`)}
                onTrack={(tn) => router.push(`/en/shipping-portal/tracking?n=${tn}`)}
              />
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Weekly Usage Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Weekly Shipments
              </h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {usageData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 mb-0.5">{d.shipments}</span>
                      <div
                        className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                        style={{ height: `${(d.shipments / maxShipments) * 96}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: 'Create Shipment',
                    desc: 'New single shipment',
                    href: '/en/shipping-portal/shipments/create',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Bulk Upload',
                    desc: 'Upload CSV file',
                    href: '/en/shipping-portal/shipments?bulk=true',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Track Shipment',
                    desc: 'Check delivery status',
                    href: '/en/shipping-portal/tracking',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7" />
                      </svg>
                    ),
                  },
                  {
                    label: 'View Billing',
                    desc: 'Statements & invoices',
                    href: '/en/shipping-portal/billing',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                ].map((link) => (
                  <button
                    key={link.label}
                    onClick={() => router.push(link.href)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      {link.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* API Usage */}
            {account && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  API Usage
                </h3>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Calls this month</span>
                  <span className="font-medium text-gray-900">
                    {account.apiCallCount.toLocaleString()} / {account.apiCallLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((account.apiCallCount / account.apiCallLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(
                    (1 - account.apiCallCount / account.apiCallLimit) * 100,
                  )}% remaining
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
