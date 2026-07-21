"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Users,
  Star,
  Phone,
  MapPin,
  Truck,
  Eye,
  Edit,
  UserX,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DriverStatus = "all" | "active" | "offline" | "on_leave" | "suspended";
type DriverRating = "all" | "5" | "4" | "3" | "below";

interface Driver {
  id: string;
  name: string;
  employeeId: string;
  status: "active" | "offline" | "on_leave" | "suspended";
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  vehicle: string | null;
  zone: string;
  phone: string;
  joinDate: string;
  photo: string;
}

const drivers: Driver[] = [
  {
    id: "d1",
    name: "Khalid Bin Said",
    employeeId: "BHD-DRV-001",
    status: "active",
    rating: 4.8,
    totalDeliveries: 1247,
    completedDeliveries: 1195,
    vehicle: "OM-1234 (Toyota Hilux)",
    zone: "Muscat",
    phone: "+968 9555 1234",
    joinDate: "2021-03-15",
    photo: "",
  },
  {
    id: "d2",
    name: "Said Al-Habsi",
    employeeId: "BHD-DRV-002",
    status: "active",
    rating: 4.5,
    totalDeliveries: 982,
    completedDeliveries: 920,
    vehicle: "OM-5678 (Nissan Urvan)",
    zone: "Seeb",
    phone: "+968 9555 5678",
    joinDate: "2022-01-10",
    photo: "",
  },
  {
    id: "d3",
    name: "Hamdan Al-Azri",
    employeeId: "BHD-DRV-003",
    status: "active",
    rating: 4.9,
    totalDeliveries: 756,
    completedDeliveries: 735,
    vehicle: "OM-9012 (Honda Activa)",
    zone: "Qurum",
    phone: "+968 9555 9012",
    joinDate: "2023-06-01",
    photo: "",
  },
  {
    id: "d4",
    name: "Majid Al-Siyabi",
    employeeId: "BHD-DRV-004",
    status: "offline",
    rating: 4.2,
    totalDeliveries: 534,
    completedDeliveries: 498,
    vehicle: null,
    zone: "Al Khoud",
    phone: "+968 9555 3456",
    joinDate: "2022-08-20",
    photo: "",
  },
  {
    id: "d5",
    name: "Yousuf Al-Rashdi",
    employeeId: "BHD-DRV-005",
    status: "active",
    rating: 4.6,
    totalDeliveries: 890,
    completedDeliveries: 850,
    vehicle: "OM-2468 (Yamaha NMax)",
    zone: "Ruwi",
    phone: "+968 9555 7890",
    joinDate: "2021-11-05",
    photo: "",
  },
  {
    id: "d6",
    name: "Fahad Al-Balushi",
    employeeId: "BHD-DRV-006",
    status: "on_leave",
    rating: 4.3,
    totalDeliveries: 445,
    completedDeliveries: 420,
    vehicle: null,
    zone: "Al Amerat",
    phone: "+968 9555 2468",
    joinDate: "2023-02-14",
    photo: "",
  },
  {
    id: "d7",
    name: "Ibrahim Al-Zadjali",
    employeeId: "BHD-DRV-007",
    status: "suspended",
    rating: 3.1,
    totalDeliveries: 210,
    completedDeliveries: 175,
    vehicle: null,
    zone: "Bawshar",
    phone: "+968 9555 1357",
    joinDate: "2023-09-01",
    photo: "",
  },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500",
  offline: "bg-slate-400",
  on_leave: "bg-amber-500",
  suspended: "bg-red-500",
};

export default function DriversPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatus>("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || d.status === statusFilter;
    const matchesZone = zoneFilter === "all" || d.zone === zoneFilter;
    return matchesSearch && matchesStatus && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your delivery drivers
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Drivers</p>
            <p className="text-2xl font-bold">{drivers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Now</p>
            <p className="text-2xl font-bold text-emerald-600">
              {drivers.filter((d) => d.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">On Leave</p>
            <p className="text-2xl font-bold text-amber-600">
              {drivers.filter((d) => d.status === "on_leave").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Rating</p>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold">
                {(drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(1)}
              </p>
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DriverStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            <SelectItem value="Muscat">Muscat</SelectItem>
            <SelectItem value="Seeb">Seeb</SelectItem>
            <SelectItem value="Qurum">Qurum</SelectItem>
            <SelectItem value="Bawshar">Bawshar</SelectItem>
            <SelectItem value="Al Khoud">Al Khoud</SelectItem>
            <SelectItem value="Ruwi">Ruwi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs">Employee ID</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Rating</TableHead>
                <TableHead className="text-xs">Deliveries</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Zone</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() =>
                    router.push(`/dashboard/logistics/drivers/${driver.id}`)
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {driver.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {driver.phone}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {driver.employeeId}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          statusColors[driver.status]
                        )}
                      />
                      <span className="text-xs capitalize">
                        {driver.status.replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium">
                        {driver.rating}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-medium">
                        {driver.completedDeliveries}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {driver.totalDeliveries}
                      </span>
                    </div>
                    <div className="w-16 h-1 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${(driver.completedDeliveries / driver.totalDeliveries) * 100}%`,
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {driver.vehicle || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{driver.zone}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Register a new delivery driver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+968 XXXX XXXX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="email@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="muscat">Muscat</SelectItem>
                    <SelectItem value="seeb">Seeb</SelectItem>
                    <SelectItem value="qurum">Qurum</SelectItem>
                    <SelectItem value="bawshar">Bawshar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input placeholder="OM-DRV-XXXX" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddDialogOpen(false)}>Add Driver</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
