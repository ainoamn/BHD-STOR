'use client';

import React, { useState } from 'react';

interface LeaveEvent {
  id: string;
  employeeName: string;
  type: string;
  startDate: number;
  endDate: number;
  status: string;
}

interface LeaveCalendarProps {
  events?: LeaveEvent[];
}

export function LeaveCalendar({ events }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1));

  const defaultEvents: LeaveEvent[] = [
    { id: '1', employeeName: 'Mohammed', type: 'annual', startDate: 15, endDate: 20, status: 'pending' },
    { id: '2', employeeName: 'Fatima', type: 'sick', startDate: 18, endDate: 19, status: 'approved' },
    { id: '3', employeeName: 'Sara', type: 'annual', startDate: 22, endDate: 25, status: 'pending' },
    { id: '4', employeeName: 'Khalid', type: 'emergency', startDate: 10, endDate: 11, status: 'approved' },
    { id: '5', employeeName: 'Ahmed', type: 'annual', startDate: 5, endDate: 8, status: 'approved' },
  ];

  const calendarEvents = events ?? defaultEvents;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNamesAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    return calendarEvents.filter(
      (e) => day >= e.startDate && day <= e.endDate,
    );
  };

  const getEventColor = (type: string, status: string) => {
    if (status === 'pending') return 'bg-yellow-200 text-yellow-800 border-yellow-300';
    const colors: Record<string, string> = {
      annual: 'bg-green-200 text-green-800 border-green-300',
      sick: 'bg-red-200 text-red-800 border-red-300',
      emergency: 'bg-orange-200 text-orange-800 border-orange-300',
      unpaid: 'bg-gray-200 text-gray-800 border-gray-300',
      maternity: 'bg-pink-200 text-pink-800 border-pink-300',
      paternity: 'bg-blue-200 text-blue-800 border-blue-300',
      hajj: 'bg-purple-200 text-purple-800 border-purple-300',
    };
    return colors[type] || 'bg-gray-200 text-gray-800';
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: 'سنوية',
      sick: 'مرضية',
      emergency: 'طارئة',
      unpaid: 'بدون راتب',
      maternity: 'أمومة',
      paternity: 'أبوة',
      hajj: 'حج',
    };
    return labels[type] || type;
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Today (mock: Jan 15, 2024)
  const today = 15;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">
            {monthNamesAr[month]} / {monthNamesEn[month]}
          </h3>
          <p className="text-sm text-gray-500">{year}</p>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3">
        {[
          { type: 'annual', label: 'Annual / سنوية' },
          { type: 'sick', label: 'Sick / مرضية' },
          { type: 'emergency', label: 'Emergency / طارئة' },
          { type: 'pending', label: 'Pending / معلقة' },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${getEventColor(item.type, item.type === 'pending' ? 'pending' : 'approved').split(' ')[0]}`} />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNamesEn.map((day, i) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase"
          >
            <span className="block">{dayNamesAr[i]}</span>
            <span className="block">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, index) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const isToday = day === today;

          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                isToday ? 'bg-blue-50' : day ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-primary text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1.5 py-0.5 rounded border truncate ${getEventColor(
                          event.type,
                          event.status,
                        )}`}
                        title={`${event.employeeName} - ${getEventTypeLabel(event.type)}`}
                      >
                        {event.employeeName}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400 px-1.5">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
