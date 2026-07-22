'use client';

import React, { useState } from 'react';
import { JournalEntryForm } from '@/components/accounting';

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  descriptionAr: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  reference: string;
  referenceType: string;
}

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      entryNumber: 'JE-20240115-001',
      date: '2024-01-15',
      description: 'Sales Order #12345',
      descriptionAr: 'طلب بيع #12345',
      totalDebit: 1500.0,
      totalCredit: 1500.0,
      status: 'posted',
      reference: 'ORD-12345',
      referenceType: 'order',
    },
    {
      id: '2',
      entryNumber: 'JE-20240115-002',
      date: '2024-01-15',
      description: 'Expense - Office Supplies',
      descriptionAr: 'مصروف - مستلزمات مكتبية',
      totalDebit: 75.5,
      totalCredit: 75.5,
      status: 'posted',
      reference: 'EXP-001',
      referenceType: 'expense',
    },
    {
      id: '3',
      entryNumber: 'JE-20240116-001',
      date: '2024-01-16',
      description: 'Monthly Payroll',
      descriptionAr: 'الرواتب الشهرية',
      totalDebit: 25000.0,
      totalCredit: 25000.0,
      status: 'draft',
      reference: 'PAY-2024-01',
      referenceType: 'payroll',
    },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      posted: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      reversed: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            القيود اليومية / Journal Entries
          </h1>
          <p className="text-gray-500 mt-2">
            إدارة القيود المحاسبية / Manage journal entries
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
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
          New Entry / قيد جديد
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <JournalEntryForm
            onSuccess={(entry) => {
              setEntries([entry as JournalEntry, ...entries]);
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="From Date"
          />
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="To Date"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">All Status / جميع الحالات</option>
            <option value="posted">Posted / مرحل</option>
            <option value="draft">Draft / مسودة</option>
            <option value="reversed">Reversed / معكوس</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">All Types / جميع الأنواع</option>
            <option value="order">Order / طلب</option>
            <option value="payment">Payment / دفع</option>
            <option value="expense">Expense / مصروف</option>
            <option value="payroll">Payroll / رواتب</option>
            <option value="adjustment">Adjustment / تسوية</option>
          </select>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry # / رقم القيد
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date / التاريخ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description / الوصف
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Debit / مدين
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit / دائن
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status / الحالة
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions / إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                  {entry.entryNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>{entry.description}</div>
                  <div className="text-gray-500 text-xs">{entry.descriptionAr}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatCurrency(entry.totalDebit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {formatCurrency(entry.totalCredit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(entry.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-primary hover:text-primary/80 font-medium mr-3">
                    View
                  </button>
                  {entry.status === 'draft' && (
                    <button className="text-green-600 hover:text-green-700 font-medium mr-3">
                      Post
                    </button>
                  )}
                  {entry.status === 'posted' && (
                    <button className="text-red-600 hover:text-red-700 font-medium">
                      Reverse
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
