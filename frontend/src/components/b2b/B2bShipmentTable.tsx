'use client';

import React from 'react';
import type { Shipment } from '../../services/b2b.service';

interface B2bShipmentTableProps {
  shipments: Shipment[];
  onViewDetail?: (shipment: Shipment) => void;
  onTrack?: (trackingNumber: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending_pickup: {
    label: 'Pending Pickup',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  picked_up: { label: 'Picked Up', color: 'text-blue-700', bg: 'bg-blue-50' },
  in_transit: {
    label: 'In Transit',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
  },
  at_sorting: {
    label: 'At Sorting',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  failed_delivery: {
    label: 'Failed',
    color: 'text-red-700',
    bg: 'bg-red-50',
  },
  returned: {
    label: 'Returned',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500',
    bg: 'bg-gray-100',
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function B2bShipmentTable({
  shipments,
  onViewDetail,
  onTrack,
}: B2bShipmentTableProps) {
  if (shipments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-gray-300 mb-3">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          No shipments found
        </h3>
        <p className="text-gray-500 text-sm">
          Create your first shipment to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Reference
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Tracking #
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Receiver
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Date
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Cost
              </th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shipments.map((shipment) => {
              const status = statusConfig[shipment.status] || {
                label: shipment.status,
                color: 'text-gray-600',
                bg: 'bg-gray-50',
              };
              return (
                <tr
                  key={shipment.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {shipment.referenceNumber || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-600 font-medium">
                      {shipment.trackingNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {shipment.receiverName}
                      </p>
                      <p className="text-gray-500 text-xs truncate max-w-[200px]">
                        {shipment.receiverAddress}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(shipment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(shipment.shippingFee)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewDetail?.(shipment)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onTrack?.(shipment.trackingNumber)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Track"
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
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
