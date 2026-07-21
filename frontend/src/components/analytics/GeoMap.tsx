'use client';

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, DollarSign, ShoppingCart, Users, TrendingUp, BarChart3 } from 'lucide-react';

interface GeoSalesData {
  country: string;
  region: string;
  city: string;
  totalSales: number;
  totalRevenue: number;
  avgOrderValue: number;
  customerCount: number;
  lat: number;
  lng: number;
}

export function GeoMap() {
  const [data, setData] = useState<GeoSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchGeoData();
  }, []);

  const fetchGeoData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/geo');
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching geo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Aggregate by country
  const countryData = data.reduce<Record<string, GeoSalesData[]>>((acc, item) => {
    if (!acc[item.country]) acc[item.country] = [];
    acc[item.country].push(item);
    return acc;
  }, {});

  const countrySummary = Object.entries(countryData)
    .map(([country, cities]) => ({
      country,
      totalSales: cities.reduce((s, c) => s + c.totalSales, 0),
      totalRevenue: cities.reduce((s, c) => s + c.totalRevenue, 0),
      avgOrderValue: cities.reduce((s, c) => s + c.avgOrderValue, 0) / cities.length,
      customerCount: cities.reduce((s, c) => s + c.customerCount, 0),
      cityCount: cities.length,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);
  const maxRevenue = Math.max(...countrySummary.map((c) => c.totalRevenue), 1);

  // World map positions (simplified dot positions on a grid)
  const getDotPosition = (lat: number, lng: number) => {
    // Convert lat/lng to percentage positions on a simplified world map
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Geographic Sales Distribution</h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Countries</p>
          <p className="text-xl font-bold text-gray-900">{countrySummary.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Cities</p>
          <p className="text-xl font-bold text-gray-900">{data.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-xl font-bold text-gray-900">
            {data.reduce((s, d) => s + d.customerCount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="relative w-full aspect-[2/1] bg-blue-50/50 rounded-lg overflow-hidden">
            {/* Simplified world map dots */}
            {data.map((location) => {
              const pos = getDotPosition(location.lat, location.lng);
              const size = Math.max(6, Math.min(24, (location.totalRevenue / maxRevenue) * 24));
              const isSelected = selectedCountry === location.country;

              return (
                <button
                  key={`${location.city}-${location.lat}`}
                  className={`absolute rounded-full transition-all hover:scale-150 ${
                    isSelected ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-blue-400 hover:bg-blue-600'
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: size,
                    height: size,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setSelectedCountry(isSelected ? null : location.country)}
                  title={`${location.city}, ${location.country}: ${formatCurrency(location.totalRevenue)}`}
                />
              );
            })}

            {/* Legend overlay */}
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-lg p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-1">Revenue</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-gray-500">Small</span>
                <div className="w-4 h-4 rounded-full bg-blue-400" />
                <span className="text-[10px] text-gray-500">Medium</span>
                <div className="w-6 h-6 rounded-full bg-blue-400" />
                <span className="text-[10px] text-gray-500">Large</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Country Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {countrySummary.map((country) => (
          <div
            key={country.country}
            className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
              selectedCountry === country.country
                ? 'border-blue-400 shadow-md ring-1 ring-blue-200'
                : 'border-gray-200 hover:shadow-sm'
            }`}
            onClick={() =>
              setSelectedCountry(
                selectedCountry === country.country ? null : country.country
              )
            }
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <h4 className="font-semibold text-gray-900">{country.country}</h4>
              </div>
              <span className="text-xs text-gray-500">{country.cityCount} cities</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(country.totalRevenue)}
                </p>
                {/* Mini bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${Math.max(5, (country.totalRevenue / maxRevenue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sales</p>
                <p className="text-sm font-semibold text-gray-900">
                  {country.totalSales.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customers</p>
                <p className="text-sm font-semibold text-gray-900">
                  {country.customerCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Order</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(country.avgOrderValue)}
                </p>
              </div>
            </div>

            {/* City breakdown */}
            {selectedCountry === country.country && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500">Cities:</p>
                {(countryData[country.country] || [])
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map((city) => (
                    <div
                      key={city.city}
                      className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded"
                    >
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {city.city}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                          {city.totalSales} sales
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(city.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
