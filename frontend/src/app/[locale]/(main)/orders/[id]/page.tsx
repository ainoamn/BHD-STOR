"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2, Package, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useCancelOrder, useOrder } from "@/hooks/useOrders";

function orderTotal(order: any): number {
  return Number(order?.grandTotal ?? order?.total ?? order?.amount ?? 0);
}

function canCancel(status?: string): boolean {
  const s = String(status || "").toLowerCase();
  return s === "pending" || s === "confirmed";
}

export default function OrderDetailPage() {
  const t = useTranslations("pages.orders");
  const params = useParams();
  const router = useRouter();
  const orderId = String(params?.id || "");
  const { formatPrice } = useCurrency();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: order, isLoading, isError, error } = useOrder(orderId);
  const cancelOrder = useCancelOrder();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=/orders/${orderId}`);
    }
  }, [authLoading, isAuthenticated, orderId, router]);

  const onCancel = async () => {
    if (!orderId) return;
    try {
      await cancelOrder.mutateAsync({
        orderId,
        reason: "Cancelled by customer",
      });
      toast.success("تم إلغاء الطلب");
    } catch (err: any) {
      toast.error(err?.message || "تعذر إلغاء الطلب");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isError || !order) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive opacity-70" />
        <h1 className="text-xl font-bold">تعذر عرض الطلب</h1>
        <p className="text-muted-foreground">
          {(error as Error)?.message || "الطلب غير موجود أو لا تملك صلاحية عرضه."}
        </p>
        <Link href="/orders">
          <Button variant="outline">العودة إلى طلباتي</Button>
        </Link>
      </div>
    );
  }

  const raw = order as any;
  const items = raw.items ?? [];
  const total = orderTotal(raw);
  const currency = raw.currency || "OMR";
  const address = raw.shippingAddress || {};
  const status = String(raw.status || "pending").toLowerCase();

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/orders"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            {t("title")}
          </Link>
          <h1 className="text-2xl font-bold">
            {raw.orderNumber || orderId.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {raw.createdAt
              ? new Date(raw.createdAt).toLocaleString("ar-OM")
              : ""}
          </p>
        </div>
        <Badge variant="outline" className="text-sm capitalize">
          {status}
        </Badge>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">المنتجات</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد عناصر في هذا الطلب.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((item: any) => (
              <li
                key={item.id || `${item.productId}-${item.name}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {item.name || item.product?.name || "منتج"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      × {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice
                    ? formatPrice(Number(item.total ?? item.price * item.quantity ?? 0))
                    : `${Number(item.total ?? 0).toFixed(3)} ${currency}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="font-semibold">الشحن</h2>
        <p className="text-sm text-muted-foreground">
          {[address.fullName, address.phone, address.street, address.city, address.governorate]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
        {raw.trackingNumber ? (
          <p className="text-sm">
            التتبع: <span className="font-mono">{raw.trackingNumber}</span>
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">الدفع</span>
          <span className="capitalize">{raw.paymentStatus || "—"}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>الإجمالي</span>
          <span className="text-primary">
            {formatPrice ? formatPrice(total) : `${total.toFixed(3)} ${currency}`}
          </span>
        </div>
      </section>

      {canCancel(status) ? (
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive/10"
          disabled={cancelOrder.isPending}
          onClick={onCancel}
        >
          {cancelOrder.isPending ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : null}
          إلغاء الطلب
        </Button>
      ) : null}
    </div>
  );
}
