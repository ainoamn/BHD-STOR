'use client';

import React, { useState } from 'react';

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  balance: number;
  isActive: boolean;
  children?: Account[];
}

interface ChartOfAccountsProps {
  accounts?: Account[];
}

const typeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-green-100 text-green-800',
  revenue: 'bg-purple-100 text-purple-800',
  expense: 'bg-orange-100 text-orange-800',
};

const typeLabelsAr: Record<string, string> = {
  asset: 'أصل',
  liability: 'التزام',
  equity: 'حقوق ملكية',
  revenue: 'إيراد',
  expense: 'مصروف',
};

export function ChartOfAccounts({ accounts }: ChartOfAccountsProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const defaultAccounts: Account[] = [
    {
      id: '1', code: '1000', name: 'Assets', nameAr: 'الأصول', type: 'asset', category: 'asset', balance: 110000, isActive: true,
      children: [
        { id: '2', code: '1100', name: 'Current Assets', nameAr: 'الأصول المتداولة', type: 'asset', category: 'current_asset', balance: 60000, isActive: true, children: [
          { id: '3', code: '1110', name: 'Cash', nameAr: 'النقدية', type: 'asset', category: 'current_asset', balance: 50000, isActive: true },
          { id: '4', code: '1120', name: 'Accounts Receivable', nameAr: 'الذمم المدينة', type: 'asset', category: 'current_asset', balance: 25000, isActive: true },
          { id: '5', code: '1130', name: 'Inventory', nameAr: 'المخزون', type: 'asset', category: 'current_asset', balance: 35000, isActive: true },
        ]},
        { id: '6', code: '1200', name: 'Fixed Assets', nameAr: 'الأصول الثابتة', type: 'asset', category: 'fixed_asset', balance: 50000, isActive: true, children: [
          { id: '7', code: '1210', name: 'Equipment', nameAr: 'المعدات', type: 'asset', category: 'fixed_asset', balance: 30000, isActive: true },
          { id: '8', code: '1220', name: 'Vehicles', nameAr: 'المركبات', type: 'asset', category: 'fixed_asset', balance: 20000, isActive: true },
        ]},
      ],
    },
    {
      id: '9', code: '2000', name: 'Liabilities', nameAr: 'الالتزامات', type: 'liability', category: 'liability', balance: 23000, isActive: true,
      children: [
        { id: '10', code: '2100', name: 'Current Liabilities', nameAr: 'الالتزامات المتداولة', type: 'liability', category: 'current_liability', balance: 23000, isActive: true, children: [
          { id: '11', code: '2110', name: 'Accounts Payable', nameAr: 'الذمم الدائنة', type: 'liability', category: 'current_liability', balance: 15000, isActive: true },
          { id: '12', code: '2120', name: 'Accrued Expenses', nameAr: 'المصروفات المستحقة', type: 'liability', category: 'current_liability', balance: 8000, isActive: true },
        ]},
      ],
    },
    {
      id: '13', code: '3000', name: 'Equity', nameAr: 'حقوق الملكية', type: 'equity', category: 'equity', balance: 87000, isActive: true,
      children: [
        { id: '14', code: '3100', name: 'Capital', nameAr: 'رأس المال', type: 'equity', category: 'equity', balance: 100000, isActive: true },
        { id: '15', code: '3200', name: 'Retained Earnings', nameAr: ' الأرباح المحتجزة', type: 'equity', category: 'retained_earnings', balance: -13000, isActive: true },
      ],
    },
    {
      id: '16', code: '4000', name: 'Revenue', nameAr: 'الإيرادات', type: 'revenue', category: 'revenue', balance: 85000, isActive: true,
      children: [
        { id: '17', code: '4100', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'revenue', category: 'operating_revenue', balance: 85000, isActive: true },
      ],
    },
    {
      id: '18', code: '5000', name: 'Expenses', nameAr: 'المصروفات', type: 'expense', category: 'expense', balance: 78000, isActive: true,
      children: [
        { id: '19', code: '5100', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense', category: 'cost_of_goods_sold', balance: 45000, isActive: true },
        { id: '20', code: '5200', name: 'Operating Expenses', nameAr: 'المصروفات التشغيلية', type: 'expense', category: 'operating_expense', balance: 25000, isActive: true, children: [
          { id: '21', code: '5210', name: 'Salaries', nameAr: 'الرواتب', type: 'expense', category: 'operating_expense', balance: 18000, isActive: true },
          { id: '22', code: '5220', name: 'Rent', nameAr: 'الإيجار', type: 'expense', category: 'operating_expense', balance: 7000, isActive: true },
        ]},
        { id: '23', code: '5300', name: 'Administrative Expenses', nameAr: 'المصروفات الإدارية', type: 'expense', category: 'administrative_expense', balance: 8000, isActive: true },
      ],
    },
  ];

  const displayAccounts = accounts ?? defaultAccounts;

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filterAccounts = (accs: Account[]): Account[] => {
    if (!searchQuery) return accs;
    const q = searchQuery.toLowerCase();
    return accs.filter((acc) => {
      const match =
        acc.name.toLowerCase().includes(q) ||
        acc.nameAr.toLowerCase().includes(q) ||
        acc.code.includes(q);
      if (acc.children) {
        const childMatch = filterAccounts(acc.children).length > 0;
        return match || childMatch;
      }
      return match;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);
  };

  const renderAccount = (account: Account, depth: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);

    return (
      <div key={account.id}>
        <div
          className={`flex items-center py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${
            depth > 0 ? 'bg-gray-50/50' : ''
          }`}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
          onClick={() => hasChildren && toggleNode(account.id)}
        >
          {hasChildren ? (
            <svg
              className={`w-4 h-4 mr-2 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          ) : (
            <span className="w-4 mr-2" />
          )}

          <span className="font-mono text-sm text-gray-500 w-16">
            {account.code}
          </span>

          <div className="flex-1 ml-4">
            <div className="text-sm font-medium text-gray-900">
              {account.name}
            </div>
            <div className="text-xs text-gray-500">{account.nameAr}</div>
          </div>

          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[account.type]}`}
          >
            {typeLabelsAr[account.type]} / {account.type}
          </span>

          <span className="ml-4 text-sm font-mono text-gray-700 w-32 text-right">
            {formatCurrency(account.balance)}
          </span>

          <span
            className={`ml-4 px-2 py-0.5 rounded-full text-xs ${
              account.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {account.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {hasChildren && isExpanded &&
          account.children!.map((child) => renderAccount(child, depth + 1))}
      </div>
    );
  };

  const filtered = filterAccounts(displayAccounts);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts / البحث في الحسابات..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Account / إضافة حساب
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
        <span className="w-16">Code</span>
        <span className="flex-1 ml-4">Account Name / اسم الحساب</span>
        <span className="w-24 text-center">Type / النوع</span>
        <span className="w-32 text-right">Balance / الرصيد</span>
        <span className="w-16 text-center">Status</span>
      </div>

      {/* Tree */}
      <div className="divide-y divide-gray-100">
        {filtered.map((account) => renderAccount(account))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No accounts found / لم يتم العثور على حسابات
        </div>
      )}
    </div>
  );
}
