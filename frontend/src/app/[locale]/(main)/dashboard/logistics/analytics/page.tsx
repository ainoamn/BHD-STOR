"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Star,
  Truck,
  Users,
  MapPin,
  Calendar,
  ChevronDown,
} from "lucide-react";

const periodOptions = ["Today", "This Week", "This Month", "This Year"];

const deliveryPerformance = [
  { period: "Week 1", onTime: 94, delayed: 6 },
  { period: "Week 2", onTime: 91, delayed: 9 },
  { period: "Week 3", onTime: 96, delayed: 4 },
  { period: "Week 4", onTime: 93, delayed: 7 },
];

const revenueData = [
  { month: "Aug", revenue: 42500, target: 40000 },
  { month: "Sep", revenue: 48200, target: 42000 },
  { month: "Oct", revenue: 45100, target: 44000 },
  { month: "Nov", revenue: 52300, target: 46000 },
  { month: "Dec", revenue: 56800, target: 50000 },
  { month: "Jan", revenue: 38900, target: 45000 },
];

const driverRanking = [
  { rank: 1, name: "Hamdan Al-Azri", deliveries: 735, rating: 4.9, onTime: 97 },
  { rank: 2, name: "Khalid Bin Said", deliveries: 1195, rating: 4.8, onTime: 94 },
  { rank: 3, name: "Fahad Al-Balushi", deliveries: 620, rating: 4.7, onTime: 93 },
  { rank: 4, name: "Said Al-Habsi", deliveries: 920, rating: 4.5, onTime: 91 },
  { rank: 5, name: "Majid Al-Siyabi", deliveries: 498, rating: 4.2, onTime: 88 },
];

const zonePerformance = [
  { zone: "Muscat Central", deliveries: 4520, onTime: 95, avgTime: 28 },
  { zone: "Seeb Coastal", deliveries: 3210, onTime: 92, avgTime: 35 },
  { zone: "Qurum West", deliveries: 2890, onTime: 94, avgTime: 22 },
  { zone: "Bawshar South", deliveries: 1870, onTime: 89, avgTime: 42 },
  { zone: "Sohar Industrial", deliveries: 950, onTime: 85, avgTime: 65 },
  { zone: "Salalah Coastal", deliveries: 680, onTime: 82, avgTime: 80 },
];

const vehicleUtilization = [
  { type: "Trucks", count: 12, utilized: 85, distance: 12400 },
  { type: "Vans", count: 8, utilized: 78, distance: 8900 },
  { type: "Bikes", count: 15, utilized: 92, distance: 5600 },
  { type: "Cars", count: 5, utilized: 65, distance: 4200 },
];

const customerSatisfaction = [
  { rating: 5, count: 892, percentage: 52 },
  { rating: 4, count: 534, percentage: 31 },
  { rating: 3, count: 189, percentage: 11 },
  { rating: 2, count: 68, percentage: 4 },
  { rating: 1, count: 34, percentage: 2 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("This Month");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance insights and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          {periodOptions.map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] text-emerald-600">
                <TrendingUp className="h-2.5 w-2.5 mr-1" />
                +12%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Deliveries</p>
            <p className="text-2xl font-bold">1,284</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] text-emerald-600">
                <TrendingUp className="h-2.5 w-2.5 mr-1" />
                +3%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">On-Time Rate</p>
            <p className="text-2xl font-bold text-emerald-600">93.2%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] text-emerald-600">
                <TrendingUp className="h-2.5 w-2.5 mr-1" />
                +0.2
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold">4.6</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Truck className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] text-red-500">
                <TrendingDown className="h-2.5 w-2.5 mr-1" />
                -2%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Fleet Utilization</p>
            <p className="text-2xl font-bold">87%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Delivery Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveryPerformance.map((d) => (
                <div key={d.period}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{d.period}</span>
                    <span className="text-emerald-600 font-medium">
                      {d.onTime}% on time
                    </span>
                  </div>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${d.onTime}%` }}
                    />
                    <div
                      className="bg-red-400 transition-all"
                      style={{ width: `${d.delayed}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {d.delayed}% delayed
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">Monthly Average</span>
              <span className="text-xl font-bold text-emerald-600">93.5%</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue (OMR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.map((r) => {
                const maxVal = Math.max(
                  ...revenueData.map((d) => d.revenue)
                );
                return (
                  <div key={r.month}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{r.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Target: OMR {r.target.toLocaleString()}
                        </span>
                        <span className="font-medium">
                          OMR {r.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                          r.revenue >= r.target
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${(r.revenue / maxVal) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute inset-y-0 border-r-2 border-dashed border-muted-foreground/40"
                        style={{
                          left: `${(r.target / maxVal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Driver Performance Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driverRanking.map((d, i) => (
                <div
                  key={d.rank}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500/10 text-amber-600"
                        : i === 1
                          ? "bg-slate-400/10 text-slate-500"
                          : i === 2
                            ? "bg-orange-600/10 text-orange-600"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{d.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{d.deliveries} deliveries</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        {d.rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600">
                      {d.onTime}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      on-time
                    </p>
                  </div>
                  <Progress
                    value={d.onTime}
                    className="w-20 h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerSatisfaction.map((s) => (
              <div key={s.rating}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span>{s.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {s.count} ({s.percentage}%)
                  </span>
                </div>
                <Progress value={s.percentage} className="h-2" />
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average</span>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">4.6</span>
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {customerSatisfaction.reduce((s, c) => s + c.count, 0)}{" "}
                ratings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Coverage Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Zone Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zonePerformance.map((z) => (
                <div
                  key={z.zone}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{z.zone}</p>
                    <p className="text-xs text-muted-foreground">
                      {z.deliveries.toLocaleString()} deliveries
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Avg Time
                      </p>
                      <p className="text-sm font-medium">{z.avgTime}m</p>
                    </div>
                    <div className="text-right w-14">
                      <p className="text-xs text-muted-foreground">On-Time</p>
                      <p
                        className={`text-sm font-medium ${
                          z.onTime >= 90
                            ? "text-emerald-600"
                            : z.onTime >= 80
                              ? "text-amber-600"
                              : "text-red-500"
                        }`}
                      >
                        {z.onTime}%
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={z.onTime}
                    className={`w-16 h-2 ${
                      z.onTime >= 90
                        ? "bg-emerald-100"
                        : z.onTime >= 80
                          ? "bg-amber-100"
                          : "bg-red-100"
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Vehicle Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicleUtilization.map((v) => (
                <div key={v.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{v.type}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {v.count}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{v.utilized}%</span>
                  </div>
                  <Progress value={v.utilized} className="h-2.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{(v.distance / 1000).toFixed(1)}k km this month</span>
                    <span>
                      {Math.round((v.distance / v.count) * 10) / 10} km/vehicle
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-primary/5 rounded-lg text-center">
                <p className="text-lg font-bold">
                  {Math.round(
                    vehicleUtilization.reduce((s, v) => s + v.utilized, 0) /
                      vehicleUtilization.length
                  )}
                  %
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Avg Utilization
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg text-center">
                <p className="text-lg font-bold">
                  {(vehicleUtilization.reduce((s, v) => s + v.distance, 0) / 1000).toFixed(1)}k
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Total Distance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
