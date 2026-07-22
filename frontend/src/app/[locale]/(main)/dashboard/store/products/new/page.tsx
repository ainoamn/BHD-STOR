"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";

import { SellerProductForm } from "@/components/store/SellerProductForm";
import { useAuth } from "@/hooks/useAuth";
import { isSellerRole } from "@/lib/auth-helpers";
import { api } from "@/services/api";

export default function NewStoreProductPage() {
  const t = useTranslations("dashboard.products");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [storeId, setStoreId] = useState<string>("");
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSellerRole(user.role)) {
      router.replace("/auth/login?redirect=/dashboard/store/products/new");
      return;
    }

    const fromUser = user.storeId || user.store?.id || "";
    if (fromUser) {
      setStoreId(fromUser);
      setResolving(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any>("/stores/me");
        const id = res.data?.data?.id || res.data?.id || "";
        if (!cancelled) setStoreId(id);
      } catch {
        if (!cancelled) setStoreId("");
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  if (authLoading || resolving) {
    return (
      <div className="container mx-auto flex justify-center px-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link
          href="/dashboard/store"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          {t("title")}
        </Link>
        <h1 className="text-2xl font-bold">{t("addProduct")}</h1>
      </div>

      {!storeId ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          لا يمكن إنشاء منتج بدون متجر مرتبط. أكمل إعداد المتجر أولاً.
        </p>
      ) : (
        <div className="rounded-lg border p-5">
          <SellerProductForm mode="create" storeId={storeId} />
        </div>
      )}
    </div>
  );
}
