/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Card                               │
 * │  Fleet status card with telemetry & mission controls        │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React from 'react';
import { BatteryIndicator } from './BatteryIndicator';

/* ── Types (mirror backend) ── */
export type DroneStatus =
  | 'available'
  | 'in_flight'
  | 'charging'
  | 'maintenance'
  | 'offline';

export type DroneType = 'delivery' | 'surveillance' | 'inspection';

export interface DroneCardProps {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  type: DroneType;
  status: DroneStatus;
  currentBattery: number;
  maxPayload: number;
  maxRange: number;
  maxSpeed: number;
  currentLocation: { lat: number; lng: number; altitude?: number };
  flightHours: number;
  lastMaintenanceDate?: string;
  onStatusChange?: (id: string, status: DroneStatus) => void;
  onPlanMission?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const statusConfig: Record<
  DroneStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  available: {
    label: 'Available',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  in_flight: {
    label: 'In Flight',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    dot: 'bg-sky-400 animate-pulse',
  },
  charging: {
    label: 'Charging',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  offline: {
    label: 'Offline',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

const typeIcon: Record<DroneType, string> = {
  delivery: '📦',
  surveillance: '👁️',
  inspection: '🔍',
};

export const DroneCard: React.FC<DroneCardProps> = ({
  id,
  name,
  serialNumber,
  model,
  type,
  status,
  currentBattery,
  maxPayload,
  maxRange,
  maxSpeed,
  currentLocation,
  flightHours,
  lastMaintenanceDate,
  onStatusChange,
  onPlanMission,
  onViewDetails,
}) => {
  const cfg = statusConfig[status];
  const isAvailable = status === 'available';

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${cfg.bg}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg shadow-inner">
            {typeIcon[type]}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">
              {name}
            </h3>
            <p className="text-xs text-slate-400 font-mono">{serialNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Battery */}
      <div className="flex items-center justify-between mb-4">
        <BatteryIndicator
          level={currentBattery}
          size="md"
          charging={status === 'charging'}
        />
        <span className="text-xs text-slate-500">
          {currentLocation.altitude?.toFixed(0) ?? 0}m AGL
        </span>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-slate-900/40 p-2 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Payload
          </p>
          <p className="text-sm font-bold text-white">{maxPayload}kg</p>
        </div>
        <div className="rounded-lg bg-slate-900/40 p-2 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Range
          </p>
          <p className="text-sm font-bold text-white">{maxRange}km</p>
        </div>
        <div className="rounded-lg bg-slate-900/40 p-2 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Speed
          </p>
          <p className="text-sm font-bold text-white">{maxSpeed}km/h</p>
        </div>
      </div>

      {/* Location & Flight Hours */}
      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">GPS</span>
          <span className="text-slate-300 font-mono">
            {currentLocation.lat.toFixed(5)},{' '}
            {currentLocation.lng.toFixed(5)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Flight Hours</span>
          <span className="text-slate-300 font-mono">{flightHours}h</span>
        </div>
        {lastMaintenanceDate && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Last Maint.</span>
            <span className="text-slate-300 font-mono">
              {new Date(lastMaintenanceDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails?.(id)}
          className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 transition-colors"
        >
          Details
        </button>
        {isAvailable && (
          <button
            onClick={() => onPlanMission?.(id)}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 transition-colors"
          >
            Plan Mission
          </button>
        )}
        {onStatusChange && (
          <select
            value={status}
            onChange={(e) =>
              onStatusChange(id, e.target.value as DroneStatus)
            }
            className="rounded-lg bg-slate-800 text-slate-300 text-xs px-2 border border-slate-700 outline-none"
          >
            <option value="available">Available</option>
            <option value="in_flight">In Flight</option>
            <option value="charging">Charging</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default DroneCard;
