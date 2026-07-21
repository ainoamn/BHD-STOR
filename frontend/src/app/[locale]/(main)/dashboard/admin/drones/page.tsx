/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Fleet Management Page              │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Admin dashboard for autonomous drone fleet oversight        │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DroneCard } from '@/components/drone/DroneCard';
import { BatteryIndicator } from '@/components/drone/BatteryIndicator';
import type { DroneStatus } from '@/components/drone/DroneCard';

/* ── Types ── */
interface Drone {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  type: 'delivery' | 'surveillance' | 'inspection';
  status: DroneStatus;
  currentBattery: number;
  maxPayload: number;
  maxRange: number;
  maxSpeed: number;
  currentLocation: { lat: number; lng: number; altitude?: number };
  flightHours: number;
  lastMaintenanceDate?: string;
}

interface FleetStats {
  total: number;
  available: number;
  inFlight: number;
  charging: number;
  maintenance: number;
  offline: number;
  avgBattery: number;
  totalFlightHours: number;
  activeMissions: number;
  completedMissionsToday: number;
}

export default function DroneFleetPage() {
  const router = useRouter();
  const [drones, setDrones] = useState<Drone[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch drones
  const fetchDrones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/drones?${params}`);
      const data = await res.json();
      setDrones(data.items ?? []);
    } catch (err) {
      console.error('Failed to fetch drones:', err);
    }
  }, [statusFilter, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/drones/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDrones(), fetchStats()]);
      setLoading(false);
    };
    load();

    const interval = setInterval(() => {
      fetchDrones();
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDrones, fetchStats]);

  const handleStatusChange = async (id: string, status: DroneStatus) => {
    try {
      await fetch(`/api/drones/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchDrones();
      fetchStats();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                🚁 Drone Fleet Management
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitor, control, and deploy your autonomous drone fleet
              </p>
            </div>
            <button
              onClick={() => router.push('drones/missions')}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
            >
              🎯 Mission Control
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Total Drones"
              value={stats.total}
              icon="🚁"
              accent
            />
            <StatCard
              label="Available"
              value={stats.available}
              icon="✅"
              color="text-emerald-400"
            />
            <StatCard
              label="In Flight"
              value={stats.inFlight}
              icon="🛸"
              color="text-sky-400"
            />
            <StatCard
              label="Charging"
              value={stats.charging}
              icon="🔌"
              color="text-amber-400"
            />
            <StatCard
              label="Maintenance"
              value={stats.maintenance}
              icon="🔧"
              color="text-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Fleet Avg. Battery
              </p>
              <div className="mt-2">
                <BatteryIndicator level={stats.avgBattery} size="lg" />
              </div>
            </div>
            <StatCard
              label="Total Flight Hours"
              value={`${Math.round(stats.totalFlightHours)}h`}
              icon="⏱️"
            />
            <StatCard
              label="Active Missions"
              value={stats.activeMissions}
              icon="🎯"
              color="text-sky-400"
            />
            <StatCard
              label="Completed Today"
              value={stats.completedMissionsToday}
              icon="📦"
              color="text-emerald-400"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search drones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-sky-500 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_flight">In Flight</option>
            <option value="charging">Charging</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          <button
            onClick={fetchDrones}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/drones/no-fly-zones')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
          >
            🚫 No-Fly Zones
          </button>
        </div>
      </div>

      {/* Drone Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-slate-400">Loading fleet...</span>
          </div>
        ) : drones.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🚁</p>
            <p className="text-slate-400">No drones found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {drones.map((drone) => (
              <DroneCard
                key={drone.id}
                {...drone}
                onStatusChange={handleStatusChange}
                onPlanMission={(id) =>
                  router.push(`/dashboard/admin/drones/missions?plan=${id}`)
                }
                onViewDetails={(id) =>
                  router.push(`/dashboard/admin/drones/${id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  icon,
  color,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? 'bg-sky-950/20 border-sky-700/30'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-2xl font-bold font-mono ${
            color || 'text-white'
          }`}
        >
          {value}
        </span>
      </div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mt-2">
        {label}
      </p>
    </div>
  );
}
