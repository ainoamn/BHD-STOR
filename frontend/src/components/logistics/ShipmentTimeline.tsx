"use client";

import { CheckCircle, Circle, Clock, Package, Truck, MapPin, PenLine, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  status: string;
  timestamp: string;
  location: string;
  completed: boolean;
  icon: "create" | "pickup" | "transit" | "delivery" | "delivered";
}

interface ShipmentTimelineProps {
  events: TimelineEvent[];
}

const iconMap = {
  create: Package,
  pickup: Truck,
  transit: Clock,
  delivery: MapPin,
  delivered: CheckCircle,
};

export function ShipmentTimeline({ events }: ShipmentTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = iconMap[event.icon];
        const isLast = index === events.length - 1;

        return (
          <div key={index} className="flex items-start gap-4">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  event.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-background border-muted text-muted-foreground"
                )}
              >
                {event.completed ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 h-10 my-1",
                    event.completed && events[index + 1]?.completed
                      ? "bg-emerald-500"
                      : "bg-muted"
                  )}
                />
              )}
            </div>

            {/* Event content */}
            <div
              className={cn(
                "flex-1 pt-1 pb-2",
                !event.completed && "opacity-60"
              )}
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  event.completed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {event.status}
              </p>
              {event.timestamp && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.timestamp).toLocaleString("en-OM", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {event.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
