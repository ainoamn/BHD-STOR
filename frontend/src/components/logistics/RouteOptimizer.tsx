"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/switch";
import { RouteMap } from "@/components/logistics/RouteMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Calendar,
  User,
  Truck,
  MapPin,
  Clock,
  Navigation,
  Package,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteOptimizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimize?: (route: any) => void;
}

const drivers = [
  { id: "d1", name: "Khalid Bin Said", zone: "Muscat" },
  { id: "d2", name: "Said Al-Habsi", zone: "Seeb" },
  { id: "d3", name: "Hamdan Al-Azri", zone: "Qurum" },
  { id: "d4", name: "Majid Al-Siyabi", zone: "Al Khoud" },
  { id: "d5", name: "Yousuf Al-Rashdi", zone: "Ruwi" },
];

const vehicles = [
  { id: "v1", name: "Toyota Hilux", plate: "OM-1234", capacity: "1000 kg" },
  { id: "v2", name: "Nissan Urvan", plate: "OM-5678", capacity: "800 kg" },
  { id: "v3", name: "Honda Activa", plate: "OM-9012", capacity: "30 kg" },
  { id: "v5", name: "Toyota Camry", plate: "OM-7890", capacity: "200 kg" },
];

const pendingShipments = [
  { id: "TRK-2850", address: "Bawshar Heights", zone: "Bawshar", weight: 0.8 },
  { id: "TRK-2853", address: "Carrefour, Qurum", zone: "Qurum", weight: 8.5 },
  { id: "TRK-2860", address: "Al Khoud University", zone: "Al Khoud", weight: 5.0 },
  { id: "TRK-2861", address: "Ghala Industrial Area", zone: "Ghala", weight: 12.0 },
  { id: "TRK-2863", address: "Muttrah Souk", zone: "Muttrah", weight: 2.5 },
];

export function RouteOptimizer({
  open,
  onOpenChange,
  onOptimize,
}: RouteOptimizerProps) {
  const [step, setStep] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedShipments, setSelectedShipments] = useState<string[]>(
    pendingShipments.map((s) => s.id)
  );
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  const toggleShipment = (id: string) => {
    setSelectedShipments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      setOptimized(true);
      setStep(3);
    }, 2000);
  };

  const handleCreate = () => {
    onOpenChange(false);
    setStep(1);
    setOptimized(false);
    onOptimize?.({ driver: selectedDriver, vehicle: selectedVehicle });
  };

  const optimizedStops = [
    { lat: 23.6105, lng: 58.445, label: "Start", type: "start" },
    { lat: 23.615, lng: 58.46, label: "TRK-2853", type: "pickup" },
    { lat: 23.605, lng: 58.47, label: "TRK-2863", type: "pickup" },
    { lat: 23.6, lng: 58.48, label: "TRK-2861", type: "delivery" },
    { lat: 23.59, lng: 58.49, label: "TRK-2860", type: "delivery" },
    { lat: 23.585, lng: 58.5, label: "TRK-2850", type: "delivery" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {step === 3 ? "Optimized Route" : "Create Route"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select driver, vehicle, and date for the route."}
            {step === 2 && "Select shipments to include in the route."}
            {step === 3 && "Review the optimized route before saving."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver</Label>
                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {d.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select
                  value={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <Truck className="h-3 w-3" />
                          {v.name} ({v.plate})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm">Auto-assign pending shipments</span>
              </div>
              <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
            </div>
          </div>
        )}

        {/* Step 2: Select Shipments */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Pending Shipments ({pendingShipments.length})
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedShipments.length} selected
              </span>
            </div>
            <div className="space-y-2">
              {pendingShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  onClick={() => toggleShipment(shipment.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedShipments.includes(shipment.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      selectedShipments.includes(shipment.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {selectedShipments.includes(shipment.id) && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium">
                        {shipment.id}
                      </span>
                      <Badge variant="outline" className="text-[9px]">
                        {shipment.weight} kg
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shipment.address} · {shipment.zone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Optimized Route Preview */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-emerald-700">
                Route optimized! Saved 23 minutes and 4.2 km.
              </span>
            </div>

            <RouteMap
              className="h-[250px]"
              stops={optimizedStops.map((s) => ({
                lat: s.lat,
                lng: s.lng,
                label: s.label,
                completed: s.type === "start",
              }))}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted text-center">
                <Navigation className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">28.5 km</p>
                <p className="text-[10px] text-muted-foreground">Distance</p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">2h 15m</p>
                <p className="text-[10px] text-muted-foreground">Est. Time</p>
              </div>
              <div className="p-3 rounded-lg bg-muted text-center">
                <Package className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">
                  {selectedShipments.length}
                </p>
                <p className="text-[10px] text-muted-foreground">Stops</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Optimized Stop Order</p>
              {optimizedStops.slice(1).map((stop, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg border"
                >
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{stop.label}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto">
                    {stop.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) onOpenChange(false);
              else setStep((s) => s - 1);
            }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 2 && (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!selectedDriver || !selectedVehicle}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={handleOptimize}
              disabled={selectedShipments.length === 0 || optimizing}
            >
              {optimizing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Route
                </>
              )}
            </Button>
          )}
          {step === 3 && <Button onClick={handleCreate}>Create Route</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
