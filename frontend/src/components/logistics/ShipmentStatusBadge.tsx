"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "cancelled";

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<
  ShipmentStatus,
  { label: string; variant: string; bg: string; text: string }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
  },
  in_transit: {
    label: "In Transit",
    variant: "outline",
    bg: "bg-blue-500/10",
    text: "text-blue-700",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    variant: "outline",
    bg: "bg-violet-500/10",
    text: "text-violet-700",
  },
  delivered: {
    label: "Delivered",
    variant: "outline",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
  },
  failed: {
    label: "Failed",
    variant: "outline",
    bg: "bg-red-500/10",
    text: "text-red-700",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    bg: "bg-slate-500/10",
    text: "text-slate-700",
  },
};

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0 h-5",
  md: "text-xs px-2 py-0.5 h-6",
  lg: "text-sm px-3 py-1 h-7",
};

export function ShipmentStatusBadge({
  status,
  size = "md",
  className,
}: ShipmentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-0",
        config.bg,
        config.text,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
