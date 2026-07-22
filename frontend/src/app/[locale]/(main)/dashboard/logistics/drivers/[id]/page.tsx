"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Star,
  Phone,
  Mail,
  MapPin,
  Truck,
  Package,
  TrendingUp,
  Clock,
  Calendar,
  Coins,
  FileText,
  Radio,
  Edit,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

const driverData = {
  id: "d1",
  name: "Khalid Bin Said",
  employeeId: "BHD-DRV-001",
  status: "active" as const,
  phone: "+968 9555 1234",
  email: "khalid.said@bhd.om",
  joinDate: "2021-03-15",
  license: "OM-DRV-2019-001",
  licenseExpiry: "2026-03-15",
  zone: "Muscat",
  address: "House 12, Block 3, Al Khuwair, Muscat",
  nationality: "Omani",
  dateOfBirth: "1990-06-20",
  emergencyContact: "+968 9555 9999",
};

const performance = {
  totalDeliveries: 1247,
  completedThisMonth: 89,
  onTimeRate: 94.2,
  rating: 4.8,
  totalEarnings: 18450,
  avgDeliveryTime: 28,
  customerComplaints: 3,
  customerCompliments: 45,
};

const vehicle = {
  id: "v1",
  name: "Toyota Hilux",
  plate: "OM-1234",
  type: "truck" as const,
};

const shipments = [
  {
    id: "TRK-2847",
    receiver: "Ahmed Al-Farsi",
    status: "in_transit" as const,
    zone: "Muscat",
    service: "Express",
    pickupTime: "09:15 AM",
    estimatedDelivery: "02:30 PM",
  },
  {
    id: "TRK-2860",
    receiver: "Nasser Al-Harthy",
    status: "pending" as const,
    zone: "Al Khuwair",
    service: "Standard",
    pickupTime: "10:00 AM",
    estimatedDelivery: "04:00 PM",
  },
  {
    id: "TRK-2861",
    receiver: "Maryam Al-Sheidi",
    status: "pending" as const,
    zone: "Qurum",
    service: "Same Day",
    pickupTime: "11:30 AM",
    estimatedDelivery: "03:00 PM",
  },
];

const earnings = [
  { month: "Jan 2025", deliveries: 89, earnings: 1250, bonus: 100 },
  { month: "Dec 2024", deliveries: 95, earnings: 1380, bonus: 150 },
  { month: "Nov 2024", deliveries: 82, earnings: 1100, bonus: 75 },
  { month: "Oct 2024", deliveries: 101, earnings: 1450, bonus: 200 },
  { month: "Sep 2024", deliveries: 88, earnings: 1180, bonus: 50 },
  { month: "Aug 2024", deliveries: 93, earnings: 1320, bonus: 125 },
];

const schedule = [
  { day: "Sunday", start: "08:00", end: "17:00", off: false },
  { day: "Monday", start: "08:00", end: "17:00", off: false },
  { day: "Tuesday", start: "08:00", end: "17:00", off: false },
  { day: "Wednesday", start: "08:00", end: "17:00", off: false },
  { day: "Thursday", start: "08:00", end: "14:00", off: false },
  { day: "Friday", start: "", end: "", off: true },
  { day: "Saturday", start: "", end: "", off: true },
];

const documents = [
  { id: 1, name: "Driver License", type: "PDF", expiry: "2026-03-15" },
  { id: 2, name: "Passport Copy", type: "PDF", expiry: "2028-01-20" },
  { id: 3, name: "Residency Card", type: "PDF", expiry: "2026-03-15" },
  { id: 4, name: "Medical Certificate", type: "PDF", expiry: "2025-06-15" },
  { id: 5, name: "Police Clearance", type: "PDF", expiry: "2025-12-20" },
];

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/logistics/drivers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-primary">
                {driverData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {driverData.name}
                </h1>
                <Badge
                  variant={
                    driverData.status === "active" ? "default" : "secondary"
                  }
                >
                  {driverData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {driverData.employeeId} · {driverData.zone}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/logistics/drivers/${driverData.id}/live`)
            }
          >
            <Radio className="h-4 w-4 mr-2" />
            Live Track
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Deliveries</span>
            </div>
            <p className="text-2xl font-bold">
              {performance.totalDeliveries}
            </p>
            <p className="text-xs text-muted-foreground">
              {performance.completedThisMonth} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs">Rating</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold">{performance.rating}</p>
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {performance.customerCompliments} compliments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">On-Time Rate</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {performance.onTimeRate}%
            </p>
            <Progress value={performance.onTimeRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-xs">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold">
              OMR {performance.totalEarnings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              OMR {earnings[0].earnings + earnings[0].bonus} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium">{driverData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Employee ID
                    </p>
                    <p className="text-sm font-mono">
                      {driverData.employeeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm">{driverData.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{driverData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Date of Birth
                    </p>
                    <p className="text-sm">
                      {new Date(driverData.dateOfBirth).toLocaleDateString(
                        "en-OM"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Nationality
                    </p>
                    <p className="text-sm">{driverData.nationality}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Join Date
                    </p>
                    <p className="text-sm">
                      {new Date(driverData.joinDate).toLocaleDateString(
                        "en-OM"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      License Expiry
                    </p>
                    <p className="text-sm">
                      {new Date(driverData.licenseExpiry).toLocaleDateString(
                        "en-OM"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{driverData.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Zone</p>
                  <p className="text-sm">{driverData.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Emergency Contact
                  </p>
                  <p className="text-sm">{driverData.emergencyContact}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vehicle Tab */}
        <TabsContent value="vehicle">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{vehicle.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.plate} · {vehicle.type}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/logistics/vehicles/${vehicle.id}`)
                  }
                >
                  View Vehicle
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tracking #</TableHead>
                    <TableHead className="text-xs">Receiver</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Service</TableHead>
                    <TableHead className="text-xs">Pickup</TableHead>
                    <TableHead className="text-xs">Est. Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono font-medium">
                        {s.id}
                      </TableCell>
                      <TableCell className="text-xs">{s.receiver}</TableCell>
                      <TableCell>
                        <ShipmentStatusBadge status={s.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs">{s.service}</TableCell>
                      <TableCell className="text-xs">{s.pickupTime}</TableCell>
                      <TableCell className="text-xs">
                        {s.estimatedDelivery}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Earnings History (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Month</TableHead>
                    <TableHead className="text-xs">Deliveries</TableHead>
                    <TableHead className="text-xs">Base Earnings</TableHead>
                    <TableHead className="text-xs">Bonus</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((e) => (
                    <TableRow key={e.month}>
                      <TableCell className="text-xs font-medium">
                        {e.month}
                      </TableCell>
                      <TableCell className="text-xs">
                        {e.deliveries}
                      </TableCell>
                      <TableCell className="text-xs">
                        OMR {e.earnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-emerald-600">
                        +OMR {e.bonus.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        OMR {(e.earnings + e.bonus).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Work Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {schedule.map((s) => (
                  <div
                    key={s.day}
                    className={`p-4 rounded-lg border text-center ${
                      s.off
                        ? "bg-muted/50"
                        : "bg-card hover:bg-accent/50 transition-colors"
                    }`}
                  >
                    <p className="text-sm font-medium mb-2">{s.day}</p>
                    {s.off ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Off
                      </Badge>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {s.start}
                        </p>
                        <p className="text-xs text-muted-foreground">to</p>
                        <p className="text-xs text-muted-foreground">
                          {s.end}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Driver Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires:{" "}
                        {new Date(doc.expiry).toLocaleDateString("en-OM")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {doc.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
