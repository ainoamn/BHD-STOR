"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useApplyCoupon,
  useRemoveCoupon,
} from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";

import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  Package,
  Loader2,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

interface CartItemView {
  id: string;
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  stock: number;
  variant?: string;
  storeName: string;
}

interface SmartCartProps {
  isOpen: boolean;
  onClose: () => void;
}

function normalizeItems(cart: any): CartItemView[] {
  const items = cart?.items ?? [];
  return items.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    name: item.name ?? item.product?.name ?? "Product",
    image: item.image ?? item.product?.images?.[0],
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    stock: Number(item.stock ?? item.maxQuantity ?? 99),
    variant: item.variant ?? item.variantName,
    storeName: item.storeName ?? item.store?.name ?? "",
  }));
}

function cartTotals(cart: any) {
  const items = normalizeItems(cart);
  const subtotal =
    cart?.subtotal ??
    cart?.totals?.subtotal ??
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount =
    cart?.discount ?? cart?.couponDiscount ?? cart?.discountTotal ?? 0;
  const shipping =
    cart?.shipping ?? cart?.shippingTotal ?? cart?.totals?.shipping ?? 0;
  const total =
    cart?.total ??
    cart?.grandTotal ??
    cart?.totals?.total ??
    subtotal - discount + shipping;
  return { subtotal, discount, shipping, total };
}

export function SmartCart({ isOpen, onClose }: SmartCartProps) {
  const t = useTranslations("cart");
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [couponCode, setCouponCode] = useState("");

  const { data: cart, isLoading } = useCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveFromCart();
  const applyCouponMutation = useApplyCoupon();
  const removeCouponMutation = useRemoveCoupon();

  const rawCart = cart as any;
  const items = normalizeItems(rawCart);
  const { subtotal, discount, shipping, total } = cartTotals(rawCart);
  const appliedCoupon =
    rawCart?.coupon ?? (rawCart?.couponCode ? { code: rawCart.couponCode } : null);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItemMutation.mutate(
      { itemId, quantity: newQuantity },
      {
        onError: () => {
          toast.error(t("stockUnavailable"));
        },
      }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(
      { itemId },
      {
        onSuccess: () => {
          toast.success(t("itemRemoved"));
        },
        onError: () => {
          toast.error(t("stockUnavailable"));
        },
      }
    );
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.warning(t("summary.couponPlaceholder"));
      return;
    }
    applyCouponMutation.mutate(couponCode.trim(), {
      onSuccess: () => {
        toast.success(t("summary.couponApplied"));
        setCouponCode("");
      },
      onError: () => {
        toast.error(t("summary.invalidCoupon"));
      },
    });
  };

  const handleRemoveCoupon = () => {
    removeCouponMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("cartUpdated"));
      },
    });
  };

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-0 end-0 h-full w-full sm:w-[420px] bg-background z-50 shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{t("title")}</h2>
                {itemCount > 0 && (
                  <Badge>{itemCount}</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex-1 p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-20 w-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t("empty")}</h3>
                <p className="text-sm text-muted-foreground mb-6">{t("emptySubtitle")}</p>
                <Button
                  onClick={() => {
                    onClose();
                    router.push("/products");
                  }}
                >
                  {t("browseProducts")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div
                          className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                          onClick={() => router.push(`/products/${item.productId}`)}
                        >
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

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                                onClick={() => router.push(`/products/${item.productId}`)}
                              >
                                {item.name}
                              </p>
                              {item.storeName ? (
                                <p className="text-xs text-muted-foreground">{item.storeName}</p>
                              ) : null}
                              {item.variant ? (
                                <p className="text-xs text-muted-foreground">{item.variant}</p>
                              ) : null}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                            >
                              {removeItemMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updateItemMutation.isPending}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock || updateItemMutation.isPending}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-semibold text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="pt-2">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-emerald-600" />
                            <div>
                              <p className="text-sm font-medium text-emerald-800">
                                {appliedCoupon.code}
                              </p>
                              <p className="text-xs text-emerald-600">
                                {t("summary.discount")}: {formatPrice(discount)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleRemoveCoupon}
                            disabled={removeCouponMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={t("summary.couponPlaceholder")}
                              className="ps-9"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={applyCouponMutation.isPending}
                          >
                            {applyCouponMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("summary.applyCoupon")
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                <div className="border-t bg-muted/30 p-4 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("summary.subtotal")}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>{t("summary.discount")}</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("summary.shipping")}</span>
                      <span>
                        {shipping > 0 ? formatPrice(shipping) : t("summary.freeShipping")}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>{t("summary.total")}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    {t("summary.proceedToCheckout")}
                    <ChevronRight className="ms-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      onClose();
                      router.push("/cart");
                    }}
                  >
                    {t("title")}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CartTrigger({
  onClick,
  itemCount,
}: {
  onClick: () => void;
  itemCount: number;
}) {
  const t = useTranslations("cart");
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
      aria-label={t("title")}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          className="absolute -top-1 -end-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </Button>
  );
}
