/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - No-Fly Zone Management                   │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Geofencing & airspace compliance management                 │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ── Types ── */
type NoFlyZoneType = 'airport' | 'military' | 'hospital' | 'government' | 'school' | 'custom';

interface NoFlyZone {
  id: string;
  name: string;
  type: NoFlyZoneType;
  geometry: Array<{ lat: number; lng: number }>;
  altitudeLimit: number;
  permanent: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  boundingBox: [number, number, number, number];
}

const typeConfig: Record<NoFlyZoneType, { label: string; color: string; icon: string }> = {
  airport: { label: 'Airport', color: 'text-red-400', icon: '✈️' },
  military: { label: 'Military', color: 'text-red-500', icon: '🎖️' },
  hospital: { label: 'Hospital', color: 'text-rose-400', icon: '🏥' },
  government: { label: 'Government', color: 'text-orange-400', icon: '🏛️' },
  school: { label: 'School', color: 'text-amber-400', icon: '🏫' },
  custom: { label: 'Custom', color: 'text-slate-400', icon: '📍' },
};

export default function NoFlyZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<NoFlyZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<NoFlyZone | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: 'custom' as NoFlyZoneType,
    altitudeLimit: 120,
    permanent: true,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    geometry: '[\n  {"lat": 23.58, "lng": 58.40},\n  {"lat": 23.59, "lng": 58.40},\n  {"lat": 23.59, "lng": 58.41},\n  {"lat": 23.58, "lng": 58.41},\n  {"lat": 23.58, "lng": 58.40}\n]',
  });

  const fetchZones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/drones/no-fly-zones?${params}`);
      const data = await res.json();
      setZones(data ?? []);
    } catch (err) {
      console.error('Failed to fetch no-fly zones:', err);
    }
  }, [typeFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchZones();
      setLoading(false);
    };
    load();
  }, [fetchZones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const geometry = JSON.parse(form.geometry);
      const payload = {
        name: form.name,
        type: form.type,
        geometry,
        altitudeLimit: form.altitudeLimit,
        permanent: form.permanent,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
      };

      if (editingZone) {
        await fetch(`/api/drones/no-fly-zones/${editingZone.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/drones/no-fly-zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setEditingZone(null);
      setForm({
        name: '',
        type: 'custom',
        altitudeLimit: 120,
        permanent: true,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '',
        geometry: '[\n  {"lat": 23.58, "lng": 58.40},\n  {"lat": 23.59, "lng": 58.40},\n  {"lat": 23.59, "lng": 58.41},\n  {"lat": 23.58, "lng": 58.41},\n  {"lat": 23.58, "lng": 58.40}\n]',
      });
      fetchZones();
    } catch (err) {
      console.error('Failed to save no-fly zone:', err);
      alert('Invalid geometry JSON. Please check your input.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this no-fly zone?')) return;
    try {
      await fetch(`/api/drones/no-fly-zones/${id}`, { method: 'DELETE' });
      fetchZones();
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  const startEdit = (zone: NoFlyZone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      type: zone.type,
      altitudeLimit: zone.altitudeLimit,
      permanent: zone.permanent,
      effectiveFrom: zone.effectiveFrom.split('T')[0],
      effectiveTo: zone.effectiveTo ? zone.effectiveTo.split('T')[0] : '',
      geometry: JSON.stringify(zone.geometry, null, 2),
    });
    setShowForm(true);
  };

  // Simple SVG polygon preview
  const renderPolygonPreview = (geometry: Array<{ lat: number; lng: number }>) => {
    if (geometry.length < 3) return null;
    const lats = geometry.map((p) => p.lat);
    const lngs = geometry.map((p) => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 4;
    const w = 120, h = 80;

    const points = geometry
      .map((p) => {
        const x = pad + ((p.lng - minLng) / (maxLng - minLng || 1)) * (w - pad * 2);
        const y = h - (pad + ((p.lat - minLat) / (maxLat - minLat || 1)) * (h - pad * 2));
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={w} height={h} className="rounded bg-slate-900 border border-slate-800">
        <polygon
          points={points}
          fill="#ef444420"
          stroke="#ef4444"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                🚫 No-Fly Zone Management
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Define and manage restricted airspace for drone operations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/admin/drones')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                ← Fleet
              </button>
              <button
                onClick={() => {
                  setEditingZone(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                + Add Zone
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(typeConfig) as NoFlyZoneType[]).map((type) => {
            const count = zones.filter((z) => z.type === type).length;
            const cfg = typeConfig[type];
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  typeFilter === type
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{cfg.icon}</span>
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-slate-500 font-mono">({count})</span>
              </button>
            );
          })}
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
              typeFilter === 'all'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            All ({zones.length})
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="rounded-xl border border-red-700/30 bg-red-950/10 p-6">
            <h2 className="text-lg font-bold text-red-300 mb-4">
              {editingZone ? '✏️ Edit Zone' : '🚫 Add New No-Fly Zone'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Muscat International Airport"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as NoFlyZoneType })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-red-500"
                  >
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.icon} {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Altitude Limit (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={form.altitudeLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        altitudeLimit: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.effectiveFrom}
                    onChange={(e) =>
                      setForm({ ...form, effectiveFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Effective To (optional)
                  </label>
                  <input
                    type="date"
                    value={form.effectiveTo}
                    onChange={(e) =>
                      setForm({ ...form, effectiveTo: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="permanent"
                    checked={form.permanent}
                    onChange={(e) =>
                      setForm({ ...form, permanent: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <label htmlFor="permanent" className="text-sm text-slate-300">
                    Permanent restriction
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Polygon Geometry (GeoJSON array of lat/lng)
                </label>
                <textarea
                  required
                  value={form.geometry}
                  onChange={(e) => setForm({ ...form, geometry: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono outline-none focus:border-red-500 resize-y"
                />
                <p className="text-xs text-slate-500 mt-1">
                  First and last points must be identical to close the polygon.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                >
                  {editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingZone(null);
                  }}
                  className="px-6 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zones List */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-slate-400">Loading zones...</span>
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🚫</p>
            <h3 className="text-xl font-bold text-slate-300 mb-2">
              No Restricted Zones Defined
            </h3>
            <p className="text-slate-500 mb-6">
              Add no-fly zones to ensure safe drone operations
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
            >
              + Add First Zone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {zones.map((zone) => {
              const cfg = typeConfig[zone.type];
              return (
                <div
                  key={zone.id}
                  className={`rounded-xl border p-5 transition-all hover:border-slate-600 ${
                    zone.isActive
                      ? 'bg-slate-900 border-red-800/30'
                      : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cfg.icon}</span>
                      <div>
                        <h3 className="font-bold text-white text-sm">{zone.name}</h3>
                        <span className={`text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(zone)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 text-xs transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {renderPolygonPreview(zone.geometry)}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Altitude Limit</span>
                        <span className="text-slate-300 font-mono">
                          {zone.altitudeLimit}m
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Vertices</span>
                        <span className="text-slate-300 font-mono">
                          {zone.geometry.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Permanent</span>
                        <span className={zone.permanent ? 'text-red-400' : 'text-slate-400'}>
                          {zone.permanent ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Effective</span>
                        <span className="text-slate-300 font-mono">
                          {new Date(zone.effectiveFrom).toLocaleDateString()}
                          {zone.effectiveTo &&
                            ` → ${new Date(zone.effectiveTo).toLocaleDateString()}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            zone.isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            zone.isActive ? 'text-red-400' : 'text-slate-500'
                          }`}
                        >
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
