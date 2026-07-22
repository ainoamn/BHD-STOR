"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminOrders, useAdminUpdateOrderStatus } from "@/hooks/useAdmin";

import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  User,
  Store,
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    governorate: string;
    postalCode?: string;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  total: number;
}

export default function AdminOrdersPage() {
  const t = useTranslations("dashboard.admin.orders");
  const router = useRouter();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [debouncedSearch] = useDebounce(search, 300);

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminOrders({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const updateStatusMutation = useAdminUpdateOrderStatus();

  const orders: Order[] = ordersData?.orders ?? [];
  const totalOrders = ordersData?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / limit);

  useEffect(() => {
    if (!isLoading && (!user || !isAdminRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [user, isLoading, router, t]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setStatusToUpdate(newStatus);
    setConfirmOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (!selectedOrder || !statusToUpdate) return;

    updateStatusMutation.mutate(
      { orderId: selectedOrder.id, data: { status: statusToUpdate } },
      {
        onSuccess: () => {
          toast.success(t("statusUpdateSuccess"));
          refetch();
          setConfirmOpen(false);
          if (selectedOrder) {
            setSelectedOrder({ ...selectedOrder, status: statusToUpdate });
          }
        },
        onError: (err: any) => {
          toast.error(t("statusUpdateError"), {
            description: err?.response?.data?.message || err?.message,
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: t("status.pending"), className: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { label: t("status.processing"), className: "bg-blue-100 text-blue-800", icon: PackageCheck },
      shipped: { label: t("status.shipped"), className: "bg-purple-100 text-purple-800", icon: Truck },
      delivered: { label: t("status.delivered"), className: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { label: t("status.cancelled"), className: "bg-red-100 text-red-800", icon: XCircle },
      refunded: { label: t("status.refunded"), className: "bg-gray-100 text-gray-800", icon: RefreshCw },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge variant="outline" className={config.className}>
        <config.icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const configs: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge variant="outline" className={configs[status] || configs.pending}>
        {status}
      </Badge>
    );
  };

  const statusTransitions: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["refunded"],
    cancelled: [],
    refunded: [],
  };

  if (!user || !isAdminRole(user.role)) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("error.title")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{(error as any)?.message || t("error.description")}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("error.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-7 w-7" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle", { count: totalOrders })}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("refresh")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("filters.pending")}</SelectItem>
                <SelectItem value="processing">{t("filters.processing")}</SelectItem>
                <SelectItem value="shipped">{t("filters.shipped")}</SelectItem>
                <SelectItem value="delivered">{t("filters.delivered")}</SelectItem>
                <SelectItem value="cancelled">{t("filters.cancelled")}</SelectItem>
                <SelectItem value="refunded">{t("filters.refunded")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.order")}</TableHead>
                  <TableHead>{t("table.customer")}</TableHead>
                  <TableHead>{t("table.store")}</TableHead>
                  <TableHead>{t("table.total")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.payment")}</TableHead>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("empty.title")}</p>
                      <p className="text-sm">{t("empty.description")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length ?? 0} {t("items")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{order.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        OMR {order.total?.toFixed(3)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t("actions.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t("pagination.showing", {
                  from: (page - 1) * limit + 1,
                  to: Math.min(page * limit, totalOrders),
                  total: totalOrders,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {t("detail.title", { orderNumber: selectedOrder.orderNumber })}
                </DialogTitle>
                <DialogDescription>{t("detail.description")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status & Payment */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  {getPaymentBadge(selectedOrder.paymentStatus)}
                </div>

                {/* Order Timeline */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("detail.customerInfo")}
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium">{selectedOrder.customerName}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedOrder.customerEmail}
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedOrder.customerPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("detail.shippingAddress")}
                  </h4>
                  <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                    <p>{selectedOrder.shippingAddress?.street}</p>
                    <p>
                      {selectedOrder.shippingAddress?.city},{" "}
                      {selectedOrder.shippingAddress?.governorate}
                    </p>
                    {selectedOrder.shippingAddress?.postalCode && (
                      <p>{selectedOrder.shippingAddress.postalCode}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <PackageCheck className="h-4 w-4" />
                    {t("detail.items")}
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("detail.quantity")}: {item.quantity} x OMR {item.price?.toFixed(3)}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">OMR {item.total?.toFixed(3)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("detail.subtotal")}</span>
                    <span>OMR {selectedOrder.subtotal?.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("detail.shipping")}</span>
                    <span>OMR {selectedOrder.shipping?.toFixed(3)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("detail.discount")}</span>
                      <span className="text-green-600">-OMR {selectedOrder.discount?.toFixed(3)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>{t("detail.total")}</span>
                    <span>OMR {selectedOrder.total?.toFixed(3)}</span>
                  </div>
                </div>

                {/* Update Status */}
                {statusTransitions[selectedOrder.status]?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">{t("detail.updateStatus")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {statusTransitions[selectedOrder.status].map((nextStatus: string) => (
                        <Button
                          key={nextStatus}
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(selectedOrder.id, nextStatus)}
                        >
                          {t(`status.${nextStatus}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Status Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm.title")}</DialogTitle>
            <DialogDescription>
              {t("confirm.description", { status: t(`status.${statusToUpdate}`) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("confirm.cancel")}
            </Button>
            <Button onClick={confirmStatusUpdate} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
