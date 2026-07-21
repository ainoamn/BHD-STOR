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
  useAddToCart,
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

interface CartItem {
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

  const items: CartItem[] = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discount ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;
  const appliedCoupon = cart?.coupon;
  const itemCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItemMutation.mutate(
      { itemId, quantity: newQuantity },
      {
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || t("updateError"));
        },
      }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId, {
      onSuccess: () => {
        toast.success(t("itemRemoved"));
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || t("removeError"));
      },
    });
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.warning(t("enterCoupon"));
      return;
    }
    applyCouponMutation.mutate(couponCode.trim(), {
      onSuccess: (data: any) => {
        toast.success(t("couponApplied"), {
          description: data?.discount
            ? t("couponDiscount", { amount: data.discount })
            : undefined,
        });
        setCouponCode("");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || t("couponError"));
      },
    });
  };

  const handleRemoveCoupon = () => {
    removeCouponMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("couponRemoved"));
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
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background z-50 shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{t("title")}</h2>
                {itemCount > 0 && (
                  <Badge variant="secondary">{itemCount}</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
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
                <h3 className="text-lg font-medium mb-1">{t("empty.title")}</h3>
                <p className="text-sm text-muted-foreground mb-6">{t("empty.description")}</p>
                <Button onClick={() => { onClose(); router.push("/products"); }}>
                  {t("empty.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Cart Items */}
                    {items.map((item: CartItem) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 p-3 rounded-lg border bg-card"
                      >
                        {/* Image */}
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

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                                onClick={() => router.push(`/products/${item.productId}`)}
                              >
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.storeName}
                              </p>
                              {item.variant && (
                                <p className="text-xs text-muted-foreground">
                                  {item.variant}
                                </p>
                              )}
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
                            {/* Quantity Controls */}
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

                            {/* Price */}
                            <p className="font-semibold text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Coupon */}
                    <div className="pt-2">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {appliedCoupon.code}
                              </p>
                              <p className="text-xs text-green-600">
                                {t("couponSaved", { amount: formatPrice(discount) })}
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
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={t("couponPlaceholder")}
                              className="pl-9"
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
                              t("apply")
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer - Summary */}
                <div className="border-t bg-muted/30 p-4 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("subtotal")}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t("discount")}</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("shipping")}</span>
                      <span>
                        {shipping > 0 ? formatPrice(shipping) : t("freeShipping")}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>{t("total")}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    {t("checkout")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    size="sm"
                    onClick={() => { onClose(); router.push("/cart"); }}
                  >
                    {t("viewFullCart")}
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

export function CartTrigger({ onClick, itemCount }: { onClick: () => void; itemCount: number }) {
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
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          variant="destructive"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </Button>
  );
}
