'use client';

import React, { useState, useEffect } from 'react';

interface AttendanceTrackerProps {
  employeeId?: string;
  onClockIn?: (location?: { lat: number; lng: number }) => void;
  onClockOut?: (location?: { lat: number; lng: number }) => void;
}

export function AttendanceTracker({
  employeeId,
  onClockIn,
  onClockOut,
}: AttendanceTrackerProps) {
  const [status, setStatus] = useState<'out' | 'in'>('out');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState('00:00:00');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (checkInTime && status === 'in') {
        const diff = new Date().getTime() - checkInTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsed(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [checkInTime, status]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(pos),
        () => setLocation(null),
      );
    }
  };

  const handleClockIn = () => {
    getLocation();
    const now = new Date();
    setCheckInTime(now);
    setStatus('in');
    onClockIn?.(
      location
        ? { lat: location.coords.latitude, lng: location.coords.longitude }
        : undefined,
    );
  };

  const handleClockOut = () => {
    getLocation();
    setStatus('out');
    onClockOut?.(
      location
        ? { lat: location.coords.latitude, lng: location.coords.longitude }
        : undefined,
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-OM', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-OM', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if late (after 9:00 AM)
  const isLate = () => {
    const now = new Date();
    const nineAM = new Date(now);
    nineAM.setHours(9, 0, 0, 0);
    return now > nineAM && status === 'out';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Status Header */}
      <div
        className={`px-6 py-4 ${
          status === 'in'
            ? 'bg-green-50 border-b border-green-100'
            : isLate()
              ? 'bg-yellow-50 border-b border-yellow-100'
              : 'bg-gray-50 border-b border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {status === 'in'
                ? 'Currently Working / في العمل'
                : 'Clocked Out / خارج العمل'}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(currentTime)}
            </p>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${
              status === 'in' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
        </div>
      </div>

      <div className="p-6">
        {/* Time Display */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-gray-900 font-mono mb-2">
            {formatTime(currentTime)}
          </div>
          {status === 'in' && (
            <div className="text-lg text-green-600 font-mono">
              Elapsed / المنقضي: {elapsed}
            </div>
          )}
          {isLate() && status === 'out' && (
            <div className="text-sm text-yellow-600 mt-1">
              Late start - after 9:00 AM / بدء متأخر - بعد الساعة 9 صباحاً
            </div>
          )}
        </div>

        {/* Clock In/Out Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          {status === 'out' ? (
            <button
              onClick={handleClockIn}
              className="inline-flex items-center px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-200"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-lg font-semibold">
                Clock In / تسجيل الدخول
              </span>
            </button>
          ) : (
            <button
              onClick={handleClockOut}
              className="inline-flex items-center px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-lg font-semibold">
                Clock Out / تسجيل الخروج
              </span>
            </button>
          )}
        </div>

        {/* Location Info */}
        {location && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                Location / الموقع: {location.coords.latitude.toFixed(6)},{' '}
                {location.coords.longitude.toFixed(6)} (Accuracy:{' '}
                {Math.round(location.coords.accuracy)}m)
              </span>
            </div>
          </div>
        )}

        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Check In / الدخول</p>
            <p className="text-lg font-semibold text-gray-900 font-mono">
              {checkInTime ? formatTime(checkInTime) : '--:--:--'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Status / الحالة</p>
            <p
              className={`text-lg font-semibold ${
                status === 'in' ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {status === 'in' ? 'In / في العمل' : 'Out / خارج'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Hours / ساعات</p>
            <p className="text-lg font-semibold text-gray-900 font-mono">
              {status === 'in' ? elapsed : '00:00:00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
