'use client';

import React from 'react';
import { ChartOfAccounts } from '@/components/accounting';

export default function AccountsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          دفتر الأستاذ / Chart of Accounts
        </h1>
        <p className="text-gray-500 mt-2">
          إدارة شجرة الحسابات المالية / Manage the financial account hierarchy
        </p>
      </div>
      <ChartOfAccounts />
    </div>
  );
}
