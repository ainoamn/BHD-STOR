"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { RouteOptimizer } from "@/components/logistics/RouteOptimizer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  Route,
  Truck,
  MapPin,
  Clock,
  Gauge,
  Zap,
  Plus,
  ChevronRight,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";

interface RouteItem {
  id: string;
  name: string;
  driver: string;
  vehicle: string;
  stops: number;
  completedStops: number;
  status: "planned" | "active" | "completed";
  distance: number;
  estimatedTime: number;
  actualTime?: number;
  startTime?: string;
  endTime?: string;
}

const routes: RouteItem[] = [
  {
    id: "R-452",
    name: "Muscat Central Route",
    driver: "Khalid Bin Said",
    vehicle: "OM-1234",
    stops: 8,
    completedStops: 6,
    status: "active",
    distance: 42.5,
    estimatedTime: 240,
    actualTime: 210,
    startTime: "08:00 AM",
  },
  {
    id: "R-453",
    name: "Seeb Coastal Route",
    driver: "Said Al-Habsi",
    vehicle: "OM-5678",
    stops: 6,
    completedStops: 6,
    status: "completed",
    distance: 35.2,
    estimatedTime: 180,
    actualTime: 165,
    startTime: "08:30 AM",
    endTime: "11:15 AM",
  },
  {
    id: "R-454",
    name: "Qurum Express Route",
    driver: "Hamdan Al-Azri",
    vehicle: "OM-9012",
    stops: 12,
    completedStops: 4,
    status: "active",
    distance: 18.7,
    estimatedTime: 300,
    actualTime: 120,
    startTime: "09:00 AM",
  },
  {
    id: "R-455",
    name: "Bawshar South Route",
    driver: "Unassigned",
    vehicle: "Unassigned",
    stops: 5,
    completedStops: 0,
    status: "planned",
    distance: 28.3,
    estimatedTime: 150,
  },
  {
    id: "R-456",
    name: "Al Khoud University Route",
    driver: "Majid Al-Siyabi",
    vehicle: "OM-7890",
    stops: 4,
    completedStops: 0,
    status: "planned",
    distance: 22.1,
    estimatedTime: 120,
  },
];

export default function RoutesPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [optimizerOpen, setOptimizerOpen] = useState(false);

  const statusColors: Record<string, string> = {
    planned: "bg-blue-500",
    active: "bg-emerald-500",
    completed: "bg-slate-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan and optimize delivery routes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setOptimizerOpen(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </Button>
          <Button onClick={() => setOptimizerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Route
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Selected</span>
                <span className="font-medium">
                  {format(selectedDate, "EEEE, MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Routes</span>
                <span className="font-medium">{routes.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-emerald-600">
                  {routes.filter((r) => r.status === "active").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-slate-500">
                  {routes.filter((r) => r.status === "completed").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routes List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              Routes for {format(selectedDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Route</TableHead>
                  <TableHead className="text-xs">Driver</TableHead>
                  <TableHead className="text-xs">Stops</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Distance</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow
                    key={route.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() =>
                      router.push(`/dashboard/logistics/routes/${route.id}`)
                    }
                  >
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium">{route.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {route.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <p>{route.driver}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {route.vehicle}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {route.completedStops}/{route.stops}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusColors[route.status]}`}
                        />
                        <span className="text-xs capitalize">
                          {route.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {route.distance} km
                    </TableCell>
                    <TableCell className="text-xs">
                      {route.actualTime ? (
                        <div>
                          <p>
                            {Math.floor(route.actualTime / 60)}h{" "}
                            {route.actualTime % 60}m
                          </p>
                          {route.estimatedTime && (
                            <p className="text-[10px] text-muted-foreground">
                              Est:{" "}
                              {Math.floor(route.estimatedTime / 60)}h{" "}
                              {route.estimatedTime % 60}m
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>
                          {Math.floor(route.estimatedTime / 60)}h{" "}
                          {route.estimatedTime % 60}m
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Route Optimizer Modal */}
      <RouteOptimizer
        open={optimizerOpen}
        onOpenChange={setOptimizerOpen}
        onOptimize={(route) => {
          setOptimizerOpen(false);
        }}
      />
    </div>
  );
}
