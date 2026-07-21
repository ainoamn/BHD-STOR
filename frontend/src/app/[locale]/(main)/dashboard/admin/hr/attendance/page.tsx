'use client';

import React, { useState } from 'react';
import { AttendanceTracker } from '@/components/hr';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeNumber: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'remote';
  workingHours: number | null;
  overtimeHours: number;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');

  const attendanceRecords: AttendanceRecord[] = [
    { id: '1', employeeName: 'Ahmed Al-Rashdi', employeeNumber: 'BHD-001', date: '2024-01-15', checkIn: '08:45:00', checkOut: '17:30:00', status: 'present', workingHours: 8.75, overtimeHours: 0.75 },
    { id: '2', employeeName: 'Fatima Al-Balushi', employeeNumber: 'BHD-002', date: '2024-01-15', checkIn: '09:15:00', checkOut: '17:45:00', status: 'late', workingHours: 8.5, overtimeHours: 0.5 },
    { id: '3', employeeName: 'Mohammed Al-Habsi', employeeNumber: 'BHD-003', date: '2024-01-15', checkIn: '08:30:00', checkOut: '18:00:00', status: 'present', workingHours: 8, overtimeHours: 1.0 },
    { id: '4', employeeName: 'Sara Al-Riyami', employeeNumber: 'BHD-004', date: '2024-01-15', checkIn: null, checkOut: null, status: 'absent', workingHours: null, overtimeHours: 0 },
    { id: '5', employeeName: 'Khalid Al-Saadi', employeeNumber: 'BHD-005', date: '2024-01-15', checkIn: '08:50:00', checkOut: null, status: 'present', workingHours: null, overtimeHours: 0 },
    { id: '6', employeeName: 'Noura Al-Harthi', employeeNumber: 'BHD-006', date: '2024-01-15', checkIn: '08:00:00', checkOut: '16:00:00', status: 'on_leave', workingHours: 8, overtimeHours: 0 },
    { id: '7', employeeName: 'Omar Al-Busaidi', employeeNumber: 'BHD-007', date: '2024-01-15', checkIn: '09:00:00', checkOut: '17:00:00', status: 'remote', workingHours: 8, overtimeHours: 0 },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      on_leave: 'bg-blue-100 text-blue-800',
      remote: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      present: 'Present / حاضر',
      absent: 'Absent / غائب',
      late: 'Late / متأخر',
      on_leave: 'On Leave / في إجازة',
      remote: 'Remote / عن بُعد',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const summary = {
    present: attendanceRecords.filter((r) => r.status === 'present').length,
    absent: attendanceRecords.filter((r) => r.status === 'absent').length,
    late: attendanceRecords.filter((r) => r.status === 'late').length,
    onLeave: attendanceRecords.filter((r) => r.status === 'on_leave').length,
    remote: attendanceRecords.filter((r) => r.status === 'remote').length,
    totalOvertime: attendanceRecords.reduce((s, r) => s + r.overtimeHours, 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          تتبع الحضور / Attendance Tracking
        </h1>
        <p className="text-gray-500 mt-2">
          مراقبة حضور وانصراف الموظفين / Monitor employee attendance
        </p>
      </div>

      {/* Clock In/Out Widget */}
      <div className="mb-8">
        <AttendanceTracker />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Present / حاضر', value: summary.present, color: 'bg-green-50 text-green-800' },
          { label: 'Absent / غائب', value: summary.absent, color: 'bg-red-50 text-red-800' },
          { label: 'Late / متأخر', value: summary.late, color: 'bg-yellow-50 text-yellow-800' },
          { label: 'On Leave / إجازة', value: summary.onLeave, color: 'bg-blue-50 text-blue-800' },
          { label: 'Remote / عن بُعد', value: summary.remote, color: 'bg-purple-50 text-purple-800' },
          { label: 'Overtime / إضافي', value: `${summary.totalOvertime}h`, color: 'bg-orange-50 text-orange-800' },
        ].map((item) => (
          <div key={item.label} className={`rounded-lg p-4 ${item.color}`}>
            <p className="text-xs text-gray-600">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date / التاريخ
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department / القسم
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All / الكل</option>
              <option value="operations">Operations</option>
              <option value="logistics">Logistics</option>
              <option value="it">IT</option>
              <option value="finance">Finance</option>
              <option value="marketing">Marketing</option>
              <option value="hr">HR</option>
              <option value="customer_service">Customer Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee / الموظف</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In / دخول</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out / خروج</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours / ساعات</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overtime / إضافي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendanceRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {record.employeeName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.employeeNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {record.checkIn ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {record.checkIn}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {record.checkOut ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {record.checkOut}
                    </span>
                  ) : (
                    <span className="text-gray-400">Pending / قيد الانتظار</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(record.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                  {record.workingHours !== null ? `${record.workingHours}h` : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                  {record.overtimeHours > 0 ? (
                    <span className="text-orange-600 font-medium">
                      +{record.overtimeHours}h
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
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
