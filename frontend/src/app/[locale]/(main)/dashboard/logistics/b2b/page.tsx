"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Key,
  RefreshCw,
  BarChart3,
  CheckCircle,
  XCircle,
  CreditCard,
  Globe,
  Eye,
} from "lucide-react";

interface B2BCustomer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "inactive";
  creditLimit: number;
  creditUsed: number;
  apiAccess: boolean;
  apiKey: string;
  apiCalls: number;
  monthlyShipments: number;
  joinDate: string;
}

const customers: B2BCustomer[] = [
  {
    id: "b1",
    companyName: "Oman Electronics LLC",
    contactPerson: "Rashid Al-Kiyumi",
    email: "operations@omanelectronics.om",
    phone: "+968 9123 4567",
    status: "active",
    creditLimit: 5000,
    creditUsed: 3250,
    apiAccess: true,
    apiKey: "bhd_live_abc123...",
    apiCalls: 45230,
    monthlyShipments: 450,
    joinDate: "2023-01-15",
  },
  {
    id: "b2",
    companyName: "Carrefour Oman",
    contactPerson: "Sara Al-Harthy",
    email: "logistics@carrefour.om",
    phone: "+968 9234 5678",
    status: "active",
    creditLimit: 10000,
    creditUsed: 7800,
    apiAccess: true,
    apiKey: "bhd_live_def456...",
    apiCalls: 89120,
    monthlyShipments: 890,
    joinDate: "2022-06-01",
  },
  {
    id: "b3",
    companyName: "Petroleum Development Oman",
    contactPerson: "Eng. Hamed Al-Wahaibi",
    email: "supply@pdo.co.om",
    phone: "+968 9345 6789",
    status: "active",
    creditLimit: 15000,
    creditUsed: 4200,
    apiAccess: true,
    apiKey: "bhd_live_ghi789...",
    apiCalls: 12350,
    monthlyShipments: 120,
    joinDate: "2021-03-10",
  },
  {
    id: "b4",
    companyName: "Oman Cables Industry",
    contactPerson: "Mariam Al-Zadjali",
    email: "shipping@omancables.om",
    phone: "+968 9456 7890",
    status: "pending",
    creditLimit: 3000,
    creditUsed: 0,
    apiAccess: false,
    apiKey: "",
    apiCalls: 0,
    monthlyShipments: 0,
    joinDate: "2025-01-10",
  },
  {
    id: "b5",
    companyName: "Bank Muscat",
    contactPerson: "Nasser Al-Riyami",
    email: "courier@bankmuscat.com",
    phone: "+968 9567 8901",
    status: "active",
    creditLimit: 8000,
    creditUsed: 2100,
    apiAccess: true,
    apiKey: "bhd_live_jkl012...",
    apiCalls: 34200,
    monthlyShipments: 320,
    joinDate: "2022-09-20",
  },
  {
    id: "b6",
    companyName: "Lulu Hypermarket",
    contactPerson: "Faisal Al-Balushi",
    email: "logistics@luluoman.com",
    phone: "+968 9678 9012",
    status: "inactive",
    creditLimit: 7000,
    creditUsed: 6500,
    apiAccess: false,
    apiKey: "",
    apiCalls: 0,
    monthlyShipments: 0,
    joinDate: "2023-04-05",
  },
];

export default function B2BPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<B2BCustomer | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      !searchQuery ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const regenerateKey = (customerId: string) => {
    const newKey = `bhd_live_${Math.random().toString(36).substring(2, 15)}...`;
    return newKey;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">B2B Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage business customers and API access
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">
              {customers.filter((c) => c.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">With API Access</p>
            <p className="text-2xl font-bold text-primary">
              {customers.filter((c) => c.apiAccess).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Credit Limit</p>
            <p className="text-2xl font-bold">
              OMR{" "}
              {customers
                .reduce((s, c) => s + c.creditLimit, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Company</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Credit</TableHead>
                <TableHead className="text-xs">API</TableHead>
                <TableHead className="text-xs">Monthly</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">
                          {customer.companyName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Since{" "}
                          {new Date(customer.joinDate).toLocaleDateString(
                            "en-OM"
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{customer.contactPerson}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {customer.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "active"
                          ? "default"
                          : customer.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-[100px]">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">
                          OMR {customer.creditUsed.toLocaleString()}
                        </span>
                        <span className="font-medium">
                          OMR {customer.creditLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(customer.creditUsed / customer.creditLimit) * 100}
                        className="h-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.apiAccess ? (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 text-[10px] gap-1"
                      >
                        <Globe className="h-2.5 w-2.5" />
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-[10px]"
                      >
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {customer.monthlyShipments > 0
                      ? `${customer.monthlyShipments} shipments`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => setViewCustomer(customer)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog
        open={!!viewCustomer}
        onOpenChange={(open) => !open && setViewCustomer(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {viewCustomer?.companyName}
            </DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="text-sm font-medium">
                    {viewCustomer.contactPerson}
                  </p>
                </div>
                <div className="p-3 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      viewCustomer.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {viewCustomer.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{viewCustomer.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{viewCustomer.phone}</p>
              </div>

              <div className="p-3 rounded bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Credit Usage</span>
                  <span className="text-xs text-muted-foreground">
                    OMR {viewCustomer.creditUsed.toLocaleString()} / OMR{" "}
                    {viewCustomer.creditLimit.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    (viewCustomer.creditUsed / viewCustomer.creditLimit) * 100
                  }
                />
              </div>

              {viewCustomer.apiAccess && (
                <div className="p-3 rounded bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">API Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {viewCustomer.apiKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() =>
                        setViewCustomer({
                          ...viewCustomer,
                          apiKey: regenerateKey(viewCustomer.id),
                        })
                      }
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {viewCustomer.apiCalls.toLocaleString()} API calls this
                      month
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-muted text-center">
                  <p className="text-lg font-bold">
                    {viewCustomer.monthlyShipments}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Monthly Shipments
                  </p>
                </div>
                <div className="p-3 rounded bg-muted text-center">
                  <p className="text-lg font-bold">
                    {viewCustomer.apiCalls > 0
                      ? `${(viewCustomer.apiCalls / 1000).toFixed(1)}k`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    API Calls
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add B2B Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input placeholder="Enter company name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="email@company.om" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+968 XXXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (OMR)</Label>
                <Input type="number" placeholder="5000" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setAddDialogOpen(false)}>Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
