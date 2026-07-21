'use client';

import React, { useState } from 'react';

interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

interface JournalEntryFormProps {
  onSuccess?: (entry: unknown) => void;
}

const accounts = [
  { id: '1110', name: 'Cash / النقدية' },
  { id: '1120', name: 'Accounts Receivable / الذمم المدينة' },
  { id: '1130', name: 'Inventory / المخزون' },
  { id: '2110', name: 'Accounts Payable / الذمم الدائنة' },
  { id: '3100', name: 'Capital / رأس المال' },
  { id: '4100', name: 'Sales Revenue / إيرادات المبيعات' },
  { id: '5100', name: 'Cost of Goods Sold / تكلفة البضاعة المباعة' },
  { id: '5210', name: 'Salaries Expense / مصروف الرواتب' },
  { id: '5220', name: 'Rent Expense / مصروف الإيجار' },
];

export function JournalEntryForm({ onSuccess }: JournalEntryFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [reference, setReference] = useState('');
  const [referenceType, setReferenceType] = useState('adjustment');
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountId: '', accountName: '', debit: '', credit: '', description: '' },
    { id: '2', accountId: '', accountName: '', debit: '', credit: '', description: '' },
  ]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: Date.now().toString(),
        accountId: '',
        accountName: '',
        debit: '',
        credit: '',
        description: '',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (
    id: string,
    field: keyof JournalLine,
    value: string,
  ) => {
    setLines(
      lines.map((l) => {
        if (l.id !== id) return l;
        if (field === 'accountId') {
          const acc = accounts.find((a) => a.id === value);
          return { ...l, accountId: value, accountName: acc?.name ?? '' };
        }
        return { ...l, [field]: value };
      }),
    );
  };

  const totalDebit = lines.reduce(
    (sum, l) => sum + (parseFloat(l.debit) || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (sum, l) => sum + (parseFloat(l.credit) || 0),
    0,
  );
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const entry = {
      date,
      description,
      descriptionAr,
      reference,
      referenceType,
      lines: lines
        .filter((l) => l.accountId)
        .map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
        })),
    };

    onSuccess?.(entry);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        New Journal Entry / قيد محاسبي جديد
      </h3>

      {/* Header fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date / التاريخ *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference / المرجع
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., INV-001"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference Type / نوع المرجع
          </label>
          <select
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="order">Order / طلب</option>
            <option value="payment">Payment / دفع</option>
            <option value="expense">Expense / مصروف</option>
            <option value="payroll">Payroll / رواتب</option>
            <option value="adjustment">Adjustment / تسوية</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description / الوصف بالإنجليزية *
        </label>
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description Ar / الوصف بالعربية
        </label>
        <input
          type="text"
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          placeholder="أدخل الوصف بالعربية..."
          dir="rtl"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Journal Lines */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-semibold text-gray-700">
            Journal Lines / بنود القيد
          </h4>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            + Add Line / إضافة بند
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">
                  #
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Account / الحساب *
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Debit / مدين
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Credit / دائن
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Note / ملاحظة
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12">
                  Del
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={line.accountId}
                      onChange={(e) =>
                        updateLine(line.id, 'accountId', e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    >
                      <option value="">Select account...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.id} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(line.id, 'debit', e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm text-right font-mono"
                      placeholder="0.000"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(line.id, 'credit', e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm text-right font-mono"
                      placeholder="0.000"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, 'description', e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      placeholder="Note..."
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={2} className="px-4 py-2 text-sm text-gray-700">
                  Totals / الإجمالي
                </td>
                <td
                  className={`px-4 py-2 text-sm text-right font-mono ${
                    isBalanced ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(totalDebit)}
                </td>
                <td
                  className={`px-4 py-2 text-sm text-right font-mono ${
                    isBalanced ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(totalCredit)}
                </td>
                <td colSpan={2} className="px-4 py-2">
                  {!isBalanced && (
                    <span className="text-xs text-red-600">
                      {totalDebit > totalCredit
                        ? `Debit exceeds by ${formatCurrency(totalDebit - totalCredit)}`
                        : `Credit exceeds by ${formatCurrency(totalCredit - totalDebit)}`}
                    </span>
                  )}
                  {isBalanced && totalDebit > 0 && (
                    <span className="text-xs text-green-600">
                      Balanced / متوازن
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel / إلغاء
        </button>
        <button
          type="submit"
          disabled={!isBalanced}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Post Entry / ترحيل القيد
        </button>
      </div>
    </form>
  );
}
