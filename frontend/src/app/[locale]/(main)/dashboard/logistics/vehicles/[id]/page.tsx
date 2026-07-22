"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryMap } from "@/components/logistics/DeliveryMap";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  MapPin,
  Fuel,
  Gauge,
  Calendar,
  Wrench,
  FileText,
  Edit,
  Settings,
  Package,
  ClipboardList,
} from "lucide-react";

const vehicleData = {
  id: "v1",
  name: "Toyota Hilux",
  plateNumber: "OM-1234",
  type: "truck" as const,
  status: "active" as const,
  brand: "Toyota",
  model: "Hilux",
  year: 2023,
  color: "White",
  vin: "JTFLU71J9B5023456",
  capacity: "1,000 kg",
  fuelType: "Diesel",
  mileage: 45230,
  fuelLevel: 75,
  currentDriver: {
    id: "d1",
    name: "Khalid Bin Said",
    phone: "+968 9555 1234",
    license: "OM-DRV-2019-001",
  },
  zone: "Muscat",
  location: { lat: 23.588, lng: 58.3829 },
  lastMaintenance: "2024-12-01",
  nextMaintenance: "2025-02-01",
  maintenanceInterval: "5,000 km",
  insuranceExpiry: "2025-06-15",
  registrationExpiry: "2025-09-20",
};

const maintenanceHistory = [
  {
    id: 1,
    date: "2024-12-01",
    type: "Routine Service",
    description: "Oil change, filter replacement, brake inspection",
    cost: 85.0,
    workshop: "Toyota Service Center - Muscat",
    mileage: 42000,
  },
  {
    id: 2,
    date: "2024-09-15",
    type: "Tire Replacement",
    description: "Replaced all 4 tires",
    cost: 240.0,
    workshop: "Al Maha Tyres",
    mileage: 38000,
  },
  {
    id: 3,
    date: "2024-06-01",
    type: "Routine Service",
    description: "Oil change, air filter, coolant top-up",
    cost: 72.0,
    workshop: "Toyota Service Center - Muscat",
    mileage: 34000,
  },
  {
    id: 4,
    date: "2024-03-10",
    type: "Brake Repair",
    description: "Replaced brake pads and discs (front)",
    cost: 180.0,
    workshop: "Speed Service Garage",
    mileage: 30000,
  },
];

const assignedShipments = [
  {
    id: "TRK-2847",
    receiver: "Ahmed Al-Farsi",
    status: "in_transit" as const,
    zone: "Muscat",
    serviceType: "Express",
  },
  {
    id: "TRK-2860",
    receiver: "Nasser Al-Harthy",
    status: "pending" as const,
    zone: "Al Khuwair",
    serviceType: "Standard",
  },
  {
    id: "TRK-2861",
    receiver: "Maryam Al-Sheidi",
    status: "pending" as const,
    zone: "Qurum",
    serviceType: "Same Day",
  },
];

const documents = [
  { id: 1, name: "Vehicle Registration", type: "PDF", expiry: "2025-09-20" },
  { id: 2, name: "Insurance Policy", type: "PDF", expiry: "2025-06-15" },
  { id: 3, name: "Mulkiya (Vehicle Card)", type: "PDF", expiry: "2025-09-20" },
  { id: 4, name: "Fitness Certificate", type: "PDF", expiry: "2025-03-01" },
];

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/logistics/vehicles")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {vehicleData.name}
                </h1>
                <Badge
                  variant={
                    vehicleData.status === "active" ? "default" : "secondary"
                  }
                >
                  {vehicleData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {vehicleData.plateNumber} · {vehicleData.zone} ·{" "}
                {vehicleData.capacity}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Mileage</span>
            </div>
            <p className="text-xl font-bold">
              {vehicleData.mileage.toLocaleString()} km
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Fuel className="h-4 w-4" />
              <span className="text-xs">Fuel Level</span>
            </div>
            <p className="text-xl font-bold">{vehicleData.fuelLevel}%</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${vehicleData.fuelLevel}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Next Service</span>
            </div>
            <p className="text-xl font-bold">
              {new Date(vehicleData.nextMaintenance).toLocaleDateString("en-OM")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Active Shipments</span>
            </div>
            <p className="text-xl font-bold">{assignedShipments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Vehicle Info</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Brand</p>
                    <p className="text-sm font-medium">{vehicleData.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="text-sm font-medium">{vehicleData.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="text-sm font-medium">{vehicleData.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Color</p>
                    <p className="text-sm font-medium">{vehicleData.color}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">VIN</p>
                    <p className="text-sm font-mono">{vehicleData.vin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fuel Type</p>
                    <p className="text-sm font-medium">
                      {vehicleData.fuelType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-sm font-medium">
                      {vehicleData.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium capitalize">
                      {vehicleData.type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Driver */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Driver</CardTitle>
              </CardHeader>
              <CardContent>
                {vehicleData.currentDriver ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {vehicleData.currentDriver.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          License: {vehicleData.currentDriver.license}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {vehicleData.currentDriver.phone}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Driver Profile
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No driver assigned
                    </p>
                    <Button size="sm" className="mt-3">
                      Assign Driver
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <Card>
            <CardContent className="p-0">
              <DeliveryMap
                className="h-[450px] rounded-lg"
                pickup={{
                  lat: vehicleData.location.lat,
                  lng: vehicleData.location.lng,
                  label: vehicleData.name,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Maintenance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Mileage</TableHead>
                    <TableHead className="text-xs">Cost</TableHead>
                    <TableHead className="text-xs">Workshop</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceHistory.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">
                        {new Date(m.date).toLocaleDateString("en-OM")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">
                        {m.description}
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.mileage.toLocaleString()} km
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        OMR {m.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs">{m.workshop}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <TableHead className="text-xs">Zone</TableHead>
                    <TableHead className="text-xs">Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedShipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono font-medium">
                        {s.id}
                      </TableCell>
                      <TableCell className="text-xs">{s.receiver}</TableCell>
                      <TableCell>
                        <ShipmentStatusBadge status={s.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs">{s.zone}</TableCell>
                      <TableCell className="text-xs">{s.serviceType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehicle Documents</CardTitle>
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
                        Expires:{' '}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Name</Label>
              <Input defaultValue={vehicleData.name} />
            </div>
            <div className="space-y-2">
              <Label>Plate Number</Label>
              <Input defaultValue={vehicleData.plateNumber} />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" defaultValue={vehicleData.year} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input defaultValue={vehicleData.color} />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input defaultValue={vehicleData.capacity} />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Input defaultValue={vehicleData.fuelType} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditDialogOpen(false)}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
