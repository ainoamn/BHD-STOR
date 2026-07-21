/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Mission Control Center                   │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Real-time mission orchestration & flight monitoring         │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MissionControl } from '@/components/drone/MissionControl';
import type { Mission, MissionStatus } from '@/components/drone/MissionControl';

export default function MissionControlPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planDroneId = searchParams.get('plan');

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPlanner, setShowPlanner] = useState(!!planDroneId);

  // Plan form state
  const [planForm, setPlanForm] = useState({
    droneId: planDroneId || '',
    type: 'delivery' as const,
    payloadWeight: 0.5,
    pickupLat: 23.5859,
    pickupLng: 58.4059,
    deliveryLat: 23.61,
    deliveryLng: 58.42,
    shipmentId: '',
  });
  const [planning, setPlanning] = useState(false);

  // Fetch missions
  const fetchMissions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/drones/missions?${params}`);
      const data = await res.json();
      setMissions(data ?? []);
    } catch (err) {
      console.error('Failed to fetch missions:', err);
    }
  }, [statusFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchMissions();
      setLoading(false);
    };
    load();

    const interval = setInterval(fetchMissions, 3000);
    return () => clearInterval(interval);
  }, [fetchMissions]);

  const handleLaunch = async (missionId: string) => {
    try {
      await fetch(`/api/drones/missions/${missionId}/launch`, {
        method: 'POST',
      });
      fetchMissions();
    } catch (err) {
      console.error('Failed to launch mission:', err);
    }
  };

  const handleAbort = async (missionId: string, reason: string) => {
    try {
      await fetch(`/api/drones/missions/${missionId}/abort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      fetchMissions();
    } catch (err) {
      console.error('Failed to abort mission:', err);
    }
  };

  const handleComplete = async (missionId: string) => {
    try {
      await fetch(`/api/drones/missions/${missionId}/complete`, {
        method: 'POST',
      });
      fetchMissions();
    } catch (err) {
      console.error('Failed to complete mission:', err);
    }
  };

  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanning(true);
    try {
      const res = await fetch('/api/drones/missions/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          droneId: planForm.droneId,
          type: planForm.type,
          payloadWeight: planForm.payloadWeight,
          pickup: { lat: planForm.pickupLat, lng: planForm.pickupLng },
          delivery: { lat: planForm.deliveryLat, lng: planForm.deliveryLng },
          shipmentId: planForm.shipmentId || undefined,
        }),
      });
      if (res.ok) {
        setShowPlanner(false);
        setPlanForm({
          droneId: '',
          type: 'delivery',
          payloadWeight: 0.5,
          pickupLat: 23.5859,
          pickupLng: 58.4059,
          deliveryLat: 23.61,
          deliveryLng: 58.42,
          shipmentId: '',
        });
        fetchMissions();
      }
    } catch (err) {
      console.error('Failed to plan mission:', err);
    } finally {
      setPlanning(false);
    }
  };

  const activeMissions = missions.filter(
    (m) => m.status === 'in_progress' || m.status === 'pre_flight',
  );
  const plannedMissions = missions.filter((m) => m.status === 'planned');
  const completedMissions = missions.filter(
    (m) => m.status === 'completed' || m.status === 'aborted' || m.status === 'failed',
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                🎯 Mission Control Center
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Plan, launch, and monitor autonomous delivery missions
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
                onClick={() => setShowPlanner(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                + Plan Mission
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-4">
          <QuickStat label="Active" value={activeMissions.length} color="sky" />
          <QuickStat label="Planned" value={plannedMissions.length} color="slate" />
          <QuickStat
            label="Completed Today"
            value={completedMissions.filter((m) => {
              if (!m.endTime) return false;
              const end = new Date(m.endTime);
              const today = new Date();
              return (
                end.getDate() === today.getDate() &&
                end.getMonth() === today.getMonth() &&
                end.getFullYear() === today.getFullYear()
              );
            }).length}
            color="emerald"
          />
          <QuickStat label="Total" value={missions.length} color="slate" />
        </div>
      </div>

      {/* Mission Planner Modal */}
      {showPlanner && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="rounded-xl border border-emerald-700/30 bg-emerald-950/10 p-6">
            <h2 className="text-lg font-bold text-emerald-300 mb-4">
              📋 Plan New Mission
            </h2>
            <form onSubmit={handlePlan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Drone ID
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.droneId}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, droneId: e.target.value })
                    }
                    placeholder="Drone UUID"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Mission Type
                  </label>
                  <select
                    value={planForm.type}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        type: e.target.value as 'delivery',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="survey">Survey</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Payload (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={planForm.payloadWeight}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        payloadWeight: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider">
                    Pickup Location
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lat"
                      value={planForm.pickupLat}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          pickupLat: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lng"
                      value={planForm.pickupLng}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          pickupLng: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider">
                    Delivery Location
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lat"
                      value={planForm.deliveryLat}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          deliveryLat: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Lng"
                      value={planForm.deliveryLng}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          deliveryLng: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={planning}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {planning && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Plan & Validate Route
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanner(false)}
                  className="px-6 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <h2 className="text-lg font-bold text-sky-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Active Missions ({activeMissions.length})
          </h2>
          <div className="space-y-6">
            {activeMissions.map((mission) => (
              <MissionControl
                key={mission.id}
                mission={mission}
                onLaunch={handleLaunch}
                onAbort={handleAbort}
                onComplete={handleComplete}
                live
              />
            ))}
          </div>
        </div>
      )}

      {/* Planned Missions */}
      {plannedMissions.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <h2 className="text-lg font-bold text-slate-300 mb-4">
            📋 Planned Missions ({plannedMissions.length})
          </h2>
          <div className="space-y-6">
            {plannedMissions.map((mission) => (
              <MissionControl
                key={mission.id}
                mission={mission}
                onLaunch={handleLaunch}
                onAbort={handleAbort}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed / Past Missions */}
      {completedMissions.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-10">
          <h2 className="text-lg font-bold text-slate-400 mb-4">
            📜 Mission History ({completedMissions.length})
          </h2>
          <div className="space-y-4">
            {completedMissions.slice(0, 10).map((mission) => (
              <MissionControl
                key={mission.id}
                mission={mission}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && missions.length === 0 && (
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-5xl mb-4">🎯</p>
          <h3 className="text-xl font-bold text-slate-300 mb-2">
            No Missions Yet
          </h3>
          <p className="text-slate-500 mb-6">
            Plan your first autonomous delivery mission
          </p>
          <button
            onClick={() => setShowPlanner(true)}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            + Plan Mission
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Quick Stat ── */
function QuickStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    slate: 'text-slate-400',
  };
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">
      <span className={`text-lg font-bold font-mono ${colorMap[color] || 'text-white'}`}>
        {value}
      </span>
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
