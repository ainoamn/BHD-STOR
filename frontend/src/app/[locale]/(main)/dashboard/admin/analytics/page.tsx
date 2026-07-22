"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAnalytics } from "@/hooks/useAdmin";
import type { AdminAnalyticsPeriod } from "@/services/analytics.service";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  RefreshCw,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
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
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[350px] rounded-lg" />
        <Skeleton className="h-[350px] rounded-lg" />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const t = useTranslations("dashboard.admin.analytics");
  const router = useRouter();
  const { user } = useAuth();

  const [period, setPeriod] = useState<AdminAnalyticsPeriod>("month");

  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminAnalytics(period);

  useEffect(() => {
    if (!isLoading && (!user || !isAdminRole(user.role))) {
      toast.error(t("unauthorized"));
      router.push("/");
    }
  }, [user, isLoading, router, t]);

  if (!user || !isAdminRole(user.role)) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AnalyticsSkeleton />
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

  const summary = analytics?.summary ?? {};
  const salesData = analytics?.salesChart ?? [];
  const topProducts = analytics?.topProducts ?? [];
  const categoryBreakdown = analytics?.categoryBreakdown ?? [];
  const revenueBreakdown = analytics?.revenueBreakdown ?? [];
  const platformGrowth = analytics?.platformGrowth ?? [];

  const statCards = [
    {
      title: t("stats.totalRevenue"),
      value: `OMR ${(summary.totalRevenue ?? 0).toLocaleString()}`,
      change: summary.revenueChange ?? 0,
      icon: DollarSign,
      trend: (summary.revenueChange ?? 0) >= 0 ? "up" : "down",
    },
    {
      title: t("stats.totalOrders"),
      value: (summary.totalOrders ?? 0).toLocaleString(),
      change: summary.ordersChange ?? 0,
      icon: ShoppingBag,
      trend: (summary.ordersChange ?? 0) >= 0 ? "up" : "down",
    },
    {
      title: t("stats.newUsers"),
      value: (summary.newUsers ?? 0).toLocaleString(),
      change: summary.usersChange ?? 0,
      icon: Users,
      trend: (summary.usersChange ?? 0) >= 0 ? "up" : "down",
    },
    {
      title: t("stats.newStores"),
      value: (summary.newStores ?? 0).toLocaleString(),
      change: summary.storesChange ?? 0,
      icon: Store,
      trend: (summary.storesChange ?? 0) >= 0 ? "up" : "down",
    },
  ];

  const periods: { value: AdminAnalyticsPeriod; label: string }[] = [
    { value: "week", label: t("periods.week") },
    { value: "month", label: t("periods.month") },
    { value: "year", label: t("periods.year") },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("refresh")}
          </Button>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as AdminAnalyticsPeriod)}>
            <TabsList>
              {periods.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Stats */}
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
                          <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>
                          {stat.change > 0 ? "+" : ""}
                          {stat.change}%
                        </span>
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

      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("charts.sales.title")}
            </CardTitle>
            <CardDescription>{t("charts.sales.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "sales") return [`OMR ${value}`, t("charts.sales.label")];
                      return [value, t("charts.orders.label")];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2}
                    name="sales"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                    strokeWidth={2}
                    name="orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("charts.noData")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("charts.topProducts.title")}
              </CardTitle>
              <CardDescription>{t("charts.topProducts.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`OMR ${value}`, t("charts.topProducts.revenue")]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("charts.noData")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                {t("charts.revenueBreakdown.title")}
              </CardTitle>
              <CardDescription>{t("charts.revenueBreakdown.description")}</CardDescription>
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
                      nameKey="name"
                    >
                      {categoryBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`OMR ${value}`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("charts.noData")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Growth */}
      {platformGrowth.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("charts.growth.title")}
              </CardTitle>
              <CardDescription>{t("charts.growth.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={platformGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name={t("charts.growth.users")}
                  />
                  <Area
                    type="monotone"
                    dataKey="stores"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name={t("charts.growth.stores")}
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Footer Note */}
      <p className="text-sm text-muted-foreground text-center">
        {t("lastUpdated")}: {new Date().toLocaleString()}
      </p>
    </div>
  );
}
