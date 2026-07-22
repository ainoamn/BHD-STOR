"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useCreateOrder } from "@/hooks/useOrders";
import { useProcessPayment, useGateways } from "@/hooks/usePayments";
import { useCarriers } from "@/hooks/useShipping";

/** Client-side fee estimate aligned with backend order totals. */
function estimateShippingFee(carrierCode: string, subtotal: number): number {
  const code = (carrierCode || "standard").toLowerCase().replace(/-/g, "_");
  if (code === "standard" && subtotal >= 10) return 0;
  if (code === "express") return 3;
  if (code === "same_day" || code === "sameday") return 5;
  if (code.includes("local")) return 1.5;
  if (code.includes("aramex")) return 3.5;
  if (code === "dhl" || code === "dhl_oman" || code === "fedex" || code === "ups")
    return 5;
  if (code === "oman_post") return 2;
  return 2;
}

function mapPaymentGateway(code: string): string {
  const n = (code || "").toLowerCase().replace(/-/g, "_");
  if (n === "cash_on_delivery") return "cod";
  if (n === "omanNet" || n === "omannet") return "oman_net";
  if (n === "card") return "stripe";
  return n;
}

function paymentMethodForGateway(gateway: string): string {
  const g = mapPaymentGateway(gateway);
  if (g === "cod") return "cash_on_delivery";
  return "credit_card";
}

const FALLBACK_SHIPPING = [
  { code: "standard", name: "Standard" },
  { code: "express", name: "Express" },
  { code: "sameDay", name: "Same day" },
];

const FALLBACK_PAYMENTS = [
  { code: "cod", name: "Cash on Delivery" },
  { code: "thawani", name: "Thawani" },
  { code: "oman_net", name: "Oman Net" },
  { code: "stripe", name: "Card" },
];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { data: cart, isLoading } = useCart();
  const createOrder = useCreateOrder();
  const processPayment = useProcessPayment();
  const { data: carriersData, isLoading: carriersLoading } = useCarriers();
  const { data: gatewaysData, isLoading: gatewaysLoading } = useGateways();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const carriers = useMemo(() => {
    const list = (carriersData || []).filter((c) => c.isActive !== false);
    if (list.length > 0) {
      return list.map((c) => ({
        code: c.code || c.id,
        name: c.name,
      }));
    }
    return FALLBACK_SHIPPING.map((c) => ({
      code: c.code,
      name:
        c.code === "standard"
          ? t("shipping.methods.standard")
          : c.code === "express"
            ? t("shipping.methods.express")
            : t("shipping.methods.sameDay"),
    }));
  }, [carriersData, t]);

  const gateways = useMemo(() => {
    const list = (gatewaysData || []).filter((g) => g.isActive !== false);
    if (list.length > 0) {
      return list.map((g) => ({
        code: mapPaymentGateway(g.code),
        name: g.name,
      }));
    }
    return FALLBACK_PAYMENTS.map((g) => ({
      code: g.code,
      name:
        g.code === "cod"
          ? t("payment.methods.cod")
          : g.code === "oman_net"
            ? t("payment.methods.omanNet")
            : g.code === "thawani"
              ? t("payment.methods.thawani")
              : t("payment.methods.creditCard"),
    }));
  }, [gatewaysData, t]);

  useEffect(() => {
    if (!shippingMethod && carriers.length > 0) {
      setShippingMethod(carriers[0].code);
    }
  }, [carriers, shippingMethod]);

  useEffect(() => {
    if (!paymentMethod && gateways.length > 0) {
      const cod = gateways.find((g) => g.code === "cod");
      setPaymentMethod(cod?.code || gateways[0].code);
    }
  }, [gateways, paymentMethod]);

  const rawCart = cart as any;
  const items = rawCart?.items ?? [];
  const subtotal =
    rawCart?.subtotal ??
    items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.price ?? item.unitPrice) * Number(item.quantity),
      0
    );
  const discount =
    rawCart?.discount ?? rawCart?.couponDiscount ?? rawCart?.discountTotal ?? 0;
  const shipping = estimateShippingFee(shippingMethod || "standard", Number(subtotal));
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
    if (!shippingMethod) {
      toast.error(t("errors.addressRequired"));
      return;
    }
    if (!paymentMethod) {
      toast.error(t("errors.paymentFailed"));
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

    const gateway = mapPaymentGateway(paymentMethod);

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
        paymentMethod: gateway,
        shippingMethod,
        currency: "OMR",
        couponCode: rawCart?.couponCode || undefined,
      });

      const orderId = (order as any)?.id || (order as any)?.data?.id;

      if (orderId) {
        const payment = await processPayment.mutateAsync({
          orderId,
          method: paymentMethodForGateway(gateway),
          gateway,
          returnUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}/orders`
              : "/orders",
        } as any);

        if (gateway !== "cod") {
          const redirectUrl =
            (payment as any)?.checkoutUrl ||
            (payment as any)?.redirectUrl ||
            (payment as any)?.payment?.checkoutUrl;
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        }
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
              {carriersLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  …
                </p>
              )}
              <div className="space-y-2">
                {carriers.map((method) => (
                  <label
                    key={method.code}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.code}
                      checked={shippingMethod === method.code}
                      onChange={() => setShippingMethod(method.code)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium text-sm">{method.name}</p>
                        <p className="text-sm font-medium">
                          {formatPrice(
                            estimateShippingFee(method.code, Number(subtotal))
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {method.code}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 border rounded-lg p-5">
            <h2 className="font-semibold text-lg">{t("payment.title")}</h2>
            {gatewaysLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                …
              </p>
            )}
            <div className="space-y-2">
              {gateways.map((method) => (
                <label
                  key={method.code}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.code}
                    checked={paymentMethod === method.code}
                    onChange={() => setPaymentMethod(method.code)}
                  />
                  <span className="text-sm font-medium">{method.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("payment.secureNote")}
            </p>
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
                  <p className="text-sm truncate">
                    {item.name || item.product?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ×{item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(
                    Number(item.price ?? item.unitPrice) * Number(item.quantity)
                  )}
                </p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("review.subtotal")}
              </span>
              <span>{formatPrice(Number(subtotal))}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{t("review.discount")}</span>
                <span>-{formatPrice(Number(discount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("review.shipping")}
              </span>
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
            disabled={
              submitting ||
              createOrder.isPending ||
              processPayment.isPending ||
              !shippingMethod ||
              !paymentMethod
            }
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
