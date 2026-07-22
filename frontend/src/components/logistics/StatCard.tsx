"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: string;
  bg: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  bg,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {change}
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </div>
          <div className={cn("p-2.5 rounded-lg", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
