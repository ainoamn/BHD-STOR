'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface HrStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  departments: number;
  attendanceToday: number;
  pendingLeaves: number;
  payrollThisMonth: number;
  avgTenure: number;
}

export default function HrDashboardPage() {
  const locale = useLocale();
  const [stats, setStats] = useState<HrStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    departments: 0,
    attendanceToday: 0,
    pendingLeaves: 0,
    payrollThisMonth: 0,
    avgTenure: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalEmployees: 48,
        activeEmployees: 42,
        onLeave: 4,
        departments: 8,
        attendanceToday: 38,
        pendingLeaves: 6,
        payrollThisMonth: 52000,
        avgTenure: 3.5,
      });
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: 'إجمالي الموظفين / Total Employees',
      value: stats.totalEmployees,
      sub: `${stats.activeEmployees} Active نشط`,
      href: '/dashboard/admin/hr/employees',
      color: 'bg-blue-500',
      icon: '👥',
    },
    {
      title: 'الحضور اليوم / Today\'s Attendance',
      value: stats.attendanceToday,
      sub: `${((stats.attendanceToday / stats.activeEmployees) * 100).toFixed(0)}% نسبة الحضور`,
      href: '/dashboard/admin/hr/attendance',
      color: 'bg-green-500',
      icon: '📍',
    },
    {
      title: 'إجازات معلقة / Pending Leaves',
      value: stats.pendingLeaves,
      sub: 'تحتاج موافقة / Need approval',
      href: '/dashboard/admin/hr/leaves',
      color: 'bg-yellow-500',
      icon: '📅',
    },
    {
      title: 'كشوف الرواتب / Payroll',
      value: formatCurrency(stats.payrollThisMonth),
      sub: 'هذا الشهر / This month',
      href: '/dashboard/admin/hr/payroll',
      color: 'bg-purple-500',
      icon: '💰',
    },
    {
      title: 'الأقسام / Departments',
      value: stats.departments,
      sub: 'قسم نشط / Active dept.',
      href: '/dashboard/admin/hr/employees',
      color: 'bg-indigo-500',
      icon: '🏢',
    },
    {
      title: 'في إجازة / On Leave',
      value: stats.onLeave,
      sub: 'موظف حالياً / Currently',
      href: '/dashboard/admin/hr/leaves',
      color: 'bg-pink-500',
      icon: '🌴',
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
          لوحة تحكم الموارد البشرية / HR Dashboard
        </h1>
        <p className="text-gray-500 mt-2">
          نظرة عامة على إدارة الموارد البشرية / Overview of HR management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={`/${locale}${card.href}`}
            className="block group"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div
                className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4 text-2xl`}
              >
                {card.icon}
              </div>
              <h3 className="text-sm font-medium text-gray-500">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-primary transition-colors">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Department Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          توزيع الأقسام / Department Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Operations / التشغيل', count: 12, color: 'bg-blue-500' },
            { name: 'Logistics / الخدمات اللوجستية', count: 8, color: 'bg-green-500' },
            { name: 'IT / تكنولوجيا المعلومات', count: 6, color: 'bg-purple-500' },
            { name: 'Finance / المالية', count: 5, color: 'bg-yellow-500' },
            { name: 'Marketing / التسويق', count: 4, color: 'bg-pink-500' },
            { name: 'HR / الموارد البشرية', count: 3, color: 'bg-indigo-500' },
            { name: 'Customer Service / خدمة العملاء', count: 7, color: 'bg-teal-500' },
            { name: 'Management / الإدارة', count: 3, color: 'bg-red-500' },
          ].map((dept) => (
            <div
              key={dept.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
            >
              <div
                className={`w-3 h-3 rounded-full ${dept.color}`}
              />
              <div>
                <p className="text-sm text-gray-700">{dept.name}</p>
                <p className="text-xs text-gray-500">
                  {dept.count} employees
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          إجراءات سريعة / Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/${locale}/dashboard/admin/hr/employees`}
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Add Employee / موظف جديد
          </Link>
          <Link
            href={`/${locale}/dashboard/admin/hr/payroll`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Process Payroll / معالجة الرواتب
          </Link>
        </div>
      </div>
    </div>
  );
}
