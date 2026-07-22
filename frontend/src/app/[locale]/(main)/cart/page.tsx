"use client";

import { useTranslations } from "next-intl";
import { Package, ShoppingBag, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
} from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";

export default function CartPage() {
  const t = useTranslations("cart");
  const { formatPrice } = useCurrency();
  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();

  const rawCart = cart as any;
  const items = rawCart?.items ?? [];
  const subtotal =
    rawCart?.subtotal ??
    rawCart?.grandTotal ??
    items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);
  const discount = rawCart?.discount ?? rawCart?.couponDiscount ?? rawCart?.discountTotal ?? 0;
  const shipping = rawCart?.shipping ?? rawCart?.shippingTotal ?? 0;
  const total = rawCart?.total ?? rawCart?.grandTotal ?? subtotal - Number(discount) + Number(shipping);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">{t("empty")}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">{t("emptySubtitle")}</p>
        <Button onClick={() => (window.location.href = "/products")}>
          {t("browseProducts")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-8">
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
              className="flex gap-4 p-4 border rounded-lg bg-card"
            >
              <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.storeName ? (
                      <p className="text-sm text-muted-foreground">{item.storeName}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeItem.mutate(
                        { itemId: item.id },
                        { onSuccess: () => toast.success(t("itemRemoved")) }
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
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
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

        <aside className="border rounded-lg p-5 h-fit space-y-4 bg-muted/20">
          <h2 className="font-semibold">{t("summary.title")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("summary.subtotal")}</span>
              <span>{formatPrice(Number(subtotal))}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{t("summary.discount")}</span>
                <span>-{formatPrice(Number(discount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("summary.shipping")}</span>
              <span>
                {Number(shipping) > 0
                  ? formatPrice(Number(shipping))
                  : t("summary.shippingEstimate")}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
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
          <p className="text-xs text-center text-muted-foreground">
            {t("summary.secureCheckout")}
          </p>
          {clearCart.isPending || updateItem.isPending || removeItem.isPending ? (
            <div className="flex justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
