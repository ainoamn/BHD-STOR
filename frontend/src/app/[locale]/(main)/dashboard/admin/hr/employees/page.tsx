'use client';

import React, { useState } from 'react';
import { EmployeeCard } from '@/components/hr';

interface Employee {
  id: string;
  employeeNumber: string;
  department: string;
  position: string;
  employmentType: string;
  joinDate: string;
  salary: number;
  status: string;
  annualLeaveBalance: number;
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const employees: Employee[] = [
    { id: '1', employeeNumber: 'BHD-001', department: 'management', position: 'CEO', employmentType: 'full_time', joinDate: '2020-01-15', salary: 5000, status: 'active', annualLeaveBalance: 30 },
    { id: '2', employeeNumber: 'BHD-002', department: 'finance', position: 'Finance Manager', employmentType: 'full_time', joinDate: '2021-03-01', salary: 2800, status: 'active', annualLeaveBalance: 25 },
    { id: '3', employeeNumber: 'BHD-003', department: 'it', position: 'Senior Developer', employmentType: 'full_time', joinDate: '2022-06-15', salary: 2500, status: 'active', annualLeaveBalance: 22 },
    { id: '4', employeeNumber: 'BHD-004', department: 'operations', position: 'Operations Supervisor', employmentType: 'full_time', joinDate: '2021-08-10', salary: 2200, status: 'active', annualLeaveBalance: 28 },
    { id: '5', employeeNumber: 'BHD-005', department: 'logistics', position: 'Logistics Coordinator', employmentType: 'full_time', joinDate: '2023-01-20', salary: 1800, status: 'active', annualLeaveBalance: 30 },
    { id: '6', employeeNumber: 'BHD-006', department: 'marketing', position: 'Marketing Specialist', employmentType: 'full_time', joinDate: '2023-04-01', salary: 1600, status: 'on_leave', annualLeaveBalance: 18 },
    { id: '7', employeeNumber: 'BHD-007', department: 'hr', position: 'HR Officer', employmentType: 'full_time', joinDate: '2022-09-15', salary: 1900, status: 'active', annualLeaveBalance: 24 },
    { id: '8', employeeNumber: 'BHD-008', department: 'customer_service', position: 'Support Agent', employmentType: 'full_time', joinDate: '2023-07-01', salary: 1200, status: 'active', annualLeaveBalance: 30 },
  ];

  const departments = [
    { value: 'operations', label: 'Operations / التشغيل' },
    { value: 'logistics', label: 'Logistics / الخدمات اللوجستية' },
    { value: 'it', label: 'IT / تكنولوجيا المعلومات' },
    { value: 'finance', label: 'Finance / المالية' },
    { value: 'marketing', label: 'Marketing / التسويق' },
    { value: 'hr', label: 'HR / الموارد البشرية' },
    { value: 'customer_service', label: 'Customer Service / خدمة العملاء' },
    { value: 'management', label: 'Management / الإدارة' },
  ];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !search ||
      emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || emp.department === deptFilter;
    const matchesStatus = !statusFilter || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            إدارة الموظفين / Employee Management
          </h1>
          <p className="text-gray-500 mt-2">
            عرض وإدارة بيانات الموظفين / View and manage employee data
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee / إضافة موظف
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search / بحث..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">All Departments / جميع الأقسام</option>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">All Status / جميع الحالات</option>
            <option value="active">Active / نشط</option>
            <option value="on_leave">On Leave / في إجازة</option>
            <option value="suspended">Suspended / موقوف</option>
            <option value="terminated">Terminated / متقاعد</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={{
              ...employee,
              department: departments.find((d) => d.value === employee.department)?.label ?? employee.department,
              statusColor: getStatusColor(employee.status),
            }}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No employees found / لم يتم العثور على موظفين
        </div>
      )}

      {/* Table View */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            قائمة الموظفين / Employee List
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / الرقم</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position / المنصب</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department / القسم</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / النوع</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date / تاريخ الانضمام</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salary / الراتب</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                  {emp.employeeNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {emp.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {emp.employmentType.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.joinDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  {new Intl.NumberFormat('en-OM', { style: 'currency', currency: 'OMR' }).format(emp.salary)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(emp.status)}`}>
                    {emp.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
