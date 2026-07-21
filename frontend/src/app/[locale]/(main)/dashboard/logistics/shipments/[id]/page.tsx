"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShipmentStatusBadge } from "@/components/logistics/ShipmentStatusBadge";
import { ShipmentTimeline } from "@/components/logistics/ShipmentTimeline";
import { DeliveryMap } from "@/components/logistics/DeliveryMap";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Printer,
  Edit,
  MessageSquare,
  Phone,
  MapPin,
  User,
  Package,
  Weight,
  Ruler,
  Coins,
  ClipboardList,
  Camera,
  PenLine,
  Send,
  Calendar,
  Truck,
} from "lucide-react";

const shipmentData = {
  id: "2847",
  trackingNumber: "TRK-2847",
  status: "in_transit" as const,
  serviceType: "Express",
  createdAt: "2025-01-15T08:30:00Z",
  estimatedDelivery: "2025-01-16T14:00:00Z",

  sender: {
    name: "Oman Electronics LLC",
    contactPerson: "Rashid Al-Kiyumi",
    phone: "+968 9123 4567",
    email: "operations@omanelectronics.om",
    address: "Building 47, Way 2901, Al Khuwair, Muscat",
    lat: 23.588,
    lng: 58.3829,
  },

  receiver: {
    name: "Ahmed Al-Farsi",
    phone: "+968 9876 5432",
    email: "ahmed.alfarsi@email.om",
    address: "Villa 12, Al Shatti, Qurum, Muscat",
    lat: 23.6156,
    lng: 58.4731,
  },

  package: {
    weight: 3.5,
    length: 30,
    width: 20,
    height: 15,
    pieces: 1,
    value: 150.0,
    description: "Electronic components - fragile",
  },

  pricing: {
    baseRate: 5.0,
    weightCharge: 5.25,
    serviceCharge: 2.25,
    total: 12.5,
    codAmount: 0,
  },

  driver: {
    id: "d1",
    name: "Khalid Bin Said",
    phone: "+968 9555 1234",
    photo: "",
    vehicle: "OM-1234",
    rating: 4.8,
  },

  timeline: [
    {
      status: "Shipment Created",
      timestamp: "2025-01-15T08:30:00Z",
      location: "Muscat Hub",
      completed: true,
      icon: "create",
    },
    {
      status: "Picked Up",
      timestamp: "2025-01-15T09:15:00Z",
      location: "Al Khuwair, Muscat",
      completed: true,
      icon: "pickup",
    },
    {
      status: "In Transit",
      timestamp: "2025-01-15T10:30:00Z",
      location: "En route to Qurum",
      completed: true,
      icon: "transit",
    },
    {
      status: "Out for Delivery",
      timestamp: "",
      location: "",
      completed: false,
      icon: "delivery",
    },
    {
      status: "Delivered",
      timestamp: "",
      location: "",
      completed: false,
      icon: "delivered",
    },
  ],

  deliveryProof: {
    signature: true,
    photo: true,
    notes: "",
  },

  internalNotes: [
    {
      id: 1,
      author: "Omar Al-Habsi",
      timestamp: "2025-01-15T09:00:00Z",
      text: "Customer requested afternoon delivery. Contact before arriving.",
    },
    {
      id: 2,
      author: "System",
      timestamp: "2025-01-15T10:30:00Z",
      text: "Auto-assigned to driver Khalid Bin Said (nearest available).",
    },
  ],
};

const drivers = [
  { id: "d1", name: "Khalid Bin Said" },
  { id: "d2", name: "Said Al-Habsi" },
  { id: "d3", name: "Hamdan Al-Azri" },
  { id: "d4", name: "Majid Al-Siyabi" },
];

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newNote, setNewNote] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(shipmentData.driver.id);
  const [showAssignDriver, setShowAssignDriver] = useState(false);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/logistics/shipments")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {shipmentData.trackingNumber}
              </h1>
              <ShipmentStatusBadge status={shipmentData.status} />
              <Badge variant="outline">{shipmentData.serviceType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created{" "}
              {new Date(shipmentData.createdAt).toLocaleString("en-OM")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sender & Receiver Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Sender Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    {shipmentData.sender.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipmentData.sender.contactPerson}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {shipmentData.sender.phone}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <span>{shipmentData.sender.address}</span>
                </div>
              </CardContent>
            </Card>

            {/* Receiver */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Receiver Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    {shipmentData.receiver.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Individual Customer
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {shipmentData.receiver.phone}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <span>{shipmentData.receiver.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Route Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                className="h-[300px]"
                pickup={{
                  lat: shipmentData.sender.lat,
                  lng: shipmentData.sender.lng,
                  label: "Pickup",
                }}
                delivery={{
                  lat: shipmentData.receiver.lat,
                  lng: shipmentData.receiver.lng,
                  label: "Delivery",
                }}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Shipment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentTimeline events={shipmentData.timeline} />
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shipmentData.internalNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-muted/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{note.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.timestamp).toLocaleString("en-OM")}
                    </span>
                  </div>
                  <p className="text-sm">{note.text}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  size="icon"
                  className="shrink-0 self-end h-10 w-10"
                  onClick={handleAddNote}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Package Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-muted">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Weight className="h-3 w-3" />
                    <span className="text-[10px]">Weight</span>
                  </div>
                  <p className="text-sm font-medium">
                    {shipmentData.package.weight} kg
                  </p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Package className="h-3 w-3" />
                    <span className="text-[10px]">Pieces</span>
                  </div>
                  <p className="text-sm font-medium">
                    {shipmentData.package.pieces}
                  </p>
                </div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Ruler className="h-3 w-3" />
                  <span className="text-[10px]">Dimensions (L×W×H)</span>
                </div>
                <p className="text-sm font-medium">
                  {shipmentData.package.length} × {shipmentData.package.width} ×{" "}
                  {shipmentData.package.height} cm
                </p>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Coins className="h-3 w-3" />
                  <span className="text-[10px]">Declared Value</span>
                </div>
                <p className="text-sm font-medium">
                  OMR {shipmentData.package.value.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {shipmentData.package.description}
              </p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Pricing Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Rate</span>
                <span>OMR {shipmentData.pricing.baseRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Weight ({shipmentData.package.weight} kg)
                </span>
                <span>OMR {shipmentData.pricing.weightCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {shipmentData.serviceType} Service
                </span>
                <span>
                  OMR {shipmentData.pricing.serviceCharge.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>OMR {shipmentData.pricing.total.toFixed(2)}</span>
              </div>
              {shipmentData.pricing.codAmount > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>COD Amount</span>
                  <span>OMR {shipmentData.pricing.codAmount.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Driver Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipmentData.driver ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {shipmentData.driver.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {shipmentData.driver.phone}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted">
                      <span className="text-muted-foreground">Vehicle</span>
                      <p className="font-medium">{shipmentData.driver.vehicle}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <span className="text-muted-foreground">Rating</span>
                      <p className="font-medium">
                        {shipmentData.driver.rating} / 5
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAssignDriver(!showAssignDriver)}
                  >
                    Reassign Driver
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No driver assigned
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowAssignDriver(true)}
                  >
                    Assign Driver
                  </Button>
                </div>
              )}
              {showAssignDriver && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs">Select Driver</Label>
                  <Select
                    value={selectedDriver}
                    onValueChange={setSelectedDriver}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowAssignDriver(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowAssignDriver(false)}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Proof */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Delivery Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shipmentData.deliveryProof.signature ? (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <PenLine className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Signature captured
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <p className="text-xs text-muted-foreground">
                    Pending delivery
                  </p>
                </div>
              )}
              {shipmentData.deliveryProof.photo ? (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Photo captured
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <p className="text-xs text-muted-foreground">
                    Photo pending
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
