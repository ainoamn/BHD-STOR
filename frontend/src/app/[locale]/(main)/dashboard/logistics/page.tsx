"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/logistics/StatCard";
import { DeliveryMap } from "@/components/logistics/DeliveryMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Truck,
  CheckCircle,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  MapPin,
  Fuel,
  Wrench,
} from "lucide-react";
import { ShipmentStatusBadge } from "@/components/logistics/ShipmentStatusBadge";
import Link from "next/link";

const stats = [
  {
    title: "Active Shipments",
    value: "1,284",
    change: "+12%",
    trend: "up" as const,
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "In Transit",
    value: "342",
    change: "+5%",
    trend: "up" as const,
    icon: Truck,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Delivered Today",
    value: "186",
    change: "+8%",
    trend: "up" as const,
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Active Drivers",
    value: "48",
    change: "-2",
    trend: "down" as const,
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "Fleet Status",
    value: "92%",
    change: "+3%",
    trend: "up" as const,
    icon: Fuel,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    title: "Revenue (OMR)",
    value: "14,250",
    change: "+18%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];

const recentShipments = [
  {
    id: "TRK-2847",
    sender: "Oman Electronics LLC",
    receiver: "Ahmed Al-Farsi",
    status: "in_transit" as const,
    driver: "Khalid Bin Said",
    zone: "Muscat",
    service: "Express",
    cost: 12.5,
  },
  {
    id: "TRK-2848",
    sender: "Home Style Furniture",
    receiver: "Fatima Al-Balushi",
    status: "out_for_delivery" as const,
    driver: "Said Al-Habsi",
    zone: "Seeb",
    service: "Standard",
    cost: 8.0,
  },
  {
    id: "TRK-2849",
    sender: "Fresh Foods Market",
    receiver: "Mohammed Al-Riyami",
    status: "delivered" as const,
    driver: "Hamdan Al-Azri",
    zone: "Al Amerat",
    service: "Same Day",
    cost: 15.0,
  },
  {
    id: "TRK-2850",
    sender: "Desert Rose Trading",
    receiver: "Aisha Al-Harthi",
    status: "pending" as const,
    driver: "Unassigned",
    zone: "Bawshar",
    service: "Next Day",
    cost: 9.5,
  },
  {
    id: "TRK-2851",
    sender: "Gulf Pharma Co.",
    receiver: "Salim Al-Mukhaini",
    status: "failed" as const,
    driver: "Yousuf Al-Rashdi",
    zone: "Sohar",
    service: "Express",
    cost: 22.0,
  },
];

const deliveryPerformance = [
  { day: "Mon", onTime: 92, delayed: 8 },
  { day: "Tue", onTime: 88, delayed: 12 },
  { day: "Wed", onTime: 95, delayed: 5 },
  { day: "Thu", onTime: 90, delayed: 10 },
  { day: "Fri", onTime: 85, delayed: 15 },
  { day: "Sat", onTime: 93, delayed: 7 },
  { day: "Sun", onTime: 96, delayed: 4 },
];

const alerts = [
  {
    id: 1,
    type: "maintenance" as const,
    title: "Vehicle Maintenance Due",
    message: "OM-1234 (Toyota Hilux) is 500km overdue for service",
    severity: "high",
    icon: Wrench,
  },
  {
    id: 2,
    type: "delivery" as const,
    title: "Failed Delivery",
    message: "TRK-2851 - Customer not available at delivery address",
    severity: "high",
    icon: AlertTriangle,
  },
  {
    id: 3,
    type: "delivery" as const,
    title: "Delayed Shipment",
    message: "TRK-2847 - Traffic congestion on Sultan Qaboos Highway",
    severity: "medium",
    icon: Clock,
  },
  {
    id: 4,
    type: "maintenance" as const,
    title: "Tire Replacement",
    message: "OM-5678 - Front left tire needs replacement",
    severity: "low",
    icon: Wrench,
  },
];

export default function LogisticsOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Logistics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your logistics operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Map + Recent Shipments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Widget */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Active Vehicles
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                24 Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DeliveryMap className="h-[340px]" showVehicles />
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alerts
              </CardTitle>
              <Badge variant="destructive" className="text-xs">
                {alerts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`p-1.5 rounded-full shrink-0 ${
                    alert.severity === "high"
                      ? "bg-red-500/10 text-red-500"
                      : alert.severity === "medium"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  <alert.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart + Recent Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Performance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Delivery Performance
              </CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  On Time
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Delayed
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveryPerformance.map((day) => (
                <div key={day.day} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="w-8 font-medium">{day.day}</span>
                    <div className="flex-1 mx-3">
                      <div className="flex h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 transition-all"
                          style={{ width: `${day.onTime}%` }}
                        />
                        <div
                          className="bg-red-400 transition-all"
                          style={{ width: `${day.delayed}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-muted-foreground">
                      {day.onTime}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Average</span>
                <span className="text-lg font-bold text-emerald-600">
                  91.3%
                </span>
              </div>
              <Progress value={91.3} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Shipments Table */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Recent Shipments
              </CardTitle>
              <Link href="/dashboard/logistics/shipments">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tracking #</TableHead>
                  <TableHead className="text-xs">Receiver</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">
                    Cost
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentShipments.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    className="cursor-pointer hover:bg-accent/50"
                  >
                    <TableCell className="text-xs font-medium">
                      {shipment.id}
                    </TableCell>
                    <TableCell className="text-xs">
                      {shipment.receiver}
                    </TableCell>
                    <TableCell>
                      <ShipmentStatusBadge
                        status={shipment.status}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      OMR {shipment.cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
