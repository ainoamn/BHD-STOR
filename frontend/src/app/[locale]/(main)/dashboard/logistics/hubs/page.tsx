"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Warehouse,
  Plus,
  MapPin,
  Phone,
  Package,
  Users,
  Gauge,
  PhoneCall,
} from "lucide-react";

interface Hub {
  id: string;
  name: string;
  type: "main" | "sub" | "micro";
  address: string;
  zone: string;
  capacity: number;
  currentLoad: number;
  phone: string;
  manager: string;
  operatingHours: string;
}

const hubs: Hub[] = [
  {
    id: "h1",
    name: "Muscat Main Hub",
    type: "main",
    address: "Industrial Area, Mina Al Fahal, Muscat",
    zone: "Muscat",
    capacity: 5000,
    currentLoad: 3420,
    phone: "+968 2470 1234",
    manager: "Abdullah Al-Rashdi",
    operatingHours: "24/7",
  },
  {
    id: "h2",
    name: "Seeb Sub Hub",
    type: "sub",
    address: "Al Hail North, Seeb",
    zone: "Seeb",
    capacity: 2000,
    currentLoad: 1280,
    phone: "+968 2470 5678",
    manager: "Salim Al-Habsi",
    operatingHours: "06:00 - 22:00",
  },
  {
    id: "h3",
    name: "Qurum Micro Hub",
    type: "micro",
    address: "Qurum Commercial Area",
    zone: "Qurum",
    capacity: 500,
    currentLoad: 380,
    phone: "+968 2470 9012",
    manager: "Fatima Al-Zadjali",
    operatingHours: "08:00 - 20:00",
  },
  {
    id: "h4",
    name: "Bawshar Sub Hub",
    type: "sub",
    address: "Bawshar Industrial Area",
    zone: "Bawshar",
    capacity: 1500,
    currentLoad: 950,
    phone: "+968 2470 3456",
    manager: "Hamed Al-Siyabi",
    operatingHours: "06:00 - 22:00",
  },
  {
    id: "h5",
    name: "Sohar Main Hub",
    type: "main",
    address: "Sohar Industrial Port Area",
    zone: "Sohar",
    capacity: 3500,
    currentLoad: 2100,
    phone: "+968 2685 1234",
    manager: "Mariam Al-Riyami",
    operatingHours: "24/7",
  },
  {
    id: "h6",
    name: "Salalah Hub",
    type: "sub",
    address: "Raysut Industrial Area, Salalah",
    zone: "Salalah",
    capacity: 2500,
    currentLoad: 890,
    phone: "+968 2321 5678",
    manager: "Yousuf Al-Khalili",
    operatingHours: "06:00 - 22:00",
  },
];

const typeColors: Record<string, string> = {
  main: "bg-primary",
  sub: "bg-blue-500",
  micro: "bg-slate-500",
};

const typeLabels: Record<string, string> = {
  main: "Main Hub",
  sub: "Sub Hub",
  micro: "Micro Hub",
};

export default function HubsPage() {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hubs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage logistics hubs and warehouses
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Hub
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Hubs</p>
            <p className="text-2xl font-bold">{hubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Main Hubs</p>
            <p className="text-2xl font-bold text-primary">
              {hubs.filter((h) => h.type === "main").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Capacity</p>
            <p className="text-2xl font-bold">
              {hubs.reduce((s, h) => s + h.capacity, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Load</p>
            <p className="text-2xl font-bold text-amber-600">
              {Math.round(
                (hubs.reduce((s, h) => s + h.currentLoad, 0) /
                  hubs.reduce((s, h) => s + h.capacity, 0)) *
                  100
              )}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hubs.map((hub) => {
          const utilization = (hub.currentLoad / hub.capacity) * 100;
          return (
            <Card
              key={hub.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(`/dashboard/logistics/hubs/${hub.id}`)
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{hub.name}</p>
                      <Badge
                        className={`text-[9px] ${typeColors[hub.type]} text-white`}
                      >
                        {typeLabels[hub.type]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{hub.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{hub.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {hub.currentLoad.toLocaleString()} /{" "}
                      {hub.capacity.toLocaleString()}
                    </span>
                    <span
                      className={`font-medium ${
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
                  <Progress value={utilization} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Hub Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Hub</DialogTitle>
            <DialogDescription>
              Create a new logistics hub or warehouse
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hub Name</Label>
              <Input placeholder="Enter hub name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Hub</SelectItem>
                    <SelectItem value="sub">Sub Hub</SelectItem>
                    <SelectItem value="micro">Micro Hub</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="sohar">Sohar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" placeholder="Packages" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+968 XXXX XXXX" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddDialogOpen(false)}>Add Hub</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
