"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats } from "@/hooks/useAdmin";
import { useAdminOrders } from "@/hooks/useAdmin";
import { useAdminStores } from "@/hooks/useAdmin";
import { useAdminAnalytics } from "@/hooks/useAdmin";

import {
  DollarSign,
  Users,
  Store,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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

function AdminDashboardSkeleton() {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("dashboard.admin");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useAdminStats();

  const {
    data: recentOrdersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useAdminOrders({ recent: true, limit: 5 });

  const {
    data: pendingStoresData,
    isLoading: storesLoading,
    isError: storesError,
    refetch: refetchStores,
  } = useAdminStores({ status: "pending", limit: 5 });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useAdminAnalytics("month");

  const recentOrders = recentOrdersData?.orders ?? [];
  const pendingStores = pendingStoresData?.stores ?? [];
  const salesChartData = analyticsData?.salesChart ?? [];
  const categoryBreakdown = analyticsData?.categoryBreakdown ?? [];

  useEffect(() => {
    if (!authLoading && (!user || !isAdminRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [authLoading, user, router, t]);

  if (authLoading || statsLoading || ordersLoading || storesLoading || analyticsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AdminDashboardSkeleton />
      </div>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  const handleRetry = () => {
    if (statsError) refetchStats();
    if (ordersError) refetchOrders();
    if (storesError) refetchStores();
    if (analyticsError) refetchAnalytics();
  };

  if (statsError || ordersError || storesError || analyticsError) {
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

  const statCards = [
    {
      title: t("stats.revenue"),
      value: `OMR ${stats?.totalRevenue?.toLocaleString() ?? 0}`,
      change: stats?.revenueChange ?? 0,
      icon: DollarSign,
      trend: (stats?.revenueChange ?? 0) >= 0 ? "up" : "down",
    },
    {
      title: t("stats.users"),
      value: stats?.totalUsers?.toLocaleString() ?? "0",
      change: stats?.usersChange ?? 0,
      icon: Users,
      trend: (stats?.usersChange ?? 0) >= 0 ? "up" : "down",
    },
    {
      title: t("stats.stores"),
      value: stats?.totalStores?.toLocaleString() ?? "0",
      change: stats?.storesChange ?? 0,
      icon: Store,
      trend: (stats?.storesChange ?? 0) >= 0 ? "up" : "down",
    },
    {
      title: t("stats.orders"),
      value: stats?.totalOrders?.toLocaleString() ?? "0",
      change: stats?.ordersChange ?? 0,
      icon: ShoppingBag,
      trend: (stats?.ordersChange ?? 0) >= 0 ? "up" : "down",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      processing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      shipped: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      delivered: "bg-green-100 text-green-800 hover:bg-green-100",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
      refunded: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "approved":
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button variant="outline" onClick={handleRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("refresh")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("charts.sales.title")}
            </CardTitle>
            <CardDescription>{t("charts.sales.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`OMR ${value}`, "Sales"]} />
                  <Area
                    type="monotone"
                    dataKey="sales"
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

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("charts.categories.title")}
            </CardTitle>
            <CardDescription>{t("charts.categories.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`OMR ${value}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("charts.noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            {t("tabs.recentOrders")}
          </TabsTrigger>
          <TabsTrigger value="stores">
            <Store className="h-4 w-4 mr-2" />
            {t("tabs.pendingStores")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentOrders.title")}</CardTitle>
              <CardDescription>{t("recentOrders.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("recentOrders.empty")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
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
                          {order.customerName} · {order.storeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">OMR {order.total?.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length ?? 0} {t("items")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/dashboard/admin/orders")}
              >
                {t("viewAllOrders")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>{t("pendingStores.title")}</CardTitle>
              <CardDescription>{t("pendingStores.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingStores.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("pendingStores.empty")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingStores.map((store: any) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(store.verificationStatus)}
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {store.ownerName} · {store.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => router.push(`/dashboard/admin/stores?verify=${store.id}`)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("verify")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t("reject")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/dashboard/admin/stores")}
              >
                {t("viewAllStores")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
