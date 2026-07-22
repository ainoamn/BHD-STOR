"use client";

import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { TrendingProducts } from "@/components/home/TrendingProducts";

export default function DealsPage() {
  const t = useTranslations("pages.deals");
  const { data: products = [], isLoading } = useFeaturedProducts();

  const dealProducts = products
    .filter((p: any) => p.compareAtPrice && p.compareAtPrice > p.price)
    .map((p: any) => ({ ...p, isOnSale: true }));

  const displayProducts = dealProducts.length > 0 ? dealProducts : products;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Badge variant="error" className="text-sm px-3 py-1">
          {t("badge")}
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <TrendingProducts
          products={displayProducts as any}
          title={t("hotDeals")}
          viewAllHref="/deals"
        />
      )}
    </div>
  );
}
