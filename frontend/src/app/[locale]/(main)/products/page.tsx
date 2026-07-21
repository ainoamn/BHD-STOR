"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import { TrendingProducts } from "@/components/home/TrendingProducts";

export default function ProductsPage() {
  const t = useTranslations("pages.products");
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const { data, isLoading, isError } = useProducts(
    search ? { search } : {}
  );

  const products = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {search && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>{t("searchResults", { query: search })}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : isError && products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("error")}</p>
        </div>
      ) : (
        <TrendingProducts
          products={products as any}
          title={search ? t("searchTitle") : t("allProducts")}
          viewAllHref="/products"
        />
      )}
    </div>
  );
}
