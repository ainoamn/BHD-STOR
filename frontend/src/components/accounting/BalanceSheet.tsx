'use client';

import React from 'react';

interface BalanceSheetAccount {
  code: string;
  name: string;
  nameAr: string;
  balance: number;
}

export function BalanceSheet() {
  const assets: BalanceSheetAccount[] = [
    { code: '1110', name: 'Cash & Bank', nameAr: 'النقدية والبنوك', balance: 50000 },
    { code: '1120', name: 'Accounts Receivable', nameAr: 'الذمم المدينة', balance: 25000 },
    { code: '1130', name: 'Inventory', nameAr: 'المخزون', balance: 35000 },
    { code: '1210', name: 'Equipment', nameAr: 'المعدات', balance: 30000 },
    { code: '1220', name: 'Vehicles', nameAr: 'المركبات', balance: 20000 },
  ];

  const liabilities: BalanceSheetAccount[] = [
    { code: '2110', name: 'Accounts Payable', nameAr: 'الذمم الدائنة', balance: 15000 },
    { code: '2120', name: 'Accrued Expenses', nameAr: 'المصروفات المستحقة', balance: 8000 },
  ];

  const equity: BalanceSheetAccount[] = [
    { code: '3100', name: 'Share Capital', nameAr: 'رأس المال', balance: 100000 },
    { code: '3200', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', balance: 37000 },
  ];

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const renderAccountRow = (account: BalanceSheetAccount) => (
    <div
      key={account.code}
      className="flex justify-between py-2 px-4 hover:bg-gray-50 transition-colors"
    >
      <div>
        <span className="font-mono text-sm text-gray-500 mr-2">
          {account.code}
        </span>
        <span className="text-sm text-gray-900">{account.name}</span>
        <span className="text-xs text-gray-500 mr-2">/ {account.nameAr}</span>
      </div>
      <span className="text-sm font-mono text-gray-900">
        {formatCurrency(account.balance)}
      </span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Assets */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900">
            الأصول / Assets
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {assets.map(renderAccountRow)}
        </div>
        <div className="bg-blue-50 px-4 py-3 border-t border-blue-100 flex justify-between">
          <span className="font-semibold text-blue-900">
            إجمالي الأصول / Total Assets
          </span>
          <span className="font-bold text-blue-900 font-mono">
            {formatCurrency(totalAssets)}
          </span>
        </div>
      </div>

      {/* Liabilities */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-red-50 px-4 py-3 border-b border-red-100">
          <h3 className="text-lg font-semibold text-red-900">
            الالتزامات / Liabilities
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {liabilities.map(renderAccountRow)}
        </div>
        <div className="bg-red-50 px-4 py-3 border-t border-red-100 flex justify-between">
          <span className="font-semibold text-red-900">
            إجمالي الالتزامات / Total Liabilities
          </span>
          <span className="font-bold text-red-900 font-mono">
            {formatCurrency(totalLiabilities)}
          </span>
        </div>
      </div>

      {/* Equity */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-green-50 px-4 py-3 border-b border-green-100">
          <h3 className="text-lg font-semibold text-green-900">
            حقوق الملكية / Equity
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {equity.map(renderAccountRow)}
        </div>
        <div className="bg-green-50 px-4 py-3 border-t border-green-100 flex justify-between">
          <span className="font-semibold text-green-900">
            إجمالي حقوق الملكية / Total Equity
          </span>
          <span className="font-bold text-green-900 font-mono">
            {formatCurrency(totalEquity)}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div
        className={`rounded-lg border-2 p-4 text-center ${
          Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex justify-center items-center gap-8">
          <div>
            <p className="text-sm text-gray-600">
              إجمالي الأصول / Total Assets
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totalAssets)}
            </p>
          </div>
          <span className="text-2xl text-gray-400">=</span>
          <div>
            <p className="text-sm text-gray-600">
              الالتزامات + حقوق الملكية / Liabilities + Equity
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totalLiabilitiesAndEquity)}
            </p>
          </div>
        </div>
        {Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01 ? (
          <p className="text-green-700 text-sm mt-2 font-medium">
            ✓ الميزانية متوازنة / Balance Sheet Balanced
          </p>
        ) : (
          <p className="text-red-700 text-sm mt-2 font-medium">
            ✗ الميزانية غير متوازنة / Balance Sheet Not Balanced
          </p>
        )}
      </div>
    </div>
  );
}
