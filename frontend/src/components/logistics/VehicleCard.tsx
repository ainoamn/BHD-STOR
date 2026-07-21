"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Car, Bike, User, Wrench, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: "truck" | "van" | "bike" | "car";
  status: "active" | "maintenance" | "inactive";
  currentDriver: string | null;
  zone: string;
  fuelLevel: number;
  capacity: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

const typeIcons: Record<string, typeof Truck> = {
  truck: Truck,
  van: Car,
  bike: Bike,
  car: Car,
};

const statusColors: Record<string, { badge: string; indicator: string }> = {
  active: {
    badge: "bg-emerald-500 hover:bg-emerald-500 text-white",
    indicator: "bg-emerald-500",
  },
  maintenance: {
    badge: "bg-amber-500 hover:bg-amber-500 text-white",
    indicator: "bg-amber-500",
  },
  inactive: {
    badge: "bg-slate-500 hover:bg-slate-500 text-white",
    indicator: "bg-slate-500",
  },
};

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const Icon = typeIcons[vehicle.type] || Truck;
  const statusStyle = statusColors[vehicle.status];

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        vehicle.status === "maintenance" && "border-amber-200",
        vehicle.status === "inactive" && "opacity-70"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{vehicle.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {vehicle.plateNumber}
              </p>
            </div>
          </div>
          <Badge className={cn("text-[10px] px-1.5 h-5", statusStyle.badge)}>
            {vehicle.status}
          </Badge>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 mb-3">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">
            {vehicle.currentDriver || (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
        </div>

        {/* Fuel */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Fuel Level</span>
            <span className="font-medium">{vehicle.fuelLevel}%</span>
          </div>
          <Progress
            value={vehicle.fuelLevel}
            className={cn(
              "h-1.5",
              vehicle.fuelLevel < 20 && "bg-red-100"
            )}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] px-1 h-4">
              {vehicle.zone}
            </Badge>
            <Badge variant="outline" className="text-[9px] px-1 h-4">
              {vehicle.capacity}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
