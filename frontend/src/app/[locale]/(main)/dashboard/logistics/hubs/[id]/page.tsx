"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShipmentStatusBadge } from "@/components/logistics/ShipmentStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Phone,
  User,
  Clock,
  Package,
  Gauge,
  Users,
  Truck,
  TrendingUp,
} from "lucide-react";

const hubData = {
  id: "h1",
  name: "Muscat Main Hub",
  type: "main" as const,
  address: "Industrial Area, Mina Al Fahal, Muscat",
  zone: "Muscat",
  capacity: 5000,
  currentLoad: 3420,
  phone: "+968 2470 1234",
  manager: "Abdullah Al-Rashdi",
  operatingHours: "24/7",
  employees: 24,
  vehicles: 12,
  monthlyThroughput: 15600,
};

const shipmentsAtHub = [
  { id: "TRK-2847", sender: "Oman Electronics", receiver: "Ahmed Al-Farsi", status: "in_transit" as const, zone: "Muscat", arrivedAt: "08:30 AM" },
  { id: "TRK-2850", sender: "Desert Rose Trading", receiver: "Aisha Al-Harthi", status: "pending" as const, zone: "Bawshar", arrivedAt: "09:15 AM" },
  { id: "TRK-2853", sender: "Carrefour Oman", receiver: "Laila Al-Zadjali", status: "pending" as const, zone: "Qurum", arrivedAt: "09:45 AM" },
  { id: "TRK-2860", sender: "SQU", receiver: "Dr. Nasser Al-Harthy", status: "pending" as const, zone: "Al Khoud", arrivedAt: "10:00 AM" },
  { id: "TRK-2862", sender: "Oman Pharma Ltd", receiver: "Dr. Fatima Al-Said", status: "in_transit" as const, zone: "Madinat SQ", arrivedAt: "10:30 AM" },
];

const capacityData = [
  { time: "00:00", load: 1200 },
  { time: "04:00", load: 1500 },
  { time: "08:00", load: 2800 },
  { time: "12:00", load: 3420 },
  { time: "16:00", load: 2900 },
  { time: "20:00", load: 1800 },
];

export default function HubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utilization = (hubData.currentLoad / hubData.capacity) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {hubData.name}
                </h1>
                <Badge>
                  {hubData.type === "main"
                    ? "Main Hub"
                    : hubData.type === "sub"
                      ? "Sub Hub"
                      : "Micro Hub"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {hubData.address}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Phone className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Current Load</span>
            </div>
            <p className="text-2xl font-bold">
              {hubData.currentLoad.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Utilization</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                utilization > 80
                  ? "text-red-500"
                  : utilization > 60
                    ? "text-amber-500"
                    : "text-emerald-500"
              }`}
            >
              {Math.round(utilization)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Employees</span>
            </div>
            <p className="text-2xl font-bold">{hubData.employees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Monthly</span>
            </div>
            <p className="text-2xl font-bold">
              {(hubData.monthlyThroughput / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shipments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="hours">Operating Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Shipments at Hub ({shipmentsAtHub.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tracking #</TableHead>
                    <TableHead className="text-xs">Sender</TableHead>
                    <TableHead className="text-xs">Receiver</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Zone</TableHead>
                    <TableHead className="text-xs">Arrived</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipmentsAtHub.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono font-medium">
                        {s.id}
                      </TableCell>
                      <TableCell className="text-xs max-w-[140px] truncate">
                        {s.sender}
                      </TableCell>
                      <TableCell className="text-xs max-w-[140px] truncate">
                        {s.receiver}
                      </TableCell>
                      <TableCell>
                        <ShipmentStatusBadge status={s.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs">{s.zone}</TableCell>
                      <TableCell className="text-xs">{s.arrivedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Capacity Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Capacity
                  </p>
                  <p className="text-3xl font-bold">
                    {hubData.capacity.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">packages</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Current Load
                  </p>
                  <p className="text-3xl font-bold">
                    {hubData.currentLoad.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(utilization)}% utilized
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Utilization</span>
                  <span
                    className={`text-sm font-medium ${
                      utilization > 80
                        ? "text-red-500"
                        : utilization > 60
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {Math.round(utilization)}%
                  </span>
                </div>
                <Progress value={utilization} className="h-3" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Daily Load Distribution
                </p>
                {capacityData.map((d) => (
                  <div key={d.time} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="w-12">{d.time}</span>
                      <div className="flex-1 mx-3">
                        <Progress
                          value={(d.load / hubData.capacity) * 100}
                          className="h-2"
                        />
                      </div>
                      <span className="w-16 text-right text-muted-foreground">
                        {d.load.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operating Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-4 rounded-lg border text-center"
                    >
                      <p className="text-sm font-medium mb-2">{day}</p>
                      {hubData.operatingHours === "24/7" || day !== "Fri" ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {hubData.operatingHours === "24/7"
                              ? "Open"
                              : "06:00"}
                          </p>
                          {hubData.operatingHours !== "24/7" && (
                            <p className="text-xs text-muted-foreground">
                              to 22:00
                            </p>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Reduced
                        </Badge>
                      )}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
