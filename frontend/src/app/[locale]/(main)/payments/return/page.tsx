"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { verifyPayment } from "@/services/payments.service";

type Status = "loading" | "success" | "failed" | "skipped";

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const paymentId = searchParams.get("paymentId") || searchParams.get("payment_id") || "";
  const orderId = searchParams.get("orderId") || searchParams.get("order_id") || "";
  const gateway = searchParams.get("gateway") || "";
  const sessionId = searchParams.get("session_id") || "";

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("جارٍ التحقق من الدفع...");

  const orderHref = useMemo(
    () => (orderId ? `/orders/${orderId}` : "/orders"),
    [orderId],
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const qs = typeof window !== "undefined" ? window.location.search : "";
      router.replace(`/auth/login?redirect=${encodeURIComponent(`/payments/return${qs}`)}`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    let cancelled = false;

    async function run() {
      const id = paymentId || sessionId;
      if (!id) {
        if (!cancelled) {
          setStatus(orderId ? "skipped" : "failed");
          setMessage(
            orderId
              ? "تمت العودة من بوابة الدفع. افتح الطلب لمتابعة الحالة."
              : "معرّف الدفع غير موجود في الرابط.",
          );
        }
        return;
      }

      try {
        const result: any = await verifyPayment(id, gateway || undefined);
        if (cancelled) return;
        const ok =
          result?.success === true ||
          ["succeeded", "completed", "paid", "success"].includes(
            String(result?.status || "").toLowerCase(),
          );
        setStatus(ok ? "success" : "failed");
        setMessage(
          ok
            ? "تم تأكيد الدفع بنجاح."
            : `حالة الدفع: ${result?.status || "غير معروفة"}`,
        );
      } catch (err: any) {
        if (cancelled) return;
        setStatus(orderId ? "skipped" : "failed");
        setMessage(
          err?.message ||
            (orderId
              ? "تعذر التحقق الآن. يمكنك متابعة الطلب — قد يكتمل عبر الـ webhook."
              : "تعذر التحقق من الدفع."),
        );
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, paymentId, sessionId, gateway, orderId]);

  if (authLoading) {
    return (
      <div className="container mx-auto flex justify-center px-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto max-w-lg space-y-6 px-4 py-16 text-center">
      {status === "loading" ? (
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      ) : status === "success" ? (
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
      ) : status === "failed" ? (
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
      ) : (
        <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
      )}

      <h1 className="text-2xl font-bold">نتيجة الدفع</h1>
      <p className="text-muted-foreground">{message}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href={orderHref}>
          <Button>عرض الطلب</Button>
        </Link>
        <Link href="/orders">
          <Button variant="outline">كل الطلبات</Button>
        </Link>
      </div>
    </div>
  );
}
