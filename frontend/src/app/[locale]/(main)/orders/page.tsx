"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";

const statusIcon: Record<string, typeof Package> = {
  delivered: CheckCircle,
  processing: Clock,
  pending: Clock,
  confirmed: Clock,
  shipped: Truck,
  cancelled: XCircle,
};

const statusClass: Record<string, string> = {
  delivered: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-sky-100 text-sky-800",
  shipped: "bg-violet-100 text-violet-800",
  cancelled: "bg-red-100 text-red-800",
};

function orderTotal(order: any): number {
  return Number(
    order?.grandTotal ?? order?.total ?? order?.amount ?? 0,
  );
}

export default function OrdersPage() {
  const t = useTranslations("pages.orders");
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, isError } = useOrders({ page: 1, perPage: 20 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  const orders = data?.data ?? [];

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">تعذر تحميل الطلبات. حاول مرة أخرى.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="space-y-4 py-16 text-center">
          <Package className="mx-auto h-14 w-14 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link href="/products">
            <Button variant="outline">{t("browse")}</Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {orders.map((order: any) => {
            const status = String(order.status || "pending").toLowerCase();
            const Icon = statusIcon[status] || Package;
            const total = orderTotal(order);
            const currency = order.currency || "OMR";
            const storeName =
              order.store?.name ||
              order.storeName ||
              order.items?.[0]?.storeName ||
              "";

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </p>
                      {storeName ? (
                        <p className="text-sm text-muted-foreground">{storeName}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("ar-OM")
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Badge
                      variant="outline"
                      className={statusClass[status] || statusClass.pending}
                    >
                      {status}
                    </Badge>
                    <span className="font-bold text-primary">
                      {formatPrice ? formatPrice(total) : `${total.toFixed(3)} ${currency}`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
