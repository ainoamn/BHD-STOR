"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  TrendingUp,
  Map,
  Shield,
} from "lucide-react";

interface Zone {
  id: string;
  name: string;
  code: string;
  coverage: number;
  pricingTier: "standard" | "premium" | "remote";
  shipments: number;
  drivers: number;
  avgDeliveryTime: number;
  active: boolean;
  coordinates: { lat: number; lng: number }[];
}

const zones: Zone[] = [
  {
    id: "z1",
    name: "Muscat Central",
    code: "MCT-01",
    coverage: 95,
    pricingTier: "standard",
    shipments: 4520,
    drivers: 18,
    avgDeliveryTime: 28,
    active: true,
    coordinates: [],
  },
  {
    id: "z2",
    name: "Seeb Coastal",
    code: "SEB-01",
    coverage: 88,
    pricingTier: "standard",
    shipments: 3210,
    drivers: 12,
    avgDeliveryTime: 35,
    active: true,
    coordinates: [],
  },
  {
    id: "z3",
    name: "Qurum West",
    code: "QUR-01",
    coverage: 92,
    pricingTier: "premium",
    shipments: 2890,
    drivers: 10,
    avgDeliveryTime: 22,
    active: true,
    coordinates: [],
  },
  {
    id: "z4",
    name: "Bawshar South",
    code: "BAW-01",
    coverage: 78,
    pricingTier: "standard",
    shipments: 1870,
    drivers: 8,
    avgDeliveryTime: 42,
    active: true,
    coordinates: [],
  },
  {
    id: "z5",
    name: "Sohar Industrial",
    code: "SOH-01",
    coverage: 65,
    pricingTier: "remote",
    shipments: 950,
    drivers: 5,
    avgDeliveryTime: 65,
    active: true,
    coordinates: [],
  },
  {
    id: "z6",
    name: "Salalah Coastal",
    code: "SAL-01",
    coverage: 55,
    pricingTier: "remote",
    shipments: 680,
    drivers: 4,
    avgDeliveryTime: 80,
    active: true,
    coordinates: [],
  },
];

const tierColors: Record<string, string> = {
  standard: "bg-blue-500",
  premium: "bg-amber-500",
  remote: "bg-purple-500",
};

export default function ZonesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);

  const filteredZones = zones.filter(
    (z) =>
      !searchQuery ||
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage delivery zones and coverage areas
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Zones</p>
            <p className="text-2xl font-bold">{zones.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Coverage</p>
            <p className="text-2xl font-bold">
              {Math.round(
                zones.reduce((s, z) => s + z.coverage, 0) / zones.length
              )}
              %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Drivers</p>
            <p className="text-2xl font-bold">
              {zones.reduce((s, z) => s + z.drivers, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Zones</p>
            <p className="text-2xl font-bold text-emerald-600">
              {zones.filter((z) => z.active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulated Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            Zone Coverage Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[300px] bg-gradient-to-br from-blue-50 via-emerald-50 to-amber-50 rounded-lg border overflow-hidden">
            {/* Simulated zone polygons */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300">
              {/* Muscat Central */}
              <polygon
                points="200,80 320,60 340,140 280,160 180,130"
                fill="rgba(59,130,246,0.2)"
                stroke="rgb(59,130,246)"
                strokeWidth="2"
              />
              <text x="250" y="110" className="text-xs font-medium fill-blue-700">
                Muscat Central
              </text>
              {/* Seeb */}
              <polygon
                points="320,60 460,50 480,120 400,140 340,140"
                fill="rgba(34,197,94,0.2)"
                stroke="rgb(34,197,94)"
                strokeWidth="2"
              />
              <text x="390" y="100" className="text-xs font-medium fill-green-700">
                Seeb
              </text>
              {/* Qurum */}
              <polygon
                points="180,130 280,160 260,220 160,200 140,150"
                fill="rgba(245,158,11,0.2)"
                stroke="rgb(245,158,11)"
                strokeWidth="2"
              />
              <text x="200" y="175" className="text-xs font-medium fill-amber-700">
                Qurum
              </text>
              {/* Bawshar */}
              <polygon
                points="280,160 400,140 420,210 300,230 260,220"
                fill="rgba(99,102,241,0.2)"
                stroke="rgb(99,102,241)"
                strokeWidth="2"
              />
              <text x="330" y="185" className="text-xs font-medium fill-indigo-700">
                Bawshar
              </text>
              {/* Hubs */}
              <circle cx="270" cy="115" r="5" fill="rgb(239,68,68)" />
              <circle cx="400" cy="100" r="5" fill="rgb(239,68,68)" />
              <circle cx="350" cy="180" r="5" fill="rgb(239,68,68)" />
            </svg>
            <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg p-2 text-[10px] shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Zone</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredZones.map((zone) => (
          <Card key={zone.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{zone.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {zone.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditZone(zone)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={`${tierColors[zone.pricingTier]} text-white text-[10px]`}>
                    {zone.pricingTier}
                  </Badge>
                  {zone.active ? (
                    <Badge
                      variant="outline"
                      className="text-emerald-600 border-emerald-200 text-[10px]"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-[10px]"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">{zone.coverage}%</span>
                  </div>
                  <Progress value={zone.coverage} className="h-1.5" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-1.5 rounded bg-muted">
                    <p className="text-xs font-medium">
                      {zone.shipments.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Shipments
                    </p>
                  </div>
                  <div className="p-1.5 rounded bg-muted">
                    <p className="text-xs font-medium">{zone.drivers}</p>
                    <p className="text-[9px] text-muted-foreground">Drivers</p>
                  </div>
                  <div className="p-1.5 rounded bg-muted">
                    <p className="text-xs font-medium">
                      {zone.avgDeliveryTime}m
                    </p>
                    <p className="text-[9px] text-muted-foreground">Avg Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Zone Dialog */}
      <Dialog
        open={addDialogOpen || !!editZone}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditZone(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editZone ? "Edit Zone" : "Add New Zone"}
            </DialogTitle>
            <DialogDescription>
              {editZone
                ? "Update zone details and coverage"
                : "Create a new delivery zone"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone Name</Label>
                <Input
                  defaultValue={editZone?.name}
                  placeholder="e.g. Muscat Central"
                />
              </div>
              <div className="space-y-2">
                <Label>Zone Code</Label>
                <Input
                  defaultValue={editZone?.code}
                  placeholder="e.g. MCT-01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pricing Tier</Label>
              <Select defaultValue={editZone?.pricingTier || "standard"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coverage Area (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={editZone?.coverage || "80"}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setEditZone(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddDialogOpen(false);
                setEditZone(null);
              }}
            >
              {editZone ? "Save Changes" : "Add Zone"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
