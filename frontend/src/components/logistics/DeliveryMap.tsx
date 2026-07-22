"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Navigation, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
}

interface DeliveryMapProps {
  className?: string;
  pickup?: MapPoint;
  delivery?: MapPoint;
  showVehicles?: boolean;
}

// Simulated vehicle positions for the fleet overview
const vehiclePositions = [
  { id: 1, lat: 0.45, lng: 0.35, name: "OM-1234", driver: "Khalid" },
  { id: 2, lat: 0.55, lng: 0.5, name: "OM-5678", driver: "Said" },
  { id: 3, lat: 0.38, lng: 0.6, name: "OM-9012", driver: "Hamdan" },
  { id: 4, lat: 0.62, lng: 0.28, name: "OM-7890", driver: "Majid" },
  { id: 5, lat: 0.48, lng: 0.72, name: "OM-2468", driver: "Yousuf" },
  { id: 6, lat: 0.72, lng: 0.45, name: "OM-8642", driver: "Fahad" },
];

export function DeliveryMap({
  className,
  pickup,
  delivery,
  showVehicles = false,
}: DeliveryMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredVehicle, setHoveredVehicle] = useState<number | null>(null);

  // Convert lat/lng to canvas coordinates (simplified projection)
  const toCanvasCoords = (lat: number, lng: number, width: number, height: number) => {
    // Map Oman roughly: lat 16-27, lng 52-60
    const x = ((lng - 52) / 8) * width;
    const y = height - ((lat - 16) / 11) * height;
    return { x, y };
  };

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

    // Background - Oman map-ish
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // Draw grid
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

    // Draw simplified Oman coastline
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.85);
    ctx.lineTo(w * 0.15, h * 0.7);
    ctx.lineTo(w * 0.2, h * 0.55);
    ctx.lineTo(w * 0.25, h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.25);
    ctx.lineTo(w * 0.5, h * 0.15);
    ctx.lineTo(w * 0.65, h * 0.2);
    ctx.lineTo(w * 0.75, h * 0.3);
    ctx.lineTo(w * 0.8, h * 0.45);
    ctx.lineTo(w * 0.78, h * 0.6);
    ctx.lineTo(w * 0.7, h * 0.75);
    ctx.lineTo(w * 0.6, h * 0.85);
    ctx.lineTo(w * 0.45, h * 0.9);
    ctx.lineTo(w * 0.3, h * 0.88);
    ctx.lineTo(w * 0.1, h * 0.85);
    ctx.stroke();

    // Fill Oman shape
    ctx.fillStyle = "rgba(148, 163, 184, 0.1)";
    ctx.fill();

    // Draw roads (simplified)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    // Main highway
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.6);
    ctx.lineTo(w * 0.5, h * 0.4);
    ctx.lineTo(w * 0.7, h * 0.5);
    ctx.stroke();
    // Coastal road
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.35);
    ctx.lineTo(w * 0.55, h * 0.25);
    ctx.lineTo(w * 0.75, h * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw pickup point
    if (pickup) {
      const px = ((pickup.lng - 52) / 8) * w;
      const py = h - ((pickup.lat - 16) / 11) * h;

      // Pulse animation ring
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", px, py);
    }

    // Draw delivery point
    if (delivery) {
      const dx = ((delivery.lng - 52) / 8) * w;
      const dy = h - ((delivery.lat - 16) / 11) * h;

      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("D", dx, dy);
    }

    // Draw route line between pickup and delivery
    if (pickup && delivery) {
      const px = ((pickup.lng - 52) / 8) * w;
      const py = h - ((pickup.lat - 16) / 11) * h;
      const dx = ((delivery.lng - 52) / 8) * w;
      const dy = h - ((delivery.lat - 16) / 11) * h;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(dx, dy);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw vehicles
    if (showVehicles) {
      vehiclePositions.forEach((v) => {
        const vx = v.lng * w;
        const vy = v.lat * h;

        ctx.beginPath();
        ctx.arc(vx, vy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(vx, vy, 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }, [pickup, delivery, showVehicles, hoveredVehicle]);

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-slate-50", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: showVehicles ? "pointer" : "default" }}
      />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-[10px] shadow-sm space-y-1">
        {pickup && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Pickup</span>
          </div>
        )}
        {delivery && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Delivery</span>
          </div>
        )}
        {showVehicles && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Vehicle</span>
          </div>
        )}
      </div>

      {/* Vehicle count badge */}
      {showVehicles && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 bg-white/90 backdrop-blur-sm"
          >
            <Navigation className="h-2.5 w-2.5" />
            {vehiclePositions.length} active
          </Badge>
        </div>
      )}
    </div>
  );
}
