'use client';

import React from 'react';

interface TimelineEvent {
  status: string;
  label: string;
  time: string;
  location: string;
}

interface TrackingResultProps {
  trackingNumber: string;
  referenceNumber: string | null;
  status: string;
  statusLabel: string;
  receiver: { name: string; address: string };
  timeline: TimelineEvent[];
  estimatedDelivery: string | null;
}

const statusIcons: Record<string, string> = {
  created: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  picked_up: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8',
  in_transit: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  at_sorting: 'M4 6h16M4 12h16M4 18h16',
  out_for_delivery: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
  delivered: 'M5 13l4 4L19 7',
};

const statusColors: Record<string, { bg: string; border: string; dot: string }> = {
  created: { bg: 'bg-gray-50', border: 'border-gray-300', dot: 'bg-gray-400' },
  picked_up: { bg: 'bg-blue-50', border: 'border-blue-300', dot: 'bg-blue-500' },
  in_transit: { bg: 'bg-sky-50', border: 'border-sky-300', dot: 'bg-sky-500' },
  at_sorting: { bg: 'bg-violet-50', border: 'border-violet-300', dot: 'bg-violet-500' },
  out_for_delivery: { bg: 'bg-orange-50', border: 'border-orange-300', dot: 'bg-orange-500' },
  delivered: { bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500' },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrackingResult({
  trackingNumber,
  referenceNumber,
  status,
  statusLabel,
  receiver,
  timeline,
  estimatedDelivery,
}: TrackingResultProps) {
  const currentStatusIndex = timeline.findIndex((t) => t.status === status);
  const colors = statusColors[status] || statusColors.created;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
            <p className="text-2xl font-bold text-gray-900 font-mono tracking-wide">
              {trackingNumber}
            </p>
            {referenceNumber && (
              <p className="text-sm text-gray-500 mt-1">
                Ref: {referenceNumber}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Current Status</p>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${colors.bg} ${colors.border} border`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Receiver Info & Delivery Estimate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Receiver
          </p>
          <p className="font-semibold text-gray-900 text-lg">{receiver.name}</p>
          <p className="text-gray-600 text-sm mt-1">{receiver.address}</p>
        </div>
        {estimatedDelivery && status !== 'delivered' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Estimated Delivery
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {new Date(estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(estimatedDelivery).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
        {status === 'delivered' && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">
              Delivered
            </p>
            <p className="font-semibold text-emerald-900 text-lg">
              Package has been delivered
            </p>
            <p className="text-sm text-emerald-600 mt-1">
              {timeline.length > 0 && formatTime(timeline[timeline.length - 1].time)}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Shipment Timeline
        </h3>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-0">
            {timeline.map((event, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = event.status === status;
              const eventColors = statusColors[event.status] || statusColors.created;

              return (
                <div
                  key={event.status}
                  className={`relative flex gap-4 pb-8 ${
                    index === timeline.length - 1 ? 'pb-0' : ''
                  }`}
                >
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? `${eventColors.bg} ${eventColors.border}`
                          : isCompleted
                          ? 'bg-emerald-50 border-emerald-400'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${
                          isCurrent
                            ? 'text-gray-700'
                            : isCompleted
                            ? 'text-emerald-600'
                            : 'text-gray-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            statusIcons[event.status] ||
                            'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                          }
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p
                        className={`font-semibold ${
                          isCurrent
                            ? 'text-gray-900'
                            : isCompleted
                            ? 'text-gray-800'
                            : 'text-gray-500'
                        }`}
                      >
                        {event.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(event.time)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {event.location}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulated Map Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Live Location</h3>
        </div>
        <div className="relative h-64 bg-gray-100 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 256">
            {/* Map grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="256" fill="#f9fafb" />
            <rect width="800" height="256" fill="url(#grid)" />
            
            {/* Roads */}
            <line x1="0" y1="128" x2="800" y2="128" stroke="#d1d5db" strokeWidth="3" />
            <line x1="200" y1="0" x2="200" y2="256" stroke="#d1d5db" strokeWidth="2" />
            <line x1="500" y1="0" x2="500" y2="256" stroke="#d1d5db" strokeWidth="2" />
            <line x1="0" y1="64" x2="800" y2="64" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="192" x2="800" y2="192" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Route path */}
            <path
              d="M 80 128 Q 200 80, 350 100 T 600 128 T 720 128"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="8 4"
            />
            
            {/* Origin marker */}
            <circle cx="80" cy="128" r="8" fill="#10b981" />
            <circle cx="80" cy="128" r="4" fill="white" />
            
            {/* Destination marker */}
            <circle cx="720" cy="128" r="8" fill="#ef4444" />
            <circle cx="720" cy="128" r="4" fill="white" />
            
            {/* Current position */}
            <circle cx="500" cy="100" r="12" fill="#3b82f6" opacity="0.3">
              <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="100" r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
            
            {/* Labels */}
            <text x="80" y="155" textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="sans-serif">Origin</text>
            <text x="720" y="155" textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="sans-serif">Destination</text>
            <text x="500" y="80" textAnchor="middle" fontSize="11" fill="#3b82f6" fontFamily="sans-serif" fontWeight="bold">Current</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
