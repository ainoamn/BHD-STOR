"use client";

import { useTranslations } from "next-intl";
import { Package, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { demoCustomerOrders } from "@/lib/demo-admin-data";

const statusConfig: Record<string, { label: string; className: string; icon: typeof Package }> = {
  delivered: { label: "تم التسليم", className: "bg-green-100 text-green-800", icon: CheckCircle },
  processing: { label: "قيد المعالجة", className: "bg-blue-100 text-blue-800", icon: Clock },
  pending: { label: "معلق", className: "bg-yellow-100 text-yellow-800", icon: Clock },
  shipped: { label: "تم الشحن", className: "bg-purple-100 text-purple-800", icon: Package },
};

export default function OrdersPage() {
  const t = useTranslations("pages.orders");

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        {demoCustomerOrders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.pending;
          const Icon = config.icon;
          return (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.storeName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("ar-OM")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={config.className}>
                    {config.label}
                  </Badge>
                  <span className="font-bold text-primary">
                    {order.total.toFixed(3)} {order.currency}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <Link href="/products">
          <Button variant="outline">{t("browse")}</Button>
        </Link>
      </div>
    </div>
  );
}
