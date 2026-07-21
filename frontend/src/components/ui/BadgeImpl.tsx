"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*                               Types                                 */
/* ------------------------------------------------------------------ */

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "gold" | "outline";
export type BadgeSize = "sm" | "md" | "lg";

/* ------------------------------------------------------------------ */
/*                               Props                                 */
/* ------------------------------------------------------------------ */

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  className?: string;
  onClick?: () => void;
}

/* ------------------------------------------------------------------ */
/*                          Style Maps                                 */
/* ------------------------------------------------------------------ */

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-50 text-[#C41E3A] dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  gold: "bg-[#D4AF37]/15 text-[#8B6914] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37]",
  outline: "bg-transparent border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5 rounded-md gap-1",
  md: "text-xs px-2.5 py-1 rounded-lg gap-1.5",
  lg: "text-sm px-3.5 py-1.5 rounded-xl gap-2",
};

/* ------------------------------------------------------------------ */
/*                         Dot Color Map                               */
/* ------------------------------------------------------------------ */

const variantDotColors: Record<BadgeVariant, string> = {
  default: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-[#C41E3A]",
  info: "bg-blue-500",
  gold: "bg-[#D4AF37]",
  outline: "bg-gray-400",
};

/* ------------------------------------------------------------------ */
/*                            Component                                */
/* ------------------------------------------------------------------ */

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  dotColor,
  className,
  onClick,
}: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            dotColor ?? variantDotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*                       Status Badge Helper                           */
/* ------------------------------------------------------------------ */

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "rejected" | "completed" | "cancelled" | "processing" | "shipped";
  className?: string;
  size?: BadgeSize;
}

const statusMap: Record<StatusBadgeProps["status"], { variant: BadgeVariant; label: string; labelAr: string }> = {
  active: { variant: "success", label: "Active", labelAr: "نشط" },
  inactive: { variant: "default", label: "Inactive", labelAr: "غير نشط" },
  pending: { variant: "warning", label: "Pending", labelAr: "قيد الانتظار" },
  rejected: { variant: "error", label: "Rejected", labelAr: "مرفوض" },
  completed: { variant: "success", label: "Completed", labelAr: "مكتمل" },
  cancelled: { variant: "error", label: "Cancelled", labelAr: "ملغي" },
  processing: { variant: "info", label: "Processing", labelAr: "قيد المعالجة" },
  shipped: { variant: "info", label: "Shipped", labelAr: "تم الشحن" },
};

export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  const config = statusMap[status];
  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.labelAr}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*                         Count Badge                                 */
/* ------------------------------------------------------------------ */

interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function CountBadge({ count, max = 99, className }: CountBadgeProps) {
  const display = count > max ? `${max}+` : count;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[#C41E3A] text-white",
        className
      )}
    >
      {display}
    </span>
  );
}
