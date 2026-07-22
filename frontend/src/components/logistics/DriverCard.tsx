"use client";

import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { Star, Package, Phone, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Driver {
  id: string;
  name: string;
  employeeId: string;
  status: "active" | "offline" | "on_leave" | "suspended";
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  vehicle: string | null;
  zone: string;
  phone: string;
}

interface DriverCardProps {
  driver: Driver;
  onClick?: () => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "Active", color: "text-emerald-600", dot: "bg-emerald-500" },
  offline: { label: "Offline", color: "text-slate-500", dot: "bg-slate-400" },
  on_leave: { label: "On Leave", color: "text-amber-600", dot: "bg-amber-500" },
  suspended: { label: "Suspended", color: "text-red-600", dot: "bg-red-500" },
};

export function DriverCard({ driver, onClick, className }: DriverCardProps) {
  const status = statusConfig[driver.status];
  const completionRate = driver.totalDeliveries > 0
    ? Math.round((driver.completedDeliveries / driver.totalDeliveries) * 100)
    : 0;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {driver.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm">{driver.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {driver.employeeId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
          <span className={cn("text-[10px] font-medium", status.color)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-1.5 rounded bg-muted">
          <div className="flex items-center justify-center gap-1">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium">{driver.rating}</span>
          </div>
          <p className="text-[9px] text-muted-foreground">Rating</p>
        </div>
        <div className="text-center p-1.5 rounded bg-muted">
          <div className="flex items-center justify-center gap-1">
            <Package className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">
              {driver.completedDeliveries}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground">Deliveries</p>
        </div>
        <div className="text-center p-1.5 rounded bg-muted">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-medium">{completionRate}%</span>
          </div>
          <p className="text-[9px] text-muted-foreground">Completion</p>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="mb-3">
        <Progress value={completionRate} className="h-1.5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[9px] px-1 h-4">
          {driver.zone}
        </Badge>
        {driver.vehicle ? (
          <span className="text-[10px] text-muted-foreground">
            {driver.vehicle}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            No vehicle
          </span>
        )}
      </div>
    </div>
  );
}
