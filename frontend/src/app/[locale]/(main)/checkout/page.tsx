"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useCreateOrder } from "@/hooks/useOrders";
import { useProcessPayment } from "@/hooks/usePayments";

function mapPaymentGateway(method: string): string {
  switch (method) {
    case "cod":
      return "cod";
    case "omanNet":
      return "oman_net";
    case "thawani":
      return "thawani";
    case "card":
      return "stripe";
    default:
      return method;
  }
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { data: cart, isLoading } = useCart();
  const createOrder = useCreateOrder();
  const processPayment = useProcessPayment();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);

  const rawCart = cart as any;
  const items = rawCart?.items ?? [];
  const subtotal =
    rawCart?.subtotal ??
    items.reduce((sum: number, item: any) => sum + Number(item.price ?? item.unitPrice) * Number(item.quantity), 0);
  const discount = rawCart?.discount ?? rawCart?.couponDiscount ?? rawCart?.discountTotal ?? 0;
  const shipping =
    shippingMethod === "express" ? 3 : shippingMethod === "sameDay" ? 5 : 1.5;
  const total = Number(subtotal) - Number(discount) + shipping;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error(t("errors.sessionExpired"));
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !city.trim() || !street.trim()) {
      toast.error(t("errors.addressRequired"));
      return;
    }
    if (items.length === 0) {
      toast.error(tCart("empty"));
      router.push("/cart");
      return;
    }

    const orderItems = items
      .map((item: any) => ({
        productId: String(item.productId || item.product?.id || ""),
        quantity: Number(item.quantity) || 1,
        variantAttributes: item.variantAttributes || undefined,
      }))
      .filter((item: { productId: string }) => Boolean(item.productId));

    if (orderItems.length === 0) {
      toast.error(t("errors.paymentFailed"));
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        items: orderItems,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          street: street.trim(),
          country: "OM",
          governorate: city.trim(),
        },
        paymentMethod,
        shippingMethod,
        currency: "OMR",
        couponCode: rawCart?.couponCode || undefined,
      });

      const orderId = (order as any)?.id || (order as any)?.data?.id;
      const gateway = mapPaymentGateway(paymentMethod);

      if (orderId && gateway !== "cod") {
        const payment = await processPayment.mutateAsync({
          orderId,
          method: paymentMethod === "cod" ? "cash_on_delivery" : "credit_card",
          gateway,
          returnUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}/orders`
              : "/orders",
        } as any);

        const redirectUrl =
          (payment as any)?.checkoutUrl ||
          (payment as any)?.redirectUrl ||
          (payment as any)?.payment?.checkoutUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
      } else if (orderId && gateway === "cod") {
        await processPayment.mutateAsync({
          orderId,
          method: "cash_on_delivery",
          gateway: "cod",
        } as any);
      }

      toast.success(t("confirmation.title"));
      router.push(orderId ? `/orders/${orderId}` : "/orders");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t("errors.paymentFailed");
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{tCart("empty")}</p>
        <Button onClick={() => (window.location.href = "/products")}>
          {tCart("browseProducts")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="space-y-4 border rounded-lg p-5">
            <h2 className="font-semibold text-lg">{t("shipping.title")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("shipping.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("shipping.phone")}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("shipping.city")}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="street">{t("shipping.street")}</Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <h3 className="font-medium">{t("shipping.methods.title")}</h3>
              <div className="space-y-2">
                {[
                  { id: "standard", label: t("shipping.methods.standard"), desc: t("shipping.methods.standardDesc") },
                  { id: "express", label: t("shipping.methods.express"), desc: t("shipping.methods.expressDesc") },
                  { id: "sameDay", label: t("shipping.methods.sameDay"), desc: t("shipping.methods.sameDayDesc") },
                ].map((method) => (
                  <label
                    key={method.id}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={() => setShippingMethod(method.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 border rounded-lg p-5">
            <h2 className="font-semibold text-lg">{t("payment.title")}</h2>
            <div className="space-y-2">
              {[
                { id: "cod", label: t("payment.methods.cod") },
                { id: "omanNet", label: t("payment.methods.omanNet") },
                { id: "thawani", label: t("payment.methods.thawani") },
                { id: "card", label: t("payment.methods.creditCard") },
              ].map((method) => (
                <label
                  key={method.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <span className="text-sm font-medium">{method.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("payment.secureNote")}</p>
          </section>
        </div>

        <aside className="border rounded-lg p-5 h-fit space-y-4 bg-muted/20">
          <h2 className="font-semibold">{t("review.orderSummary")}</h2>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {item.image || item.product?.images?.[0] ? (
                    <img
                      src={item.image || item.product?.images?.[0]}
                      alt={item.name || item.product?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.name || item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(Number(item.price ?? item.unitPrice) * Number(item.quantity))}
                </p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("review.subtotal")}</span>
              <span>{formatPrice(Number(subtotal))}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{t("review.discount")}</span>
                <span>-{formatPrice(Number(discount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("review.shipping")}</span>
              <span>{formatPrice(shipping)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>{t("review.total")}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={submitting || createOrder.isPending || processPayment.isPending}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("review.placeOrder")
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {t("review.placeOrderNote")}
          </p>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => (window.location.href = "/cart")}
          >
            {tCart("title")}
          </Button>
        </aside>
      </div>
    </div>
  );
}
