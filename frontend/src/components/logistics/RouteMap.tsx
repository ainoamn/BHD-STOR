"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapStop {
  lat: number;
  lng: number;
  label: string;
  completed?: boolean;
}

interface RouteMapProps {
  className?: string;
  stops?: MapStop[];
  showPath?: boolean;
  driverLocation?: { lat: number; lng: number };
}

export function RouteMap({
  className,
  stops = [],
  showPath = false,
  driverLocation,
}: RouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo((w / 10) * i, 0);
      ctx.lineTo((w / 10) * i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (h / 10) * i);
      ctx.lineTo(w, (h / 10) * i);
      ctx.stroke();
    }

    // Draw simplified roads
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.7);
    ctx.lineTo(w * 0.3, h * 0.5);
    ctx.lineTo(w * 0.5, h * 0.4);
    ctx.lineTo(w * 0.7, h * 0.45);
    ctx.lineTo(w * 0.85, h * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw connecting path between stops
    if (showPath && stops.length > 1) {
      ctx.beginPath();
      stops.forEach((stop, i) => {
        const sx = ((stop.lng - 52) / 8) * w;
        const sy = h - ((stop.lat - 16) / 11) * h;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw stops
    stops.forEach((stop, i) => {
      const sx = ((stop.lng - 52) / 8) * w;
      const sy = h - ((stop.lat - 16) / 11) * h;

      // Stop circle
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = stop.completed ? "#10b981" : "#3b82f6";
      ctx.fill();

      // Ring
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.strokeStyle = stop.completed
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stop.label, sx, sy);

      // Number badge
      ctx.fillStyle = "#64748b";
      ctx.font = "9px sans-serif";
      ctx.fillText(`${i + 1}`, sx, sy + 20);
    });

    // Draw driver location
    if (driverLocation) {
      const dx = ((driverLocation.lng - 52) / 8) * w;
      const dy = h - ((driverLocation.lat - 16) / 11) * h;

      // Pulse
      ctx.beginPath();
      ctx.arc(dx, dy, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }, [stops, showPath, driverLocation]);

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-slate-50", className)}>
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-[10px] shadow-sm space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Completed</span>
        </div>
        {driverLocation && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Driver</span>
          </div>
        )}
      </div>

      {driverLocation && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 bg-emerald-500 text-white border-0"
          >
            <Navigation className="h-2.5 w-2.5" />
            Live
          </Badge>
        </div>
      )}
    </div>
  );
}
