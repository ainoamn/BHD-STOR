'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface DashboardStats {
  totalAccounts: number;
  totalJournalEntries: number;
  postedEntries: number;
  draftEntries: number;
  totalAssets: number;
  totalLiabilities: number;
  netIncome: number;
}

export default function AccountingDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('accounting');
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalJournalEntries: 0,
    postedEntries: 0,
    draftEntries: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    netIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real app, fetch from API
    // fetch('/api/accounting/stats').then(res => res.json()).then(setStats)
    setTimeout(() => {
      setStats({
        totalAccounts: 42,
        totalJournalEntries: 1285,
        postedEntries: 1200,
        draftEntries: 85,
        totalAssets: 250000,
        totalLiabilities: 85000,
        netIncome: 45000,
      });
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-OM' : 'en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);
  };

  const cards = [
    {
      title: t('totalAccounts'),
      value: stats.totalAccounts,
      href: `/dashboard/admin/accounting/accounts`,
      color: 'bg-blue-500',
    },
    {
      title: t('journalEntries'),
      value: stats.totalJournalEntries,
      href: `/dashboard/admin/accounting/journal`,
      color: 'bg-green-500',
    },
    {
      title: t('postedEntries'),
      value: stats.postedEntries,
      href: `/dashboard/admin/accounting/journal`,
      color: 'bg-emerald-500',
    },
    {
      title: t('draftEntries'),
      value: stats.draftEntries,
      href: `/dashboard/admin/accounting/journal`,
      color: 'bg-yellow-500',
    },
    {
      title: t('totalAssets'),
      value: formatCurrency(stats.totalAssets),
      href: `/dashboard/admin/accounting/reports`,
      color: 'bg-indigo-500',
    },
    {
      title: t('totalLiabilities'),
      value: formatCurrency(stats.totalLiabilities),
      href: `/dashboard/admin/accounting/reports`,
      color: 'bg-red-500',
    },
    {
      title: t('netIncome'),
      value: formatCurrency(stats.netIncome),
      href: `/dashboard/admin/accounting/reports`,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('accountingDashboard')}
        </h1>
        <p className="text-gray-500 mt-2">
          {t('dashboardSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={`/${locale}${card.href}`}
            className="block group"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-primary transition-colors">
                {card.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('quickActions')}
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/${locale}/dashboard/admin/accounting/journal`}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('newJournalEntry')}
          </Link>
          <Link
            href={`/${locale}/dashboard/admin/accounting/reports`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('viewReports')}
          </Link>
        </div>
      </div>
    </div>
  );
}
