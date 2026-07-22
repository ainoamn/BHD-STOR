"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Package,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  useApplyCoupon,
  useRemoveCoupon,
} from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";

export default function CartPage() {
  const t = useTranslations("cart");
  const { formatPrice } = useCurrency();
  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const [couponCode, setCouponCode] = useState("");

  const rawCart = cart as any;
  const items = rawCart?.items ?? [];
  const subtotal =
    rawCart?.subtotal ??
    rawCart?.grandTotal ??
    items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.price) * Number(item.quantity),
      0,
    );
  const discount =
    rawCart?.discount ?? rawCart?.couponDiscount ?? rawCart?.discountTotal ?? 0;
  const shipping = rawCart?.shipping ?? rawCart?.shippingTotal ?? 0;
  const total =
    rawCart?.total ??
    rawCart?.grandTotal ??
    subtotal - Number(discount) + Number(shipping);
  const appliedCoupon =
    rawCart?.coupon ??
    (rawCart?.couponCode ? { code: rawCart.couponCode } : null);

  const onApplyCoupon = () => {
    const code = couponCode.trim();
    if (!code) {
      toast.warning(t("summary.couponPlaceholder"));
      return;
    }
    applyCoupon.mutate(code, {
      onSuccess: () => {
        toast.success(t("summary.couponApplied"));
        setCouponCode("");
      },
      onError: () => {
        toast.error(t("summary.invalidCoupon"));
      },
    });
  };

  const onRemoveCoupon = () => {
    removeCoupon.mutate(undefined, {
      onSuccess: () => toast.success(t("cartUpdated")),
      onError: (err: any) =>
        toast.error(err?.message || "تعذر إزالة الكوبون"),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || items.length === 0) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">{t("empty")}</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          {t("emptySubtitle")}
        </p>
        <Button onClick={() => (window.location.href = "/products")}>
          {t("browseProducts")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            clearCart.mutate(undefined, {
              onSuccess: () => toast.success(t("cartUpdated")),
            })
          }
          disabled={clearCart.isPending}
        >
          {t("clearCart")}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border bg-card p-4"
            >
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.storeName ? (
                      <p className="text-sm text-muted-foreground">
                        {item.storeName}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeItem.mutate(
                        { itemId: item.id },
                        {
                          onSuccess: () => toast.success(t("itemRemoved")),
                        },
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      onClick={() =>
                        updateItem.mutate({
                          itemId: item.id,
                          quantity: item.quantity - 1,
                        })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={updateItem.isPending}
                      onClick={() =>
                        updateItem.mutate({
                          itemId: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(Number(item.price) * Number(item.quantity))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-lg border bg-muted/20 p-5">
          <h2 className="font-semibold">{t("summary.title")}</h2>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("summary.coupon")}</p>
            {appliedCoupon?.code ? (
              <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Tag className="h-4 w-4 text-primary" />
                  {appliedCoupon.code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={removeCoupon.isPending}
                  onClick={onRemoveCoupon}
                >
                  {removeCoupon.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("summary.couponPlaceholder")}
                    className="ps-9"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onApplyCoupon()}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={onApplyCoupon}
                  disabled={applyCoupon.isPending}
                >
                  {applyCoupon.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("summary.applyCoupon")
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("summary.subtotal")}
              </span>
              <span>{formatPrice(Number(subtotal))}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{t("summary.discount")}</span>
                <span>-{formatPrice(Number(discount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("summary.shipping")}
              </span>
              <span>
                {Number(shipping) > 0
                  ? formatPrice(Number(shipping))
                  : t("summary.shippingEstimate")}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>{t("summary.total")}</span>
              <span>{formatPrice(Number(total))}</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => (window.location.href = "/checkout")}
          >
            {t("summary.proceedToCheckout")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/products")}
          >
            {t("continueShopping")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t("summary.secureCheckout")}
          </p>
          {clearCart.isPending ||
          updateItem.isPending ||
          removeItem.isPending ||
          applyCoupon.isPending ||
          removeCoupon.isPending ? (
            <div className="flex justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
