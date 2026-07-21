'use client';

import React from 'react';

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

interface PayrollTableProps {
  records?: PayrollRecord[];
}

export function PayrollTable({ records }: PayrollTableProps) {
  const defaultRecords: PayrollRecord[] = [
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
      grossSalary: 3575, netSalary: 3387.5, status: 'processed',
    },
  ];

  const displayRecords = records ?? defaultRecords;

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
    const labels: Record<string, string> = {
      draft: 'Draft / مسودة',
      processed: 'Processed / معالج',
      paid: 'Paid / مدفوع',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getAllowanceBreakdown = (allowances: Array<{ type: string; amount: number }>) => {
    const housing = allowances.find((a) => a.type === 'housing')?.amount ?? 0;
    const transport = allowances.find((a) => a.type === 'transport')?.amount ?? 0;
    return { housing, transport, other: allowances.reduce((s, a) => s + a.amount, 0) - housing - transport };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          كشوف الرواتب / Payroll Records
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                Employee / الموظف
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Basic / أساسي
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Housing / سكن
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Transport / نقل
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                OT / إضافي
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Social Ins. / تأمين
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Gross / إجمالي
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Net / الصافي
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status / الحالة
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions / إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayRecords.map((record) => {
              const breakdown = getAllowanceBreakdown(record.allowances);
              const socialInsurance =
                record.deductions.find((d) => d.type === 'social_insurance')
                  ?.amount ?? 0;

              return (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">
                      {record.employeeName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {record.employeeNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">
                    {formatCurrency(record.basicSalary)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-green-600">
                    {formatCurrency(breakdown.housing)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-green-600">
                    {formatCurrency(breakdown.transport)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-orange-600">
                    {record.overtime > 0
                      ? formatCurrency(record.overtime)
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-red-600">
                    -{formatCurrency(socialInsurance)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-medium">
                    {formatCurrency(record.grossSalary)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono font-bold text-primary">
                    {formatCurrency(record.netSalary)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {record.status === 'processed' && (
                      <button className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors">
                        Pay / دفع
                      </button>
                    )}
                    {record.status === 'paid' && (
                      <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors">
                        Slip / قسيمة
                      </button>
                    )}
                    {record.status === 'draft' && (
                      <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">
                        Process / معالجة
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-gray-500">Records / سجلات: </span>
            <span className="font-semibold text-gray-900">
              {displayRecords.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Basic / إجمالي الأساسي: </span>
            <span className="font-semibold text-gray-900 font-mono">
              {formatCurrency(
                displayRecords.reduce((s, r) => s + r.basicSalary, 0),
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Gross / إجمالي الإجمالي: </span>
            <span className="font-semibold text-gray-900 font-mono">
              {formatCurrency(
                displayRecords.reduce((s, r) => s + r.grossSalary, 0),
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Net / إجمالي الصافي: </span>
            <span className="font-semibold text-primary font-mono">
              {formatCurrency(
                displayRecords.reduce((s, r) => s + r.netSalary, 0),
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
