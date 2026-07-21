/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Mission Control Center                   │
 * │  Real-time mission orchestration with live telemetry        │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FlightPath } from './FlightPath';
import { BatteryIndicator } from './BatteryIndicator';

/* ── Types ── */
export type MissionStatus =
  | 'planned'
  | 'pre_flight'
  | 'in_progress'
  | 'completed'
  | 'aborted'
  | 'failed';

export interface Mission {
  id: string;
  droneId: string;
  droneName: string;
  shipmentId?: string;
  type: 'delivery' | 'survey' | 'inspection';
  status: MissionStatus;
  waypoints: Array<{
    lat: number;
    lng: number;
    altitude: number;
    sequence: number;
    action?: string;
  }>;
  estimatedDistance: number;
  estimatedDuration: number;
  actualDistance?: number;
  actualDuration?: number;
  payloadWeight: number;
  startTime?: string;
  endTime?: string;
  currentWaypointIndex?: number;
  currentBattery?: number;
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

interface MissionControlProps {
  mission: Mission;
  onLaunch?: (missionId: string) => void;
  onAbort?: (missionId: string, reason: string) => void;
  onComplete?: (missionId: string) => void;
  live?: boolean;
}

const statusConfig: Record<
  MissionStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  planned: {
    label: 'Planned',
    color: 'text-slate-300',
    bg: 'bg-slate-600',
    icon: '📋',
  },
  pre_flight: {
    label: 'Pre-Flight',
    color: 'text-amber-300',
    bg: 'bg-amber-600',
    icon: '🔍',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-sky-300',
    bg: 'bg-sky-600',
    icon: '🚁',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-300',
    bg: 'bg-emerald-600',
    icon: '✅',
  },
  aborted: {
    label: 'Aborted',
    color: 'text-orange-300',
    bg: 'bg-orange-600',
    icon: '⚠️',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-300',
    bg: 'bg-red-600',
    icon: '❌',
  },
};

export const MissionControl: React.FC<MissionControlProps> = ({
  mission,
  onLaunch,
  onAbort,
  onComplete,
  live = false,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [abortReason, setAbortReason] = useState('');
  const [showAbortDialog, setShowAbortDialog] = useState(false);

  const cfg = statusConfig[mission.status];
  const isActive = mission.status === 'in_progress';
  const isPlanned = mission.status === 'planned';
  const isTerminal =
    mission.status === 'completed' ||
    mission.status === 'aborted' ||
    mission.status === 'failed';

  // Elapsed timer for active missions
  useEffect(() => {
    if (!isActive) return;
    const start = mission.startTime ? new Date(mission.startTime).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, mission.startTime]);

  const formatElapsed = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const progress =
    mission.waypoints.length > 1 && mission.currentWaypointIndex !== undefined
      ? (mission.currentWaypointIndex / (mission.waypoints.length - 1)) * 100
      : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className="text-xl">{cfg.icon}</span>
          <div>
            <h3 className="text-sm font-bold text-white">
              Mission {mission.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-slate-400">
              {mission.droneName} — {mission.type.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mission.currentBattery !== undefined && (
            <BatteryIndicator level={mission.currentBattery} size="sm" />
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg} bg-opacity-20`}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Live telemetry bar */}
      {isActive && (
        <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-semibold tracking-wider uppercase">
                  Live
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ⏱ {formatElapsed(elapsed)}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Waypoint {mission.currentWaypointIndex ?? 0} /{' '}
              {mission.waypoints.length - 1}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Flight path visualization */}
      <div className="p-5">
        <FlightPath
          waypoints={mission.waypoints}
          width={700}
          height={320}
          animated={isActive}
          activeIndex={mission.currentWaypointIndex ?? -1}
        />
      </div>

      {/* Mission stats */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-4 gap-3">
          <StatBox label="Distance" value={`${mission.estimatedDistance}km`} />
          <StatBox
            label="Est. Duration"
            value={`${mission.estimatedDuration}min`}
          />
          <StatBox label="Payload" value={`${mission.payloadWeight}kg`} />
          <StatBox
            label="Waypoints"
            value={String(mission.waypoints.length)}
          />
        </div>

        {mission.actualDistance !== undefined && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatBox
              label="Actual Distance"
              value={`${mission.actualDistance}km`}
              accent
            />
            <StatBox
              label="Actual Duration"
              value={`${mission.actualDuration ?? 0}min`}
              accent
            />
          </div>
        )}
      </div>

      {/* Logs */}
      {mission.logs && mission.logs.length > 0 && (
        <div className="px-5 pb-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Mission Logs
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg bg-slate-950 p-3">
            {[...mission.logs].reverse().map((log, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-slate-600 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`shrink-0 font-bold ${
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warn'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                  }`}
                >
                  {log.level.toUpperCase()}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isTerminal && (
        <div className="flex gap-3 px-5 pb-5">
          {isPlanned && (
            <button
              onClick={() => onLaunch?.(mission.id)}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
            >
              🚀 Launch Mission
            </button>
          )}
          {isActive && (
            <button
              onClick={() => onComplete?.(mission.id)}
              className="flex-1 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-sky-500/20 active:scale-[0.98]"
            >
              ✅ Mark Complete
            </button>
          )}
          {(isPlanned || isActive) && (
            <button
              onClick={() => setShowAbortDialog(true)}
              className="px-5 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold border border-red-600/30 transition-all active:scale-[0.98]"
            >
              Abort
            </button>
          )}
        </div>
      )}

      {/* Abort dialog */}
      {showAbortDialog && (
        <div className="px-5 pb-5">
          <div className="rounded-lg bg-red-950/30 border border-red-600/30 p-4">
            <p className="text-sm text-red-300 mb-3">
              ⚠️ Abort mission and initiate Return-to-Home?
            </p>
            <textarea
              value={abortReason}
              onChange={(e) => setAbortReason(e.target.value)}
              placeholder="Enter abort reason..."
              className="w-full rounded-lg bg-slate-900 border border-red-600/20 text-slate-200 text-sm p-3 mb-3 outline-none focus:border-red-500 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onAbort?.(mission.id, abortReason || 'Manual abort');
                  setShowAbortDialog(false);
                  setAbortReason('');
                }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                Confirm Abort
              </button>
              <button
                onClick={() => setShowAbortDialog(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Sub-component: Stat Box ── */
const StatBox: React.FC<{
  label: string;
  value: string;
  accent?: boolean;
}> = ({ label, value, accent }) => (
  <div
    className={`rounded-lg p-3 text-center ${
      accent ? 'bg-sky-950/30 border border-sky-700/20' : 'bg-slate-800/40'
    }`}
  >
    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p
      className={`text-sm font-bold font-mono ${
        accent ? 'text-sky-300' : 'text-white'
      }`}
    >
      {value}
    </p>
  </div>
);

export default MissionControl;
