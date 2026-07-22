"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/Badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DeliveryMap } from "@/components/logistics/DeliveryMap";
import { PriceCalculator } from "@/components/logistics/PriceCalculator";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Package,
  Weight,
  Ruler,
  Coins,
  CreditCard,
  Calculator,
  Zap,
  Clock,
  Sun,
  Moon,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const serviceTypes = [
  {
    id: "standard",
    name: "Standard",
    description: "2-3 business days",
    icon: Clock,
    baseRate: 3.0,
  },
  {
    id: "express",
    name: "Express",
    description: "Next business day",
    icon: Zap,
    baseRate: 5.0,
  },
  {
    id: "same_day",
    name: "Same Day",
    description: "Delivered today",
    icon: Sun,
    baseRate: 10.0,
  },
  {
    id: "next_day",
    name: "Next Day",
    description: "By next day 2PM",
    icon: Moon,
    baseRate: 7.0,
  },
];

interface FormData {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number;
  senderLng: number;

  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverLat: number;
  receiverLng: number;

  weight: string;
  length: string;
  width: string;
  height: string;
  pieces: string;
  value: string;
  description: string;

  serviceType: string;
  codEnabled: boolean;
  codAmount: string;
}

const initialForm: FormData = {
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  senderLat: 23.588,
  senderLng: 58.3829,

  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  receiverLat: 23.6156,
  receiverLng: 58.4731,

  weight: "",
  length: "",
  width: "",
  height: "",
  pieces: "1",
  value: "",
  description: "",

  serviceType: "standard",
  codEnabled: false,
  codAmount: "",
};

export default function CreateShipmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedService = serviceTypes.find((s) => s.id === form.serviceType);

  const calculatePrice = () => {
    const weight = parseFloat(form.weight) || 0;
    const baseRate = selectedService?.baseRate || 3;
    const weightCharge = weight * 1.5;
    return baseRate + weightCharge;
  };

  const totalPrice = calculatePrice();

  const handleSubmit = () => {
    router.push("/dashboard/logistics/shipments");
  };

  const steps = [
    { id: 1, name: "Sender", icon: User },
    { id: 2, name: "Receiver", icon: MapPin },
    { id: 3, name: "Package", icon: Package },
    { id: 4, name: "Service", icon: Zap },
    { id: 5, name: "Review", icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/logistics/shipments")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create Shipment
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new shipment for delivery
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => setStep(s.id)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : step > s.id
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.id ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </button>
              <span
                className={cn(
                  "text-xs mt-1.5 font-medium",
                  step === s.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                {s.name}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5",
                  step > s.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Sender */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Sender Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Sender Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter sender name or company"
                  value={form.senderName}
                  onChange={(e) => updateField("senderName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="+968 XXXX XXXX"
                  value={form.senderPhone}
                  onChange={(e) => updateField("senderPhone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                Pickup Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter full address"
                value={form.senderAddress}
                onChange={(e) =>
                  updateField("senderAddress", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="mb-2 block">Pickup Location (Map)</Label>
              <DeliveryMap
                className="h-[250px]"
                pickup={{
                  lat: form.senderLat,
                  lng: form.senderLng,
                  label: "Pickup",
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Receiver */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Receiver Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Receiver Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter receiver name"
                  value={form.receiverName}
                  onChange={(e) =>
                    updateField("receiverName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="+968 XXXX XXXX"
                  value={form.receiverPhone}
                  onChange={(e) =>
                    updateField("receiverPhone", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                Delivery Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter full delivery address"
                value={form.receiverAddress}
                onChange={(e) =>
                  updateField("receiverAddress", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="mb-2 block">Delivery Location (Map)</Label>
              <DeliveryMap
                className="h-[250px]"
                delivery={{
                  lat: form.receiverLat,
                  lng: form.receiverLng,
                  label: "Delivery",
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Package Details */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Package Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>
                  Weight (kg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Length (cm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.length}
                  onChange={(e) => updateField("length", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.width}
                  onChange={(e) => updateField("width", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.height}
                  onChange={(e) => updateField("height", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pieces</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.pieces}
                  onChange={(e) => updateField("pieces", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Declared Value (OMR)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.value}
                  onChange={(e) => updateField("value", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Package contents description..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Service Type */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Select Service Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={form.serviceType}
              onValueChange={(v) => updateField("serviceType", v)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {serviceTypes.map((service) => (
                <Label
                  key={service.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                    form.serviceType === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <RadioGroupItem
                    value={service.id}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <service.icon className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{service.name}</span>
                      </div>
                      <Badge variant="outline">
                        OMR {service.baseRate.toFixed(2)} base
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  </div>
                </Label>
              ))}
            </RadioGroup>

            <Separator />

            {/* COD Option */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">
                    Cash on Delivery (COD)
                  </Label>
                </div>
                <Switch
                  checked={form.codEnabled}
                  onCheckedChange={(v) => updateField("codEnabled", v)}
                />
              </div>
              {form.codEnabled && (
                <div className="space-y-2">
                  <Label>COD Amount (OMR)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.codAmount}
                    onChange={(e) => updateField("codAmount", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Price Preview */}
            <Separator />
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-semibold">Price Preview</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {selectedService?.name} Base Rate
                  </span>
                  <span>OMR {selectedService?.baseRate.toFixed(2)}</span>
                </div>
                {form.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Weight Charge ({form.weight} kg × 1.5)
                    </span>
                    <span>
                      OMR {((parseFloat(form.weight) || 0) * 1.5).toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Estimated Total</span>
                  <span>OMR {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Review Shipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Sender
                </h3>
                <p className="text-sm">{form.senderName || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {form.senderPhone}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.senderAddress}
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" />
                  Receiver
                </h3>
                <p className="text-sm">{form.receiverName || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {form.receiverPhone}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.receiverAddress}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                Package Details
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-medium">{form.weight || "—"} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pieces</p>
                  <p className="font-medium">{form.pieces}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dimensions</p>
                  <p className="font-medium">
                    {form.length || "—"}×{form.width || "—"}×
                    {form.height || "—"} cm
                  </p>
                </div>
              </div>
              {form.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {form.description}
                </p>
              )}
            </div>

            <div className="p-4 rounded-lg border">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4" />
                Service & Pricing
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {selectedService?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedService?.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    OMR {totalPrice.toFixed(2)}
                  </p>
                  {form.codEnabled && form.codAmount && (
                    <p className="text-xs text-amber-600">
                      COD: OMR {parseFloat(form.codAmount).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Previous
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Create Shipment
          </Button>
        )}
      </div>
    </div>
  );
}
