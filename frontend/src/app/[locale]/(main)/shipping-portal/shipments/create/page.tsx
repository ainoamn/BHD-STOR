'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useB2bAuth, useCreateB2bShipment } from '../../../../../../hooks/useB2b';
import { calculatePrice } from '../../../../../../services/b2b.service';
import type { PricingResult, CreateShipmentData } from '../../../../../../services/b2b.service';

export default function B2bCreateShipmentPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useB2bAuth();
  const { createShipment, loading: creating, error: createError, shipment } = useCreateB2bShipment();

  // Form state
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverProvince, setReceiverProvince] = useState('');
  const [receiverDistrict, setReceiverDistrict] = useState('');
  const [receiverWard, setReceiverWard] = useState('');
  const [packageType, setPackageType] = useState<'document' | 'parcel' | 'fragile' | 'heavy' | 'pallet'>('parcel');
  const [weight, setWeight] = useState(1);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [declaredValue, setDeclaredValue] = useState(0);
  const [serviceType, setServiceType] = useState<'standard' | 'express' | 'same_day' | 'overnight'>('standard');
  const [codAmount, setCodAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [pricePreview, setPricePreview] = useState<PricingResult | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/en/shipping-portal');
    }
  }, [isAuthenticated, authLoading, router]);

  // Update price preview on form changes
  useEffect(() => {
    const price = calculatePrice({
      serviceType,
      weight,
      dimensions: length > 0 && width > 0 && height > 0 ? { length, width, height } : undefined,
      codAmount: codAmount > 0 ? codAmount : undefined,
      declaredValue: declaredValue > 0 ? declaredValue : undefined,
      packageType,
    });
    setPricePreview(price);
  }, [serviceType, weight, length, width, height, codAmount, declaredValue, packageType]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const data: CreateShipmentData = {
        referenceNumber: referenceNumber || undefined,
        sender: {
          name: 'My Company',
          phone: '0900000000',
          address: 'Company Address',
        },
        receiver: {
          name: receiverName,
          phone: receiverPhone,
          address: receiverAddress,
          province: receiverProvince || undefined,
          district: receiverDistrict || undefined,
          ward: receiverWard || undefined,
        },
        package: {
          type: packageType,
          weight,
          dimensions: length > 0 && width > 0 && height > 0
            ? { length, width, height }
            : undefined,
          declaredValue: declaredValue > 0 ? declaredValue : undefined,
        },
        serviceType,
        codAmount: codAmount > 0 ? codAmount : undefined,
        notes: notes || undefined,
      };

      try {
        await createShipment(data);
      } catch {
        // Error handled by hook
      }
    },
    [
      referenceNumber,
      receiverName,
      receiverPhone,
      receiverAddress,
      receiverProvince,
      receiverDistrict,
      receiverWard,
      packageType,
      weight,
      length,
      width,
      height,
      declaredValue,
      serviceType,
      codAmount,
      notes,
      createShipment,
    ],
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Success state
  if (shipment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="font-semibold text-gray-800">Shipment Created</h1>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Shipment Created Successfully
            </h2>
            <p className="text-gray-500 mb-6">
              Your shipment has been created and is ready for pickup.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left inline-block">
              <div className="space-y-3">
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Tracking Number</span>
                  <span className="font-mono font-semibold text-blue-600">{shipment.trackingNumber}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-900">{shipment.referenceNumber || '-'}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Receiver</span>
                  <span className="font-medium text-gray-900">{shipment.receiverName}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-gray-900 capitalize">{shipment.serviceType}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Shipping Fee</span>
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(shipment.shippingFee)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/en/shipping-portal/tracking?n=${shipment.trackingNumber}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7" />
                </svg>
                Track Shipment
              </button>
              <button
                onClick={() => {
                  // Reset form
                  window.location.reload();
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Another
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h1 className="font-semibold text-gray-800">Create Shipment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {createError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {createError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Receiver Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Receiver Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Enter receiver's full name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="e.g., 0901234567"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Your internal reference (optional)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address *
                    </label>
                    <textarea
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      placeholder="Enter full delivery address"
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Province / City
                    </label>
                    <input
                      type="text"
                      value={receiverProvince}
                      onChange={(e) => setReceiverProvince(e.target.value)}
                      placeholder="e.g., Ho Chi Minh"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      District
                    </label>
                    <input
                      type="text"
                      value={receiverDistrict}
                      onChange={(e) => setReceiverDistrict(e.target.value)}
                      placeholder="e.g., District 1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Mini Map Placeholder */}
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 h-40 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7" />
                    </svg>
                    <p className="text-sm">Map integration - address will be geocoded</p>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Package Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Package Type
                    </label>
                    <select
                      value={packageType}
                      onChange={(e) => setPackageType(e.target.value as typeof packageType)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="document">Document</option>
                      <option value="parcel">Parcel</option>
                      <option value="fragile">Fragile</option>
                      <option value="heavy">Heavy (&gt;20kg)</option>
                      <option value="pallet">Pallet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={length || ''}
                      onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={width || ''}
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={height || ''}
                      onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Declared Value (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={declaredValue || ''}
                      onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
                      placeholder="For insurance"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Service & COD */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Service & Payment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Service Type
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as typeof serviceType)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="standard">Standard (2-3 days)</option>
                      <option value="express">Express (1 day)</option>
                      <option value="same_day">Same Day</option>
                      <option value="overnight">Overnight</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      COD Amount (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={codAmount || ''}
                      onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Cash on delivery"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price Preview Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Price Preview
                  </h3>
                  {pricePreview && (
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate</span>
                        <span className="font-medium">{formatCurrency(pricePreview.baseRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight Fee</span>
                        <span className="font-medium">{formatCurrency(pricePreview.weightFee)}</span>
                      </div>
                      {pricePreview.codFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">COD Fee</span>
                          <span className="font-medium">{formatCurrency(pricePreview.codFee)}</span>
                        </div>
                      )}
                      {pricePreview.insuranceFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Insurance</span>
                          <span className="font-medium">{formatCurrency(pricePreview.insuranceFee)}</span>
                        </div>
                      )}
                      {pricePreview.packageTypeFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Package Type</span>
                          <span className="font-medium">{formatCurrency(pricePreview.packageTypeFee)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(pricePreview.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">VAT (8%)</span>
                        <span className="font-medium">{formatCurrency(pricePreview.vat)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-blue-700">{formatCurrency(pricePreview.total)}</span>
                      </div>
                      <p className="text-xs text-gray-500 text-right pt-1">
                        Est. delivery: {pricePreview.estimatedDeliveryDays === 0
                          ? 'Same day'
                          : `${pricePreview.estimatedDeliveryDays} day${pricePreview.estimatedDeliveryDays > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Shipment
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/en/shipping-portal/dashboard')}
                    className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
