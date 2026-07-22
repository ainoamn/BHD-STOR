"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";

import { SellerProductForm } from "@/components/store/SellerProductForm";
import { useAuth } from "@/hooks/useAuth";
import { useProduct } from "@/hooks/useProducts";
import { isSellerRole } from "@/lib/auth-helpers";
import { api } from "@/services/api";

export default function EditStoreProductPage() {
  const t = useTranslations("dashboard.products");
  const params = useParams();
  const productId = String(params?.id || "");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: product, isLoading, isError } = useProduct(productId);
  const [storeId, setStoreId] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSellerRole(user.role)) {
      router.replace(
        `/auth/login?redirect=/dashboard/store/products/${productId}/edit`,
      );
      return;
    }

    const fromUser = user.storeId || user.store?.id || "";
    if (fromUser) {
      setStoreId(fromUser);
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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, productId]);

  if (authLoading || isLoading) {
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
        <h1 className="text-2xl font-bold">{t("editProduct")}</h1>
      </div>

      {isError || !product ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          تعذر تحميل المنتج.
        </p>
      ) : (
        <div className="rounded-lg border p-5">
          <SellerProductForm
            mode="edit"
            storeId={storeId || product.storeId}
            product={product}
          />
        </div>
      )}
    </div>
  );
}
