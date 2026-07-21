'use client';

import React from 'react';

interface IncomeItem {
  code: string;
  name: string;
  nameAr: string;
  amount: number;
}

export function IncomeStatement() {
  const revenue: IncomeItem[] = [
    { code: '4100', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', amount: 85000 },
    { code: '4200', name: 'Service Revenue', nameAr: 'إيرادات الخدمات', amount: 15000 },
    { code: '4300', name: 'Other Revenue', nameAr: 'إيرادات أخرى', amount: 2500 },
  ];

  const cogs: IncomeItem[] = [
    { code: '5100', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', amount: 45000 },
  ];

  const operatingExpenses: IncomeItem[] = [
    { code: '5210', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', amount: 18000 },
    { code: '5220', name: 'Rent Expense', nameAr: 'مصروف الإيجار', amount: 7000 },
    { code: '5230', name: 'Utilities', nameAr: 'المرافق', amount: 2500 },
    { code: '5240', name: 'Marketing & Advertising', nameAr: 'التسويق والإعلان', amount: 3500 },
    { code: '5250', name: 'Depreciation', nameAr: 'الإهلاك', amount: 3000 },
  ];

  const adminExpenses: IncomeItem[] = [
    { code: '5310', name: 'Office Supplies', nameAr: 'مستلزمات مكتبية', amount: 800 },
    { code: '5320', name: 'Legal & Professional Fees', nameAr: 'رسوم قانونية ومهنية', amount: 1200 },
    { code: '5330', name: 'Insurance', nameAr: 'التأمين', amount: 2000 },
  ];

  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalCOGS = cogs.reduce((s, c) => s + c.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalOperatingExpenses = operatingExpenses.reduce((s, e) => s + e.amount, 0);
  const totalAdminExpenses = adminExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalOperatingExpenses + totalAdminExpenses;
  const operatingIncome = grossProfit - totalOperatingExpenses;
  const netIncome = grossProfit - totalExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const renderItem = (item: IncomeItem) => (
    <div
      key={item.code}
      className="flex justify-between py-1.5 px-4 hover:bg-gray-50 transition-colors"
    >
      <div>
        <span className="font-mono text-xs text-gray-400 mr-2">
          {item.code}
        </span>
        <span className="text-sm text-gray-700">{item.name}</span>
        <span className="text-xs text-gray-400 mr-2">/ {item.nameAr}</span>
      </div>
      <span className="text-sm font-mono text-gray-700">
        {formatCurrency(item.amount)}
      </span>
    </div>
  );

  const renderSubtotal = (labelAr: string, labelEn: string, amount: number, color: string = 'text-gray-900') => (
    <div className="flex justify-between py-2 px-4 bg-gray-50 border-t border-gray-200">
      <span className="font-semibold text-sm text-gray-800">
        {labelAr} / {labelEn}
      </span>
      <span className={`font-bold text-sm font-mono ${color}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          قائمة الدخل / Income Statement
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          للفترة المنتهية في 31 ديسمبر 2024 / For the period ending December 31, 2024
        </p>
      </div>

      {/* Revenue */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 px-4">
          الإيرادات / Revenue
        </h4>
        <div className="divide-y divide-gray-100">
          {revenue.map(renderItem)}
        </div>
        {renderSubtotal('إجمالي الإيرادات', 'Total Revenue', totalRevenue, 'text-green-700')}
      </div>

      {/* COGS */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 px-4">
          تكلفة البضاعة المباعة / Cost of Goods Sold
        </h4>
        <div className="divide-y divide-gray-100">
          {cogs.map(renderItem)}
        </div>
        {renderSubtotal('إجمالي تكلفة البضاعة', 'Total COGS', totalCOGS, 'text-red-600')}
      </div>

      {/* Gross Profit */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex justify-between">
          <span className="font-bold text-blue-900">
            الربح الإجمالي / Gross Profit
          </span>
          <span className="font-bold text-blue-900 font-mono text-lg">
            {formatCurrency(grossProfit)}
          </span>
        </div>
        <div className="text-sm text-blue-700 mt-1">
          هامش الربح الإجمالي / Gross Margin:{' '}
          {((grossProfit / totalRevenue) * 100).toFixed(1)}%
        </div>
      </div>

      {/* Operating Expenses */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 px-4">
          المصروفات التشغيلية / Operating Expenses
        </h4>
        <div className="divide-y divide-gray-100">
          {operatingExpenses.map(renderItem)}
        </div>
        {renderSubtotal('إجمالي المصروفات التشغيلية', 'Total Operating Expenses', totalOperatingExpenses, 'text-red-600')}
      </div>

      {/* Administrative Expenses */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 px-4">
          المصروفات الإدارية / Administrative Expenses
        </h4>
        <div className="divide-y divide-gray-100">
          {adminExpenses.map(renderItem)}
        </div>
        {renderSubtotal('إجمالي المصروفات الإدارية', 'Total Admin Expenses', totalAdminExpenses, 'text-red-600')}
      </div>

      {/* Operating Income */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
        <div className="flex justify-between">
          <span className="font-bold text-indigo-900">
            الدخل التشغيلي / Operating Income
          </span>
          <span className="font-bold text-indigo-900 font-mono text-lg">
            {formatCurrency(operatingIncome)}
          </span>
        </div>
        <div className="text-sm text-indigo-700 mt-1">
          هامح التشغيل / Operating Margin:{' '}
          {((operatingIncome / totalRevenue) * 100).toFixed(1)}%
        </div>
      </div>

      {/* Net Income */}
      <div
        className={`rounded-lg p-6 border-2 text-center ${
          netIncome >= 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <h4 className="text-lg font-bold text-gray-900">
          صافي الدخل / Net Income
        </h4>
        <p
          className={`text-3xl font-bold mt-2 font-mono ${
            netIncome >= 0 ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {formatCurrency(netIncome)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          هامش صافي الربح / Net Margin:{' '}
          {((netIncome / totalRevenue) * 100).toFixed(1)}%
        </p>
      </div>

      {/* Expense Breakdown Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-4">
          توزيع المصروفات / Expense Breakdown
        </h4>
        <div className="space-y-2">
          {[...operatingExpenses, ...adminExpenses]
            .sort((a, b) => b.amount - a.amount)
            .map((exp) => {
              const pct = ((exp.amount / totalExpenses) * 100).toFixed(1);
              return (
                <div key={exp.code}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{exp.nameAr}</span>
                    <span className="text-gray-900 font-mono">
                      {formatCurrency(exp.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
