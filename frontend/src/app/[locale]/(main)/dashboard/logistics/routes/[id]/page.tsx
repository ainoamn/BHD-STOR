"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RouteMap } from "@/components/logistics/RouteMap";
import { ShipmentStatusBadge } from "@/components/logistics/ShipmentStatusBadge";
import {
  ArrowLeft,
  Printer,
  Route,
  Truck,
  User,
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  Circle,
  Gauge,
} from "lucide-react";

const routeData = {
  id: "R-452",
  name: "Muscat Central Route",
  driver: { name: "Khalid Bin Said", phone: "+968 9555 1234" },
  vehicle: { name: "Toyota Hilux", plate: "OM-1234" },
  status: "active" as const,
  date: "2025-01-15",
  distance: 42.5,
  estimatedTime: 240,
  actualTime: 210,
  startTime: "08:00 AM",
  completedStops: 6,
  totalStops: 8,
};

const stops = [
  { id: 1, address: "Al Khuwair - Oman Electronics LLC", type: "pickup", status: "completed", shipmentId: "TRK-2847", time: "08:15 AM" },
  { id: 2, address: "Qurum - Villa 12, Al Shatti", type: "delivery", status: "completed", shipmentId: "TRK-2847", time: "09:30 AM" },
  { id: 3, address: "Ruwi - Al Harthy Complex", type: "pickup", status: "completed", shipmentId: "TRK-2862", time: "10:00 AM" },
  { id: 4, address: "Madinat Al Sultan Qaboos - Flat 55", type: "delivery", status: "completed", shipmentId: "TRK-2862", time: "11:15 AM" },
  { id: 5, address: "Bawshar - Bawshar Heights", type: "pickup", status: "completed", shipmentId: "TRK-2850", time: "11:45 AM" },
  { id: 6, address: "Ghala - Industrial Area", type: "delivery", status: "completed", shipmentId: "TRK-2850", time: "12:30 PM" },
  { id: 7, address: "Seeb - Al Hail Commercial", type: "pickup", status: "in_progress", shipmentId: "TRK-2865", time: "01:15 PM" },
  { id: 8, address: "Al Khoud - SQU Gate 3", type: "delivery", status: "pending", shipmentId: "TRK-2865", time: "02:00 PM" },
];

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();

  const progress = (routeData.completedStops / routeData.totalStops) * 100;

  const mapStops = stops.map((s, i) => ({
    lat: 23.588 + Math.sin(i * 0.8) * 0.03,
    lng: 58.3829 + Math.cos(i * 0.8) * 0.04,
    label: s.type === "pickup" ? "P" : "D",
    completed: s.status === "completed",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {routeData.name}
              </h1>
              <Badge
                variant={
                  routeData.status === "active" ? "default" : "secondary"
                }
              >
                {routeData.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {routeData.id} · {routeData.date}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Route
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs">Driver</span>
            </div>
            <p className="text-sm font-bold">{routeData.driver.name}</p>
            <p className="text-xs text-muted-foreground">
              {routeData.driver.phone}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Truck className="h-4 w-4" />
              <span className="text-xs">Vehicle</span>
            </div>
            <p className="text-sm font-bold">{routeData.vehicle.name}</p>
            <p className="text-xs text-muted-foreground">
              {routeData.vehicle.plate}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Navigation className="h-4 w-4" />
              <span className="text-xs">Distance</span>
            </div>
            <p className="text-2xl font-bold">{routeData.distance} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Time</span>
            </div>
            <p className="text-2xl font-bold">
              {Math.floor(routeData.actualTime / 60)}h{" "}
              {routeData.actualTime % 60}m
            </p>
            <p className="text-xs text-muted-foreground">
              Est: {Math.floor(routeData.estimatedTime / 60)}h{" "}
              {routeData.estimatedTime % 60}m
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              Route Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RouteMap className="h-[500px]" stops={mapStops} showPath />
          </CardContent>
        </Card>

        {/* Stops List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Stops ({routeData.completedStops}/{routeData.totalStops})
            </CardTitle>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-1">
            {stops.map((stop, index) => (
              <div
                key={stop.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  stop.status === "in_progress"
                    ? "bg-primary/10 border border-primary/30"
                    : stop.status === "completed"
                      ? "bg-muted/30"
                      : "bg-card border"
                }`}
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {stop.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : stop.status === "in_progress" ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  {index < stops.length - 1 && (
                    <div
                      className={`w-0.5 h-8 ${
                        stop.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] px-1 h-4">
                      {stop.type}
                    </Badge>
                    <span className="text-xs font-mono">
                      {stop.shipmentId}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-0.5">
                    {stop.address}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {stop.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
