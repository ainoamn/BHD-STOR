"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { VehicleCard } from "@/components/logistics/VehicleCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Truck,
  Car,
  Bike,
  Wrench,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";

type VehicleType = "all" | "truck" | "van" | "bike" | "car";
type VehicleStatus = "all" | "active" | "maintenance" | "inactive";

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: "truck" | "van" | "bike" | "car";
  status: "active" | "maintenance" | "inactive";
  currentDriver: string | null;
  zone: string;
  lastMaintenance: string;
  nextMaintenance: string;
  mileage: number;
  fuelLevel: number;
  capacity: string;
}

const vehicles: Vehicle[] = [
  {
    id: "v1",
    name: "Toyota Hilux",
    plateNumber: "OM-1234",
    type: "truck",
    status: "active",
    currentDriver: "Khalid Bin Said",
    zone: "Muscat",
    lastMaintenance: "2024-12-01",
    nextMaintenance: "2025-02-01",
    mileage: 45230,
    fuelLevel: 75,
    capacity: "1,000 kg",
  },
  {
    id: "v2",
    name: "Nissan Urvan",
    plateNumber: "OM-5678",
    type: "van",
    status: "active",
    currentDriver: "Said Al-Habsi",
    zone: "Seeb",
    lastMaintenance: "2025-01-05",
    nextMaintenance: "2025-03-05",
    mileage: 32150,
    fuelLevel: 60,
    capacity: "800 kg",
  },
  {
    id: "v3",
    name: "Honda Activa",
    plateNumber: "OM-9012",
    type: "bike",
    status: "active",
    currentDriver: "Hamdan Al-Azri",
    zone: "Qurum",
    lastMaintenance: "2025-01-10",
    nextMaintenance: "2025-04-10",
    mileage: 12500,
    fuelLevel: 90,
    capacity: "30 kg",
  },
  {
    id: "v4",
    name: "Mitsubishi Canter",
    plateNumber: "OM-3456",
    type: "truck",
    status: "maintenance",
    currentDriver: null,
    zone: "Bawshar",
    lastMaintenance: "2024-11-15",
    nextMaintenance: "2025-01-15",
    mileage: 67800,
    fuelLevel: 20,
    capacity: "3,000 kg",
  },
  {
    id: "v5",
    name: "Toyota Camry",
    plateNumber: "OM-7890",
    type: "car",
    status: "active",
    currentDriver: "Majid Al-Siyabi",
    zone: "Al Khoud",
    lastMaintenance: "2025-01-08",
    nextMaintenance: "2025-07-08",
    mileage: 28900,
    fuelLevel: 45,
    capacity: "200 kg",
  },
  {
    id: "v6",
    name: "Yamaha NMax",
    plateNumber: "OM-2468",
    type: "bike",
    status: "active",
    currentDriver: "Yousuf Al-Rashdi",
    zone: "Ruwi",
    lastMaintenance: "2024-12-20",
    nextMaintenance: "2025-03-20",
    mileage: 8900,
    fuelLevel: 55,
    capacity: "25 kg",
  },
  {
    id: "v7",
    name: "Isuzu NPR",
    plateNumber: "OM-1357",
    type: "truck",
    status: "inactive",
    currentDriver: null,
    zone: "Sohar",
    lastMaintenance: "2024-10-01",
    nextMaintenance: "2025-01-01",
    mileage: 95400,
    fuelLevel: 10,
    capacity: "5,000 kg",
  },
  {
    id: "v8",
    name: "Hyundai H1",
    plateNumber: "OM-8642",
    type: "van",
    status: "active",
    currentDriver: "Fahad Al-Balushi",
    zone: "Al Amerat",
    lastMaintenance: "2025-01-12",
    nextMaintenance: "2025-04-12",
    mileage: 18700,
    fuelLevel: 80,
    capacity: "600 kg",
  },
];

const typeIcons: Record<string, typeof Truck> = {
  truck: Truck,
  van: Car,
  bike: Bike,
  car: Car,
};

export default function VehiclesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<VehicleType>("all");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus>("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || v.status === statusFilter;
    const matchesZone = zoneFilter === "all" || v.zone === zoneFilter;
    return matchesSearch && matchesType && matchesStatus && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your delivery vehicles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Vehicles</p>
            <p className="text-2xl font-bold">{vehicles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">
              {vehicles.filter((v) => v.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Maintenance</p>
            <p className="text-2xl font-bold text-amber-600">
              {vehicles.filter((v) => v.status === "maintenance").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {vehicles.filter((v) => v.status === "inactive").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as VehicleType)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="truck">Truck</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="bike">Bike</SelectItem>
            <SelectItem value="car">Car</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as VehicleStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
            <SelectItem value="Ruwi">Ruwi</SelectItem>
            <SelectItem value="Sohar">Sohar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={() =>
                router.push(`/dashboard/logistics/vehicles/${vehicle.id}`)
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() =>
                    router.push(`/dashboard/logistics/vehicles/${vehicle.id}`)
                  }
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{vehicle.name}</p>
                      <Badge
                        variant={
                          vehicle.status === "active"
                            ? "default"
                            : vehicle.status === "maintenance"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.plateNumber} · {vehicle.zone} · {vehicle.capacity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs">
                      {vehicle.currentDriver || "Unassigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.mileage.toLocaleString()} km
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No vehicles found</p>
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Register a new vehicle to your fleet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Name</Label>
                <Input placeholder="e.g. Toyota Hilux" />
              </div>
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input placeholder="e.g. OM-1234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input placeholder="e.g. 1000 kg" />
              </div>
            </div>
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddDialogOpen(false)}>Add Vehicle</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
