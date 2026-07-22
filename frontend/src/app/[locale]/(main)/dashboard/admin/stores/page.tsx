"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { toast } from "sonner";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStores, useAdminVerifyStore } from "@/hooks/useAdmin";

import {
  Search,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  ownerName: string;
  ownerEmail: string;
  category: string;
  address?: string;
  phone?: string;
  verificationStatus: string;
  logo?: string;
  createdAt: string;
  productsCount: number;
  ordersCount: number;
}

export default function AdminStoresPage() {
  const t = useTranslations("dashboard.admin.stores");
  const router = useRouter();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; store: StoreItem | null; action: "approve" | "reject" } | null>(null);

  const [debouncedSearch] = useDebounce(search, 300);

  const statusFilter = activeTab === "pending" ? "pending" : activeTab === "verified" ? "verified" : activeTab === "rejected" ? "rejected" : undefined;

  const {
    data: storesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminStores({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  const verifyMutation = useAdminVerifyStore();

  const stores: StoreItem[] = storesData?.stores ?? [];
  const totalStores = storesData?.total ?? 0;
  const totalPages = Math.ceil(totalStores / limit);

  useEffect(() => {
    if (!isLoading && (!user || !isAdminRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [user, isLoading, router, t]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab]);

  const handleVerify = (storeId: string, action: "approve" | "reject") => {
    verifyMutation.mutate(
      { storeId, verified: action === "approve" },
      {
        onSuccess: () => {
          toast.success(
            action === "approve" ? t("verify.approved") : t("verify.rejected")
          );
          refetch();
          setVerifyDialog(null);
        },
        onError: (err: any) => {
          toast.error(t("verify.error"), {
            description: err?.response?.data?.message || err?.message,
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: t("status.pending"),
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      verified: {
        label: t("status.verified"),
        className: "bg-green-100 text-green-800",
        icon: ShieldCheck,
      },
      rejected: {
        label: t("status.rejected"),
        className: "bg-red-100 text-red-800",
        icon: ShieldX,
      },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge variant="outline" className={config.className}>
        <config.icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
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
            <Store className="h-7 w-7" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle", { count: totalStores })}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("refresh")}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {t("tabs.pending")}
          </TabsTrigger>
          <TabsTrigger value="verified">{t("tabs.verified")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("tabs.rejected")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.store")}</TableHead>
                      <TableHead>{t("table.owner")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.products")}</TableHead>
                      <TableHead>{t("table.orders")}</TableHead>
                      <TableHead>{t("table.created")}</TableHead>
                      <TableHead className="text-right">{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{t("empty.title")}</p>
                          <p className="text-sm">{t("empty.description")}</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stores.map((store: StoreItem) => (
                        <TableRow key={store.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                {store.logo ? (
                                  <img src={store.logo} alt={store.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Store className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{store.name}</p>
                                <p className="text-sm text-muted-foreground">{store.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{store.ownerName}</p>
                                <p className="text-xs text-muted-foreground">{store.ownerEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(store.verificationStatus)}</TableCell>
                          <TableCell>{store.productsCount}</TableCell>
                          <TableCell>{store.ordersCount}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(store.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/admin/stores/${store.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {store.verificationStatus === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:bg-green-50"
                                    onClick={() =>
                                      setVerifyDialog({ open: true, store, action: "approve" })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {t("actions.approve")}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      setVerifyDialog({ open: true, store, action: "reject" })
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {t("actions.reject")}
                                  </Button>
                                </>
                              )}
                            </div>
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
                      to: Math.min(page * limit, totalStores),
                      total: totalStores,
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
        </TabsContent>
      </Tabs>

      {/* Verify Dialog */}
      <Dialog open={verifyDialog?.open ?? false} onOpenChange={() => setVerifyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyDialog?.action === "approve"
                ? t("dialog.approve.title")
                : t("dialog.reject.title")}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog?.action === "approve"
                ? t("dialog.approve.description", { storeName: verifyDialog?.store?.name })
                : t("dialog.reject.description", { storeName: verifyDialog?.store?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog(null)}>
              {t("dialog.cancel")}
            </Button>
            <Button
              variant={verifyDialog?.action === "approve" ? "default" : "destructive"}
              onClick={() =>
                verifyDialog && handleVerify(verifyDialog.store!.id, verifyDialog.action)
              }
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : verifyDialog?.action === "approve" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {verifyDialog?.action === "approve"
                ? t("dialog.approve.confirm")
                : t("dialog.reject.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
