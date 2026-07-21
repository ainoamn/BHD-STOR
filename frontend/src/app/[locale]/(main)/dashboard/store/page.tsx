"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

import { isSellerRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useStoreAnalytics } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";

import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Store,
} from "lucide-react";

import { StoreBarcodeCard } from "@/components/store/StoreBarcodeCard";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function StoreDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </div>
  );
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  sales: number;
}

export default function StoreDashboardPage() {
  const t = useTranslations("dashboard.store");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const storeId = user?.storeId || user?.store?.id;

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useStoreAnalytics(storeId ?? "", {
    enabled: !!storeId,
  });

  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useOrders(
    storeId
      ? { store: storeId, perPage: 5, page: 1 }
      : { perPage: 5, page: 1 }
  );

  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useProducts(
    storeId
      ? { store: storeId, perPage: 5, page: 1 }
      : { perPage: 5, page: 1 }
  );

  const orders: Order[] =
    (ordersResponse as any)?.orders ??
    (ordersResponse as any)?.data ??
    [];
  const products: Product[] =
    (productsResponse as any)?.products ??
    (productsResponse as any)?.data ??
    [];

  const lowStockProducts = products.filter((p: Product) => p.stock < 10);

  useEffect(() => {
    if (!authLoading && (!user || !isSellerRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [authLoading, user, router, t]);

  if (authLoading || analyticsLoading || ordersLoading || productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <StoreDashboardSkeleton />
      </div>
    );
  }

  if (!user || !isSellerRole(user.role)) {
    return null;
  }

  if (!storeId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert>
          <Store className="h-4 w-4" />
          <AlertTitle>{t("noStore.title")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{t("noStore.description")}</span>
            <Button onClick={() => router.push("/dashboard/store/create")} className="w-fit">
              {t("noStore.createButton")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleRetry = () => {
    if (analyticsError) refetchAnalytics();
    if (ordersError) refetchOrders();
    if (productsError) refetchProducts();
  };

  if (analyticsError || ordersError || productsError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("error.title")}</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{t("error.description")}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} className="w-fit">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("error.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = analytics
    ? [
        {
          title: t("stats.revenue"),
          value: `OMR ${analytics.totalRevenue?.toLocaleString() ?? 0}`,
          change: analytics.revenueChange ?? 0,
          icon: DollarSign,
          trend: (analytics.revenueChange ?? 0) >= 0 ? "up" : "down",
        },
        {
          title: t("stats.orders"),
          value: analytics.totalOrders?.toLocaleString() ?? "0",
          change: analytics.ordersChange ?? 0,
          icon: ShoppingBag,
          trend: (analytics.ordersChange ?? 0) >= 0 ? "up" : "down",
        },
        {
          title: t("stats.products"),
          value: analytics.totalProducts?.toLocaleString() ?? "0",
          change: null,
          icon: Package,
          trend: null,
        },
        {
          title: t("stats.views"),
          value: analytics.totalViews?.toLocaleString() ?? "0",
          change: analytics.viewsChange ?? 0,
          icon: Eye,
          trend: (analytics.viewsChange ?? 0) >= 0 ? "up" : "down",
        },
      ]
    : [];

  const chartData = analytics?.chartData ?? [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("refresh")}
          </Button>
          <Button onClick={() => router.push("/dashboard/store/products/new")}>
            <Package className="mr-2 h-4 w-4" />
            {t("addProduct") || "Add product"}
          </Button>
        </div>
      </div>

      <StoreBarcodeCard storeId={storeId} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.change !== null && (
                      <div
                        className={`flex items-center text-sm ${
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        <span>{stat.change > 0 ? "+" : ""}{stat.change}%</span>
                      </div>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts & Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            {t("tabs.orders")}
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            {t("tabs.products")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.revenue.title")}</CardTitle>
              <CardDescription>{t("charts.revenue.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [`OMR ${value}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t("charts.noData")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-yellow-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {t("alerts.lowStock.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("alerts.lowStock.remaining", { count: product.stock })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/store/products/${product.id}/edit`)
                        }
                      >
                        {t("alerts.lowStock.restock")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.title")}</CardTitle>
              <CardDescription>{t("orders.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("orders.empty.title")}</p>
                  <p className="text-sm">{t("orders.empty.description")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: Order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">#{order.orderNumber}</p>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">OMR {order.total.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length ?? 0} {t("orders.items")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("products.title")}</CardTitle>
                <CardDescription>{t("products.description")}</CardDescription>
              </div>
              <Button size="sm" onClick={() => router.push("/dashboard/store/products/new")}>
                <Package className="mr-2 h-4 w-4" />
                {t("products.add")}
              </Button>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("products.empty.title")}</p>
                  <p className="text-sm">{t("products.empty.description")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">OMR {product.price?.toFixed(3)}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`${
                              product.stock < 10 ? "text-red-600" : "text-muted-foreground"
                            }`}
                          >
                            {product.stock} {t("products.inStock")}
                          </span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">
                            {product.sales ?? 0} {t("products.sold")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
