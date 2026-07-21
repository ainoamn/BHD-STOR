'use client';

import React from 'react';

interface EmployeeCardProps {
  employee: {
    id: string;
    employeeNumber: string;
    department: string;
    position: string;
    employmentType: string;
    joinDate: string;
    salary: number;
    status: string;
    annualLeaveBalance: number;
    statusColor: string;
  };
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: 'OMR',
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-red-500',
  ];

  const avatarColor =
    avatarColors[
      employee.employeeNumber.charCodeAt(4) % avatarColors.length
    ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}
          >
            {getInitials(employee.position)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {employee.position}
            </h3>
            <p className="text-xs text-gray-500">{employee.employeeNumber}</p>
          </div>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.statusColor}`}
        >
          {employee.status.replace('_', ' ')}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Department / القسم</span>
          <span className="text-gray-900">{employee.department}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Type / النوع</span>
          <span className="text-gray-900 capitalize">
            {employee.employmentType.replace('_', ' ')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Join Date / الانضمام</span>
          <span className="text-gray-900">{employee.joinDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Salary / الراتب</span>
          <span className="text-gray-900 font-mono font-medium">
            {formatCurrency(employee.salary)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Leave Balance / رصيد الإجازة</span>
          <span className="text-green-600 font-medium">
            {employee.annualLeaveBalance} days
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button className="flex-1 px-3 py-1.5 text-xs text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
          View / عرض
        </button>
        <button className="flex-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          Edit / تعديل
        </button>
      </div>
    </div>
  );
}
