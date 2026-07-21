'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { calculatePrice, type PricingResult } from '../../services/b2b.service';

interface PriceCalculatorProps {
  onPriceCalculated?: (result: PricingResult) => void;
}

const serviceTypes = [
  { value: 'standard', label: 'Standard', desc: '2-3 days', baseRate: 15000 },
  { value: 'express', label: 'Express', desc: '1 day', baseRate: 30000 },
  { value: 'same_day', label: 'Same Day', desc: 'Same day', baseRate: 50000 },
  { value: 'overnight', label: 'Overnight', desc: 'Next morning', baseRate: 45000 },
];

const packageTypes = [
  { value: 'document', label: 'Document', fee: 0 },
  { value: 'parcel', label: 'Parcel', fee: 5000 },
  { value: 'fragile', label: 'Fragile', fee: 15000 },
  { value: 'heavy', label: 'Heavy (>20kg)', fee: 20000 },
  { value: 'pallet', label: 'Pallet', fee: 50000 },
];

export default function PriceCalculator({ onPriceCalculated }: PriceCalculatorProps) {
  const [serviceType, setServiceType] = useState<string>('standard');
  const [packageType, setPackageType] = useState<string>('parcel');
  const [weight, setWeight] = useState<number>(1);
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [declaredValue, setDeclaredValue] = useState<number>(0);
  const [result, setResult] = useState<PricingResult | null>(null);

  const handleCalculate = useCallback(() => {
    const pricingInput = {
      serviceType: serviceType as 'standard' | 'express' | 'same_day' | 'overnight',
      weight,
      dimensions: length > 0 && width > 0 && height > 0
        ? { length, width, height }
        : undefined,
      codAmount: codAmount > 0 ? codAmount : undefined,
      declaredValue: declaredValue > 0 ? declaredValue : undefined,
      packageType,
    };
    const price = calculatePrice(pricingInput);
    setResult(price);
    onPriceCalculated?.(price);
  }, [serviceType, packageType, weight, length, width, height, codAmount, declaredValue, onPriceCalculated]);

  // Auto-calculate on change
  useEffect(() => {
    handleCalculate();
  }, [handleCalculate]);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Shipping Price Calculator
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Get an instant estimate for your shipment
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {serviceTypes.map((svc) => (
              <button
                key={svc.value}
                onClick={() => setServiceType(svc.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  serviceType === svc.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-semibold text-sm ${
                  serviceType === svc.value ? 'text-blue-700' : 'text-gray-800'
                }`}>
                  {svc.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{svc.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Package Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Type
          </label>
          <select
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            {packageTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label} {pt.fee > 0 ? `(+${pt.fee.toLocaleString()} VND)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) *
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="50"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions (cm) - Optional
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-xs text-gray-500 mb-1 block">Length</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={length || ''}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 mb-1 block">Width</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={width || ''}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 mb-1 block">Height</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={height || ''}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* COD Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            COD Amount (VND) - Optional
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={codAmount || ''}
            onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Declared Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Declared Value (VND) - Optional
          </label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={declaredValue || ''}
            onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculate Price
        </button>
      </div>

      {/* Price Breakdown */}
      {result && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Price Breakdown
          </h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Rate</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(result.baseRate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                Weight Fee ({weight} kg)
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(result.weightFee)}
              </span>
            </div>
            {result.codFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">COD Fee</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(result.codFee)}
                </span>
              </div>
            )}
            {result.insuranceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Insurance Fee</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(result.insuranceFee)}
                </span>
              </div>
            )}
            {result.packageTypeFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Package Type Fee</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(result.packageTypeFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(result.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VAT (8%)</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(result.vat)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-blue-700">
                {formatCurrency(result.total)}
              </span>
            </div>
            <div className="pt-1 text-xs text-gray-500 text-right">
              Estimated delivery: {result.estimatedDeliveryDays === 0
                ? 'Same day'
                : result.estimatedDeliveryDays === 1
                ? '1 day'
                : `${result.estimatedDeliveryDays} days`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
