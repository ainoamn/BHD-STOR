'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTrackShipment } from '../../../../../hooks/useB2b';
import TrackingResult from '../../../../../components/b2b/TrackingResult';

export default function B2bTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTracking = searchParams.get('n') || '';

  const [trackingNumber, setTrackingNumber] = useState(prefillTracking);
  const { track, result, loading, error } = useTrackShipment();

  // Auto-track if URL has tracking number
  useEffect(() => {
    if (prefillTracking) {
      track(prefillTracking);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track(trackingNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/en/shipping-portal/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </button>
            <span className="text-gray-300 mx-3">|</span>
            <h1 className="font-semibold text-gray-800">Track Shipment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Enter Tracking Number
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., BHDABC123XYZ"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !trackingNumber.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Track
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Tracking Result */}
        {result && (
          <TrackingResult
            trackingNumber={result.trackingNumber}
            referenceNumber={result.referenceNumber}
            status={result.status}
            statusLabel={result.statusLabel}
            receiver={result.receiver}
            timeline={result.timeline}
            estimatedDelivery={result.estimatedDelivery}
          />
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              Enter a Tracking Number
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Enter your tracking number above to see the real-time status, 
              location history, and estimated delivery of your shipment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
