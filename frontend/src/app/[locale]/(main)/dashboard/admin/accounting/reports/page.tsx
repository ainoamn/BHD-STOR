'use client';

import React, { useState } from 'react';
import { BalanceSheet, IncomeStatement } from '@/components/accounting';

type ReportTab = 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('balance_sheet');
  const [periodStart, setPeriodStart] = useState('2024-01-01');
  const [periodEnd, setPeriodEnd] = useState('2024-12-31');

  const tabs: { key: ReportTab; labelAr: string; labelEn: string }[] = [
    { key: 'balance_sheet', labelAr: 'الميزانية العمومية', labelEn: 'Balance Sheet' },
    { key: 'income_statement', labelAr: 'قائمة الدخل', labelEn: 'Income Statement' },
    { key: 'cash_flow', labelAr: 'التدفقات النقدية', labelEn: 'Cash Flow' },
    { key: 'trial_balance', labelAr: 'ميزان المراجعة', labelEn: 'Trial Balance' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          التقارير المالية / Financial Reports
        </h1>
        <p className="text-gray-500 mt-2">
          عرض وتحميل التقارير المالية / View and export financial reports
        </p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From / من
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To / إلى
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex-1" />
          <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mt-5">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export / تصدير
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block">{tab.labelAr}</span>
                <span className="block text-xs">{tab.labelEn}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'balance_sheet' && <BalanceSheet />}
          {activeTab === 'income_statement' && <IncomeStatement />}
          {activeTab === 'cash_flow' && <CashFlowReport />}
          {activeTab === 'trial_balance' && <TrialBalanceReport />}
        </div>
      </div>
    </div>
  );
}

function CashFlowReport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-700">Operating Activities / الأنشطة التشغيلية</h4>
          <p className="text-2xl font-bold text-green-800 mt-1">+ 45,000 OMR</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-700">Investing Activities / الأنشطة الاستثمارية</h4>
          <p className="text-2xl font-bold text-blue-800 mt-1">- 12,000 OMR</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-700">Financing Activities / الأنشطة التمويلية</h4>
          <p className="text-2xl font-bold text-purple-800 mt-1">- 8,000 OMR</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <h4 className="text-lg font-semibold text-gray-800">
          Net Cash Flow / صافي التدفق النقدي
        </h4>
        <p className="text-3xl font-bold text-primary mt-2">+ 25,000 OMR</p>
      </div>
    </div>
  );
}

function TrialBalanceReport() {
  const accounts = [
    { code: '1000', name: 'Cash / النقدية', nameAr: 'النقدية', type: 'asset', debit: 50000, credit: 0 },
    { code: '1100', name: 'Accounts Receivable / الذمم المدينة', nameAr: 'الذمم المدينة', type: 'asset', debit: 25000, credit: 0 },
    { code: '1200', name: 'Inventory / المخزون', nameAr: 'المخزون', type: 'asset', debit: 35000, credit: 0 },
    { code: '2000', name: 'Accounts Payable / الذمم الدائنة', nameAr: 'الذمم الدائنة', type: 'liability', debit: 0, credit: 15000 },
    { code: '2100', name: 'Accrued Expenses / المصروفات المستحقة', nameAr: 'المصروفات المستحقة', type: 'liability', debit: 0, credit: 8000 },
    { code: '3000', name: 'Capital Capital / رأس المال', nameAr: 'رأس المال', type: 'equity', debit: 0, credit: 100000 },
    { code: '4000', name: 'Sales Revenue / إيرادات المبيعات', nameAr: 'إيرادات المبيعات', type: 'revenue', debit: 0, credit: 85000 },
    { code: '5000', name: 'Cost of Goods Sold / تكلفة البضاعة المباعة', nameAr: 'تكلفة البضاعة المباعة', type: 'expense', debit: 45000, credit: 0 },
    { code: '6000', name: 'Salaries Expense / مصروف الرواتب', nameAr: 'مصروف الرواتب', type: 'expense', debit: 25000, credit: 0 },
    { code: '6100', name: 'Rent Expense / مصروف الإيجار', nameAr: 'مصروف الإيجار', type: 'expense', debit: 8000, credit: 0 },
  ];

  const totalDebit = accounts.reduce((s, a) => s + a.debit, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.credit, 0);

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account / الحساب</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit / مدين</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit / دائن</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {accounts.map((acc) => (
            <tr key={acc.code} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono text-gray-900">{acc.code}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <div>{acc.name}</div>
                <div className="text-gray-500 text-xs">{acc.nameAr}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 capitalize">{acc.type}</td>
              <td className="px-4 py-3 text-sm text-right font-mono">
                {acc.debit > 0 ? `${acc.debit.toLocaleString()} OMR` : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right font-mono">
                {acc.credit > 0 ? `${acc.credit.toLocaleString()} OMR` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">Totals / الإجمالي</td>
            <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
              {totalDebit.toLocaleString()} OMR
            </td>
            <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
              {totalCredit.toLocaleString()} OMR
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
