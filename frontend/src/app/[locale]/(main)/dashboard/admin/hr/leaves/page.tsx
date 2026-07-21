'use client';

import React, { useState } from 'react';
import { LeaveCalendar } from '@/components/hr';

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeNumber: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  approvedBy: string | null;
}

export default function LeavesPage() {
  const [filter, setFilter] = useState('');

  const leaveRequests: LeaveRequest[] = [
    { id: '1', employeeName: 'Mohammed Al-Habsi', employeeNumber: 'BHD-003', type: 'annual', startDate: '2024-01-20', endDate: '2024-01-25', days: 6, status: 'pending', reason: 'Family vacation', approvedBy: null },
    { id: '2', employeeName: 'Fatima Al-Balushi', employeeNumber: 'BHD-002', type: 'sick', startDate: '2024-01-18', endDate: '2024-01-19', days: 2, status: 'approved', reason: 'Medical appointment', approvedBy: 'Ahmed Al-Rashdi' },
    { id: '3', employeeName: 'Sara Al-Riyami', employeeNumber: 'BHD-004', type: 'annual', startDate: '2024-02-01', endDate: '2024-02-10', days: 10, status: 'pending', reason: 'Personal travel', approvedBy: null },
    { id: '4', employeeName: 'Khalid Al-Saadi', employeeNumber: 'BHD-005', type: 'emergency', startDate: '2024-01-15', endDate: '2024-01-16', days: 2, status: 'approved', reason: 'Family emergency', approvedBy: 'Ahmed Al-Rashdi' },
    { id: '5', employeeName: 'Noura Al-Harthi', employeeNumber: 'BHD-006', type: 'unpaid', startDate: '2024-02-15', endDate: '2024-02-20', days: 6, status: 'rejected', reason: 'Extended leave', approvedBy: null },
    { id: '6', employeeName: 'Omar Al-Busaidi', employeeNumber: 'BHD-007', type: 'annual', startDate: '2024-03-01', endDate: '2024-03-05', days: 5, status: 'pending', reason: 'Rest and recovery', approvedBy: null },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: 'Annual / سنوية',
      sick: 'Sick / مرضية',
      emergency: 'Emergency / طارئة',
      unpaid: 'Unpaid / بدون راتب',
      maternity: 'Maternity / أمومة',
      paternity: 'Paternity / أبوة',
      hajj: 'Hajj / حج',
    };
    return labels[type] || type;
  };

  const filteredLeaves = leaveRequests.filter((l) =>
    !filter || l.status === filter
  );

  const summary = {
    pending: leaveRequests.filter((l) => l.status === 'pending').length,
    approved: leaveRequests.filter((l) => l.status === 'approved').length,
    rejected: leaveRequests.filter((l) => l.status === 'rejected').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          إدارة الإجازات / Leave Management
        </h1>
        <p className="text-gray-500 mt-2">
          طلبات الإجازة والموافقة / Leave requests and approvals
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
          <p className="text-sm text-yellow-700">معلقة / Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{summary.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <p className="text-sm text-green-700">معتمدة / Approved</p>
          <p className="text-2xl font-bold text-green-800">{summary.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <p className="text-sm text-red-700">مرفوضة / Rejected</p>
          <p className="text-2xl font-bold text-red-800">{summary.rejected}</p>
        </div>
      </div>

      {/* Leave Calendar */}
      <div className="mb-8">
        <LeaveCalendar />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">All / الكل</option>
            <option value="pending">Pending / معلقة</option>
            <option value="approved">Approved / معتمدة</option>
            <option value="rejected">Rejected / مرفوضة</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            طلبات الإجازة / Leave Requests
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee / الموظف</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / النوع</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period / الفترة</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days / أيام</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason / السبب</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / الحالة</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions / إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLeaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {leave.employeeName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {leave.employeeNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {getLeaveTypeLabel(leave.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div>{leave.startDate}</div>
                  <div className="text-gray-400">to {leave.endDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-bold">
                  {leave.days}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {leave.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(leave.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {leave.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                  {leave.status !== 'pending' && (
                    <span className="text-gray-400 text-xs">
                      {leave.approvedBy ? `By ${leave.approvedBy}` : 'Processed'}
                    </span>
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
