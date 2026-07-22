/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Flight Path Visualization                │
 * │  SVG-based animated flight trajectory renderer              │
 * └─────────────────────────────────────────────────────────────┘
 */

'use client';

import React, { useMemo } from 'react';

export interface Waypoint {
  lat: number;
  lng: number;
  altitude?: number;
  sequence: number;
  action?: string;
}

export interface FlightPathProps {
  waypoints: Waypoint[];
  width?: number;
  height?: number;
  animated?: boolean;
  showAltitude?: boolean;
  activeIndex?: number; // which waypoint is currently active
}

const ACTION_COLORS: Record<string, string> = {
  pickup: '#10b981',
  drop: '#f59e0b',
  hover: '#3b82f6',
  photo: '#8b5cf6',
  land: '#ef4444',
  return: '#06b6d4',
};

const ACTION_LABELS: Record<string, string> = {
  pickup: 'Pickup',
  drop: 'Delivery',
  hover: 'Hover',
  photo: 'Photo',
  land: 'Land',
  return: 'RTH',
};

export const FlightPath: React.FC<FlightPathProps> = ({
  waypoints,
  width = 600,
  height = 400,
  animated = true,
  showAltitude = true,
  activeIndex = -1,
}) => {
  const { points, pathD, viewBox } = useMemo(() => {
    if (waypoints.length < 2) return { points: [], pathD: '', viewBox: '0 0 100 100' };

    // Normalize coordinates to SVG viewbox
    const lats = waypoints.map((w) => w.lat);
    const lngs = waypoints.map((w) => w.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padding = 40;
    const vbWidth = width;
    const vbHeight = height;

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const toX = (lng: number) =>
      padding + ((lng - minLng) / lngRange) * (vbWidth - padding * 2);
    const toY = (lat: number) =>
      vbHeight - (padding + ((lat - minLat) / latRange) * (vbHeight - padding * 2));

    const pts = waypoints.map((wp, i) => ({
      x: toX(wp.lng),
      y: toY(wp.lat),
      altitude: wp.altitude ?? 80,
      sequence: wp.sequence,
      action: wp.action || 'hover',
      isActive: i === activeIndex,
    }));

    // Build path string
    const d = pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      return `${acc} L ${p.x} ${p.y}`;
    }, '');

    return {
      points: pts,
      pathD: d,
      viewBox: `0 0 ${vbWidth} ${vbHeight}`,
    };
  }, [waypoints, width, height, activeIndex]);

  if (waypoints.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800"
        style={{ width, height }}>
        <p className="text-sm text-slate-500">Not enough waypoints</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
      <svg
        width={width}
        height={height}
        viewBox={viewBox}
        className="block"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
          </pattern>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Arrow marker */}
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Background grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Route path */}
        <path
          d={pathD}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          filter="url(#glow)"
          className={animated ? 'animate-dash' : ''}
        >
          {animated && (
            <animate
              attributeName="stroke-dashoffset"
              from="100"
              to="0"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Segments with arrows */}
        {points.map((p, i) =>
          i < points.length - 1 ? (
            <line
              key={`seg-${i}`}
              x1={p.x}
              y1={p.y}
              x2={points[i + 1].x}
              y2={points[i + 1].y}
              stroke="transparent"
              strokeWidth="10"
            />
          ) : null,
        )}

        {/* Waypoint markers */}
        {points.map((p, i) => {
          const color = ACTION_COLORS[p.action] || '#3b82f6';
          const isStart = i === 0;
          const isEnd = i === points.length - 1;

          return (
            <g key={`wp-${i}`}>
              {/* Outer glow ring for active waypoint */}
              {p.isActive && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="16"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values="12;18;12"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;0.2;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Connection line */}
              {showAltitude && i < points.length - 1 && (
                <text
                  x={(p.x + points[i + 1].x) / 2}
                  y={(p.y + points[i + 1].y) / 2 - 8}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {p.altitude}m
                </text>
              )}

              {/* Waypoint circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isStart || isEnd ? 8 : 6}
                fill={color}
                stroke="#0f172a"
                strokeWidth="2"
                filter="url(#glow)"
              />

              {/* Sequence number */}
              <text
                x={p.x}
                y={p.y + 3}
                fill="#fff"
                fontSize={isStart || isEnd ? '9' : '8'}
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {p.sequence}
              </text>

              {/* Label */}
              <text
                x={p.x}
                y={p.y - (isStart || isEnd ? 14 : 12)}
                fill={color}
                fontSize="9"
                fontWeight="600"
                fontFamily="system-ui"
                textAnchor="middle"
              >
                {ACTION_LABELS[p.action] || p.action}
              </text>

              {/* Start/End badges */}
              {(isStart || isEnd) && (
                <rect
                  x={p.x - 16}
                  y={p.y + 12}
                  width="32"
                  height="14"
                  rx="4"
                  fill={color}
                  opacity="0.9"
                />
              )}
              {(isStart || isEnd) && (
                <text
                  x={p.x}
                  y={p.y + 22}
                  fill="#0f172a"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isStart ? 'START' : 'END'}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(ACTION_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: ACTION_COLORS[key] }}
            />
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlightPath;
