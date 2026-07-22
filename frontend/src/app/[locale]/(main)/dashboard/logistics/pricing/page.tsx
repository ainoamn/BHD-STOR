"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/switch";
import { PriceCalculator } from "@/components/logistics/PriceCalculator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tag,
  Plus,
  Calculator,
  Edit,
  Trash2,
  Weight,
  MapPin,
  Zap,
  Clock,
  Sun,
  Moon,
  ArrowRight,
  Save,
} from "lucide-react";

interface PricingRule {
  id: string;
  name: string;
  fromZone: string;
  toZone: string;
  serviceType: string;
  baseRate: number;
  weightRate: number;
  minCharge: number;
  maxWeight: number;
  codFee: number;
  active: boolean;
}

const pricingRules: PricingRule[] = [
  {
    id: "pr1",
    name: "Muscat-Seeb Standard",
    fromZone: "Muscat",
    toZone: "Seeb",
    serviceType: "Standard",
    baseRate: 3.0,
    weightRate: 1.5,
    minCharge: 2.0,
    maxWeight: 50,
    codFee: 1.0,
    active: true,
  },
  {
    id: "pr2",
    name: "Muscat-Qurum Express",
    fromZone: "Muscat",
    toZone: "Qurum",
    serviceType: "Express",
    baseRate: 5.0,
    weightRate: 2.0,
    minCharge: 4.0,
    maxWeight: 30,
    codFee: 1.0,
    active: true,
  },
  {
    id: "pr3",
    name: "Same Day - All Muscat",
    fromZone: "Muscat",
    toZone: "Muscat",
    serviceType: "Same Day",
    baseRate: 10.0,
    weightRate: 3.0,
    minCharge: 8.0,
    maxWeight: 20,
    codFee: 2.0,
    active: true,
  },
  {
    id: "pr4",
    name: "Remote - Sohar",
    fromZone: "Muscat",
    toZone: "Sohar",
    serviceType: "Standard",
    baseRate: 8.0,
    weightRate: 2.5,
    minCharge: 6.0,
    maxWeight: 100,
    codFee: 1.5,
    active: true,
  },
  {
    id: "pr5",
    name: "Next Day - Bawshar",
    fromZone: "Muscat",
    toZone: "Bawshar",
    serviceType: "Next Day",
    baseRate: 7.0,
    weightRate: 2.0,
    minCharge: 5.0,
    maxWeight: 50,
    codFee: 1.0,
    active: false,
  },
];

export default function PricingPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<PricingRule | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage delivery pricing rules
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Calculator */}
      <PriceCalculator />

      {/* Pricing Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Pricing Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Rule</TableHead>
                <TableHead className="text-xs">From → To</TableHead>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs text-right">Base</TableHead>
                <TableHead className="text-xs text-right">/kg</TableHead>
                <TableHead className="text-xs text-right">Min</TableHead>
                <TableHead className="text-xs text-right">COD</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-xs font-medium">
                    {rule.name}
                  </TableCell>
                  <TableCell className="text-xs">
                    {rule.fromZone} → {rule.toZone}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {rule.serviceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    OMR {rule.baseRate.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    OMR {rule.weightRate.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    OMR {rule.minCharge.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    OMR {rule.codFee.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Switch checked={rule.active} className="data-[state=checked]:bg-emerald-500" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditRule(rule)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={addDialogOpen || !!editRule}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditRule(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editRule ? "Edit Pricing Rule" : "Add Pricing Rule"}
            </DialogTitle>
            <DialogDescription>
              Define pricing for a zone pair and service type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                defaultValue={editRule?.name}
                placeholder="e.g. Muscat-Seeb Standard"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Zone</Label>
                <Select defaultValue={editRule?.fromZone || "muscat"}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-2">
                <Label>To Zone</Label>
                <Select defaultValue={editRule?.toZone || "seeb"}>
                  <SelectTrigger>
                    <SelectValue />
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
              <Label>Service Type</Label>
              <Select
                defaultValue={editRule?.serviceType || "Standard"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Express">Express</SelectItem>
                  <SelectItem value="Same Day">Same Day</SelectItem>
                  <SelectItem value="Next Day">Next Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Base Rate (OMR)</Label>
                <Input
                  type="number"
                  step="0.5"
                  defaultValue={editRule?.baseRate || "3.0"}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight Rate/kg</Label>
                <Input
                  type="number"
                  step="0.5"
                  defaultValue={editRule?.weightRate || "1.5"}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Charge</Label>
                <Input
                  type="number"
                  step="0.5"
                  defaultValue={editRule?.minCharge || "2.0"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Weight (kg)</Label>
                <Input
                  type="number"
                  defaultValue={editRule?.maxWeight || "50"}
                />
              </div>
              <div className="space-y-2">
                <Label>COD Fee (OMR)</Label>
                <Input
                  type="number"
                  step="0.5"
                  defaultValue={editRule?.codFee || "1.0"}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setEditRule(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddDialogOpen(false);
                setEditRule(null);
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              {editRule ? "Save Changes" : "Add Rule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
