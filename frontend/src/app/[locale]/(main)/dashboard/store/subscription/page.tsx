"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, CreditCard, Percent } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { isSellerRole } from "@/lib/auth-helpers";
import { api } from "@/services/api";

type Plan = {
  id: string;
  name: string;
  nameAr?: string;
  tier: string;
  description?: string;
  descriptionAr?: string;
  priceMonthly: number;
  priceYearly: number;
  transactionFeePercent: number;
  productLimit: number;
};

type Monetization = {
  mode: "subscription" | "percentage" | "hybrid";
  subscriptionPlan: string;
  commissionRate: number;
  currentPlan: Plan | null;
  plans: Plan[];
};

export default function StoreSubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<Monetization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"subscription" | "percentage">("percentage");
  const [selectedTier, setSelectedTier] = useState("basic");
  const [commissionPercent, setCommissionPercent] = useState(10);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSellerRole(user.role)) {
      router.push("/auth/login?redirect=/dashboard/store/subscription");
      return;
    }
    void load();
  }, [user, authLoading, router]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Monetization }>(
        "/subscriptions/me"
      );
      const payload = res.data.data;
      setData(payload);
      setMode(
        payload.mode === "subscription" ? "subscription" : "percentage"
      );
      setSelectedTier(payload.subscriptionPlan || "basic");
      setCommissionPercent(Number(payload.commissionRate || 10));
    } catch {
      // Public plans fallback
      try {
        const plansRes = await api.get<{ success: boolean; data: Plan[] }>(
          "/subscriptions/plans"
        );
        setData({
          mode: "percentage",
          subscriptionPlan: "free",
          commissionRate: 10,
          currentPlan: null,
          plans: plansRes.data.data || [],
        });
      } catch {
        toast.error("تعذر تحميل الباقات");
      }
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const body =
        mode === "percentage"
          ? { mode: "percentage", commissionPercent }
          : { mode: "subscription", planTier: selectedTier };
      const res = await api.post<{ success: boolean; data: Monetization }>(
        "/subscriptions/choose",
        body
      );
      setData(res.data.data);
      toast.success("تم حفظ اختيار التسعير");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "تعذر حفظ الاختيار"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plans = data?.plans || [];

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">باقات الاشتراك أو العمولة</h1>
          <p className="text-muted-foreground text-sm mt-1">
            اختر اشتراكاً شهرياً أو نسبة عمولة على المبيعات — قابل للتعديل لاحقاً من الأدمن.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/store")}>
          لوحة المتجر
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("subscription")}
          className={`rounded-lg border p-4 text-start transition ${
            mode === "subscription" ? "border-primary bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-4 w-4" />
            اشتراك شهري
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ادفع باقة ثابتة ورسوم معاملات أقل (أو صفر في الريادة).
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode("percentage")}
          className={`rounded-lg border p-4 text-start transition ${
            mode === "percentage" ? "border-primary bg-primary/5" : ""
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Percent className="h-4 w-4" />
            نسبة عمولة
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            بدون اشتراك شهري — عمولة على كل طلب (افتراضي 10%).
          </p>
        </button>
      </div>

      {mode === "percentage" ? (
        <div className="border rounded-lg p-5 space-y-3 max-w-md">
          <label className="text-sm font-medium">نسبة العمولة (%)</label>
          <input
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            الوضع الحالي: {data?.mode} · {data?.commissionRate}%
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const selected = selectedTier === plan.tier;
            return (
              <button
                key={plan.id || plan.tier}
                type="button"
                onClick={() => setSelectedTier(plan.tier)}
                className={`rounded-lg border p-5 text-start space-y-2 transition ${
                  selected ? "border-primary ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-lg">
                    {plan.nameAr || plan.name}
                  </h2>
                  {selected && (
                    <Badge className="gap-1">
                      <Check className="h-3 w-3" />
                      مختار
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.descriptionAr || plan.description}
                </p>
                <p className="text-sm font-medium">
                  {Number(plan.priceMonthly).toFixed(3)} ر.ع / شهر
                </p>
                <p className="text-xs text-muted-foreground">
                  رسوم المعاملات: {Number(plan.transactionFeePercent)}% · حد المنتجات:{" "}
                  {plan.productLimit === 0 ? "غير محدود" : plan.productLimit}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <Button size="lg" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الاختيار"}
      </Button>
    </div>
  );
}
