"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  CheckCircle,
  Truck,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ShipmentStatus =
  | "all"
  | "pending"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "cancelled";

interface Shipment {
  id: string;
  trackingNumber: string;
  sender: string;
  receiver: string;
  status: Exclude<ShipmentStatus, "all">;
  driver: string;
  zone: string;
  serviceType: string;
  cost: number;
  weight: number;
  pieces: number;
  createdAt: string;
  codAmount?: number;
}

const statusTabs: { value: ShipmentStatus; label: string; count: number }[] = [
  { value: "all", label: "All", count: 1284 },
  { value: "pending", label: "Pending", count: 156 },
  { value: "in_transit", label: "In Transit", count: 342 },
  { value: "out_for_delivery", label: "Out for Delivery", count: 89 },
  { value: "delivered", label: "Delivered", count: 628 },
  { value: "failed", label: "Failed", count: 42 },
  { value: "cancelled", label: "Cancelled", count: 27 },
];

const shipments: Shipment[] = [
  {
    id: "1",
    trackingNumber: "TRK-2847",
    sender: "Oman Electronics LLC",
    receiver: "Ahmed Al-Farsi",
    status: "in_transit",
    driver: "Khalid Bin Said",
    zone: "Muscat",
    serviceType: "Express",
    cost: 12.5,
    weight: 3.5,
    pieces: 1,
    createdAt: "2025-01-15T08:30:00Z",
  },
  {
    id: "2",
    trackingNumber: "TRK-2848",
    sender: "Home Style Furniture",
    receiver: "Fatima Al-Balushi",
    status: "out_for_delivery",
    driver: "Said Al-Habsi",
    zone: "Seeb",
    serviceType: "Standard",
    cost: 8.0,
    weight: 12.0,
    pieces: 2,
    createdAt: "2025-01-15T09:15:00Z",
  },
  {
    id: "3",
    trackingNumber: "TRK-2849",
    sender: "Fresh Foods Market",
    receiver: "Mohammed Al-Riyami",
    status: "delivered",
    driver: "Hamdan Al-Azri",
    zone: "Al Amerat",
    serviceType: "Same Day",
    cost: 15.0,
    weight: 1.2,
    pieces: 1,
    createdAt: "2025-01-15T07:00:00Z",
  },
  {
    id: "4",
    trackingNumber: "TRK-2850",
    sender: "Desert Rose Trading",
    receiver: "Aisha Al-Harthi",
    status: "pending",
    driver: "Unassigned",
    zone: "Bawshar",
    serviceType: "Next Day",
    cost: 9.5,
    weight: 0.8,
    pieces: 1,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "5",
    trackingNumber: "TRK-2851",
    sender: "Gulf Pharma Co.",
    receiver: "Salim Al-Mukhaini",
    status: "failed",
    driver: "Yousuf Al-Rashdi",
    zone: "Sohar",
    serviceType: "Express",
    cost: 22.0,
    weight: 0.5,
    pieces: 1,
    createdAt: "2025-01-14T16:30:00Z",
    codAmount: 150.0,
  },
  {
    id: "6",
    trackingNumber: "TRK-2852",
    sender: "Sultan Qaboos University",
    receiver: "Dr. Nasser Al-Harthy",
    status: "in_transit",
    driver: "Majid Al-Siyabi",
    zone: "Al Khoud",
    serviceType: "Standard",
    cost: 6.0,
    weight: 5.0,
    pieces: 3,
    createdAt: "2025-01-15T11:00:00Z",
  },
  {
    id: "7",
    trackingNumber: "TRK-2853",
    sender: "Carrefour Oman",
    receiver: "Laila Al-Zadjali",
    status: "pending",
    driver: "Unassigned",
    zone: "Qurum",
    serviceType: "Same Day",
    cost: 18.0,
    weight: 8.5,
    pieces: 4,
    createdAt: "2025-01-15T12:30:00Z",
    codAmount: 45.0,
  },
  {
    id: "8",
    trackingNumber: "TRK-2854",
    sender: "Oman Air Cargo",
    receiver: "Rashid Al-Kiyumi",
    status: "delivered",
    driver: "Fahad Al-Balushi",
    zone: "Ruwi",
    serviceType: "Express",
    cost: 25.0,
    weight: 2.0,
    pieces: 1,
    createdAt: "2025-01-14T22:00:00Z",
  },
  {
    id: "9",
    trackingNumber: "TRK-2855",
    sender: "Lulu Hypermarket",
    receiver: "Mariam Al-Sheidi",
    status: "out_for_delivery",
    driver: "Sami Al-Habsi",
    zone: "Ghala",
    serviceType: "Standard",
    cost: 7.5,
    weight: 15.0,
    pieces: 5,
    createdAt: "2025-01-15T06:00:00Z",
  },
  {
    id: "10",
    trackingNumber: "TRK-2856",
    sender: "Petroleum Dev. Oman",
    receiver: "Eng. Hamed Al-Wahaibi",
    status: "cancelled",
    driver: "Unassigned",
    zone: "Mina Al Fahal",
    serviceType: "Next Day",
    cost: 30.0,
    weight: 25.0,
    pieces: 1,
    createdAt: "2025-01-14T14:00:00Z",
  },
];

const drivers = [
  { id: "d1", name: "Khalid Bin Said" },
  { id: "d2", name: "Said Al-Habsi" },
  { id: "d3", name: "Hamdan Al-Azri" },
  { id: "d4", name: "Majid Al-Siyabi" },
  { id: "d5", name: "Fahad Al-Balushi" },
];

export default function ShipmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ShipmentStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [assignDriverOpen, setAssignDriverOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [assignDriverId, setAssignDriverId] = useState("");
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredShipments = shipments.filter((s) => {
    const matchesTab = activeTab === "all" || s.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.receiver.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === paginatedShipments.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedShipments.map((s) => s.id));
    }
  };

  const handleAssignDriver = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setAssignDriverOpen(true);
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setViewDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all shipments
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/logistics/shipments/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab(tab.value);
              setCurrentPage(1);
            }}
            className="gap-2"
          >
            {tab.label}
            <Badge
              variant={activeTab === tab.value ? "secondary" : "outline"}
              className="text-[10px] h-5 min-w-5"
            >
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs mb-1.5 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking #, sender, receiver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedRows.length} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignDriverOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Assign Driver
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Update Status
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
        </div>
      )}

      {/* Shipments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      paginatedShipments.length > 0 &&
                      selectedRows.length === paginatedShipments.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="text-xs">Tracking #</TableHead>
                <TableHead className="text-xs">Sender</TableHead>
                <TableHead className="text-xs">Receiver</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs">Zone</TableHead>
                <TableHead className="text-xs">Service</TableHead>
                <TableHead className="text-xs text-right">Cost</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <PackageOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No shipments found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedShipments.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() =>
                      router.push(
                        `/dashboard/logistics/shipments/${shipment.id}`
                      )
                    }
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.includes(shipment.id)}
                        onCheckedChange={() => toggleRow(shipment.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      {shipment.trackingNumber}
                    </TableCell>
                    <TableCell className="text-xs max-w-[140px] truncate">
                      {shipment.sender}
                    </TableCell>
                    <TableCell className="text-xs max-w-[140px] truncate">
                      {shipment.receiver}
                    </TableCell>
                    <TableCell>
                      <ShipmentStatusBadge status={shipment.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs">
                      {shipment.driver === "Unassigned" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 text-amber-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignDriver(shipment);
                          }}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      ) : (
                        shipment.driver
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{shipment.zone}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {shipment.serviceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      OMR {shipment.cost.toFixed(2)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(shipment)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssignDriver(shipment)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredShipments.length)} of{" "}
          {filteredShipments.length} shipments
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDriverOpen} onOpenChange={setAssignDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              {selectedShipment
                ? `Assign a driver to shipment ${selectedShipment.trackingNumber}`
                : `Assign a driver to ${selectedRows.length} selected shipments`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Driver</Label>
              <Select
                value={assignDriverId}
                onValueChange={setAssignDriverId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignDriverOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAssignDriverOpen(false);
                setAssignDriverId("");
                setSelectedRows([]);
              }}
              disabled={!assignDriverId}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Shipment Details
              {selectedShipment && (
                <ShipmentStatusBadge
                  status={selectedShipment.status}
                  size="sm"
                />
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Tracking #</p>
                  <p className="text-sm font-mono font-medium">
                    {selectedShipment.trackingNumber}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Service Type</p>
                  <p className="text-sm font-medium">
                    {selectedShipment.serviceType}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Sender</p>
                <p className="text-sm font-medium">
                  {selectedShipment.sender}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Receiver</p>
                <p className="text-sm font-medium">
                  {selectedShipment.receiver}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Zone</p>
                  <p className="text-sm">{selectedShipment.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="text-sm">{selectedShipment.driver}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-sm">{selectedShipment.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pieces</p>
                  <p className="text-sm">{selectedShipment.pieces}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="text-sm font-medium">
                    OMR {selectedShipment.cost.toFixed(2)}
                  </p>
                </div>
                {selectedShipment.codAmount && (
                  <div>
                    <p className="text-xs text-muted-foreground">COD</p>
                    <p className="text-sm font-medium">
                      OMR {selectedShipment.codAmount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setViewDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewDetailsOpen(false);
                    router.push(
                      `/dashboard/logistics/shipments/${selectedShipment.id}`
                    );
                  }}
                >
                  Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
