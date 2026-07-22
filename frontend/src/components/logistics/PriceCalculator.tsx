"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Weight, MapPin, Zap, ArrowRight, Coins } from "lucide-react";

const serviceTypes = [
  { id: "standard", name: "Standard", baseRate: 3.0, multiplier: 1 },
  { id: "express", name: "Express", baseRate: 5.0, multiplier: 1.5 },
  { id: "same_day", name: "Same Day", baseRate: 10.0, multiplier: 2.5 },
  { id: "next_day", name: "Next Day", baseRate: 7.0, multiplier: 1.8 },
];

const zonePairs: Record<string, number> = {
  "muscat-seeb": 1.0,
  "muscat-qurum": 1.0,
  "muscat-bawshar": 1.2,
  "muscat-sohar": 2.5,
  "muscat-salalah": 4.0,
  "seeb-qurum": 1.1,
  "seeb-bawshar": 1.3,
  "qurum-bawshar": 1.2,
};

export function PriceCalculator() {
  const [weight, setWeight] = useState("");
  const [fromZone, setFromZone] = useState("muscat");
  const [toZone, setToZone] = useState("seeb");
  const [serviceType, setServiceType] = useState("standard");
  const [codEnabled, setCodEnabled] = useState(false);

  const calculation = useMemo(() => {
    const w = parseFloat(weight) || 0;
    if (w <= 0) return null;

    const service = serviceTypes.find((s) => s.id === serviceType);
    if (!service) return null;

    const zoneKey = `${fromZone}-${toZone}`;
    const zoneMultiplier = zonePairs[zoneKey] || 1.5;

    const baseRate = service.baseRate;
    const weightCharge = w * 1.5 * zoneMultiplier;
    const serviceCharge = service.baseRate * 0.5;
    const subtotal = baseRate + weightCharge + serviceCharge;
    const vat = subtotal * 0.05; // 5% VAT
    const total = subtotal + vat;
    const codFee = codEnabled ? 1.0 : 0;

    return {
      baseRate,
      weightCharge,
      serviceCharge,
      subtotal,
      vat,
      total: total + codFee,
      codFee,
    };
  }, [weight, fromZone, toZone, serviceType, codEnabled]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weight */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Weight className="h-3.5 w-3.5 text-muted-foreground" />
              Weight (kg)
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* From Zone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              From
            </Label>
            <Select value={fromZone} onValueChange={setFromZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="muscat">Muscat</SelectItem>
                <SelectItem value="seeb">Seeb</SelectItem>
                <SelectItem value="qurum">Qurum</SelectItem>
                <SelectItem value="bawshar">Bawshar</SelectItem>
                <SelectItem value="sohar">Sohar</SelectItem>
                <SelectItem value="salalah">Salalah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* To Zone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              To
            </Label>
            <Select value={toZone} onValueChange={setToZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seeb">Seeb</SelectItem>
                <SelectItem value="qurum">Qurum</SelectItem>
                <SelectItem value="bawshar">Bawshar</SelectItem>
                <SelectItem value="sohar">Sohar</SelectItem>
                <SelectItem value="salalah">Salalah</SelectItem>
                <SelectItem value="muscat">Muscat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            Service Type
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {serviceTypes.map((service) => (
              <Button
                key={service.id}
                variant={serviceType === service.id ? "default" : "outline"}
                size="sm"
                className="text-xs justify-start"
                onClick={() => setServiceType(service.id)}
              >
                {service.name}
                <Badge variant="secondary" className="text-[9px] ml-auto">
                  OMR {service.baseRate.toFixed(0)}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Calculation Result */}
        {calculation && (
          <>
            <Separator />
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Estimated Price</span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base Rate ({serviceTypes.find((s) => s.id === serviceType)?.name})
                  </span>
                  <span>OMR {calculation.baseRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Weight Charge ({weight} kg)
                  </span>
                  <span>OMR {calculation.weightCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge</span>
                  <span>OMR {calculation.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (5%)</span>
                  <span>OMR {calculation.vat.toFixed(2)}</span>
                </div>
                {codEnabled && (
                  <div className="flex justify-between text-amber-600">
                    <span>COD Fee</span>
                    <span>OMR {calculation.codFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>OMR {calculation.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {!calculation && weight === "" && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Enter weight and select zones to calculate price
          </div>
        )}
      </CardContent>
    </Card>
  );
}
