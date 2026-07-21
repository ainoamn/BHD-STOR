'use client';

import React, { useState } from 'react';
import { PayrollTable } from '@/components/hr';

interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeNumber: string;
  period: string;
  basicSalary: number;
  allowances: Array<{ type: string; amount: number }>;
  deductions: Array<{ type: string; amount: number }>;
  overtime: number;
  bonus: number;
  grossSalary: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
}

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');

  const payrollRecords: PayrollRecord[] = [
    {
      id: '1', employeeName: 'Ahmed Al-Rashdi', employeeNumber: 'BHD-001', period: '2024-01',
      basicSalary: 5000, allowances: [{ type: 'housing', amount: 1250 }, { type: 'transport', amount: 500 }],
      deductions: [{ type: 'social_insurance', amount: 375 }], overtime: 0, bonus: 500,
      grossSalary: 7250, netSalary: 6875, status: 'paid',
    },
    {
      id: '2', employeeName: 'Fatima Al-Balushi', employeeNumber: 'BHD-002', period: '2024-01',
      basicSalary: 2800, allowances: [{ type: 'housing', amount: 700 }, { type: 'transport', amount: 280 }],
      deductions: [{ type: 'social_insurance', amount: 210 }], overtime: 150, bonus: 0,
      grossSalary: 3930, netSalary: 3720, status: 'paid',
    },
    {
      id: '3', employeeName: 'Mohammed Al-Habsi', employeeNumber: 'BHD-003', period: '2024-01',
      basicSalary: 2500, allowances: [{ type: 'housing', amount: 625 }, { type: 'transport', amount: 250 }],
      deductions: [{ type: 'social_insurance', amount: 187.5 }], overtime: 200, bonus: 0,
      grossSalary: 3575, netSalary: 3387.5, status: 'paid',
    },
    {
      id: '4', employeeName: 'Sara Al-Riyami', employeeNumber: 'BHD-004', period: '2024-01',
      basicSalary: 2200, allowances: [{ type: 'housing', amount: 550 }, { type: 'transport', amount: 220 }],
      deductions: [{ type: 'social_insurance', amount: 165 }], overtime: 100, bonus: 0,
      grossSalary: 3070, netSalary: 2905, status: 'processed',
    },
    {
      id: '5', employeeName: 'Khalid Al-Saadi', employeeNumber: 'BHD-005', period: '2024-01',
      basicSalary: 1800, allowances: [{ type: 'housing', amount: 450 }, { type: 'transport', amount: 180 }],
      deductions: [{ type: 'social_insurance', amount: 135 }], overtime: 80, bonus: 100,
      grossSalary: 2610, netSalary: 2475, status: 'processed',
    },
  ];

  const totals = {
    basicSalary: payrollRecords.reduce((s, r) => s + r.basicSalary, 0),
    allowances: payrollRecords.reduce((s, r) => s + r.allowances.reduce((a, b) => a + b.amount, 0), 0),
    deductions: payrollRecords.reduce((s, r) => s + r.deductions.reduce((a, b) => a + b.amount, 0), 0),
    overtime: payrollRecords.reduce((s, r) => s + r.overtime, 0),
    bonus: payrollRecords.reduce((s, r) => s + r.bonus, 0),
    grossSalary: payrollRecords.reduce((s, r) => s + r.grossSalary, 0),
    netSalary: payrollRecords.reduce((s, r) => s + r.netSalary, 0),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      processed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            معالجة الرواتب / Payroll Processing
          </h1>
          <p className="text-gray-500 mt-2">
            إدارة كشوف الرواتب الشهرية / Manage monthly payroll
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Process Payroll / معالجة
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period / الفترة
            </label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Net Pay / إجمالي الصافي</p>
            <p className="text-2xl font-bold text-primary font-mono">
              {formatCurrency(totals.netSalary)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[
          { label: 'Basic / أساسي', value: totals.basicSalary, color: 'bg-blue-50' },
          { label: 'Allowances / بدلات', value: totals.allowances, color: 'bg-green-50' },
          { label: 'Overtime / إضافي', value: totals.overtime, color: 'bg-orange-50' },
          { label: 'Bonus / مكافأة', value: totals.bonus, color: 'bg-purple-50' },
          { label: 'Deductions / استقطاعات', value: totals.deductions, color: 'bg-red-50' },
          { label: 'Gross / إجمالي', value: totals.grossSalary, color: 'bg-indigo-50' },
          { label: 'Net / الصافي', value: totals.netSalary, color: 'bg-teal-50' },
        ].map((item) => (
          <div key={item.label} className={`${item.color} rounded-lg p-3`}>
            <p className="text-xs text-gray-600">{item.label}</p>
            <p className="text-sm font-bold font-mono">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Payroll Table */}
      <div className="mb-8">
        <PayrollTable records={payrollRecords} />
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            تفاصيل الرواتب / Payroll Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Housing</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transport</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overtime</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bonus</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Social Ins.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                    <div className="text-xs text-gray-500">{record.employeeNumber}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">{formatCurrency(record.basicSalary)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-green-600">
                    {formatCurrency(record.allowances.find((a) => a.type === 'housing')?.amount ?? 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-green-600">
                    {formatCurrency(record.allowances.find((a) => a.type === 'transport')?.amount ?? 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-orange-600">
                    {formatCurrency(record.overtime)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-purple-600">
                    {formatCurrency(record.bonus)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-red-600">
                    -{formatCurrency(record.deductions.find((d) => d.type === 'social_insurance')?.amount ?? 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-medium">
                    {formatCurrency(record.grossSalary)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-bold text-primary">
                    {formatCurrency(record.netSalary)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td className="px-4 py-3 text-sm">Totals / الإجمالي</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(totals.basicSalary)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(totals.allowances)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(totals.overtime)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(totals.bonus)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono text-red-600">-{formatCurrency(totals.deductions)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(totals.grossSalary)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono font-bold text-primary">{formatCurrency(totals.netSalary)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
