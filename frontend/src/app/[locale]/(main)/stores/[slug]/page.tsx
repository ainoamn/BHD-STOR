"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, MapPin, Package, Star, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreBySlug, useStoreProducts } from "@/hooks/useStores";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { StoreBarcodeCard } from "@/components/store/StoreBarcodeCard";

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const t = useTranslations("pages.storeDetail");

  const { data: store, isLoading, isError } = useStoreBySlug(slug);
  const s = store as any;
  const storeName = s?.nameAr || s?.name;
  const storeNameAlt = s?.name || s?.nameAr;

  const { data: products = [], isLoading: productsLoading } = useStoreProducts(
    s?.id ?? "",
    storeName || storeNameAlt
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Store className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">{t("notFound")}</h1>
        <Button onClick={() => router.push("/stores")}>{t("backToStores")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="relative h-48 md:h-64 bg-muted">
        {s.coverImage ? (
          <img src={s.coverImage} alt={storeName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Button>

        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-xl border-4 border-background bg-background shadow-lg overflow-hidden flex items-center justify-center">
            {s.logo ? (
              <img src={s.logo} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 pt-8">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold">{storeName}</h1>
              {s.isVerified && <Badge variant="outline">{t("verified")}</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">{s.category}</p>
            {s.description && <p className="mt-3 max-w-2xl">{s.description}</p>}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{s.rating?.toFixed(1) ?? "4.5"}</span>
                <span className="text-muted-foreground">({s.reviewsCount ?? 0})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{s.productsCount ?? products.length} {t("products")}</span>
              </div>
              {(s.city || s.location) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{s.city || s.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <StoreBarcodeCard
          variant="storefront"
          identity={{
            id: s.id,
            name: storeName || storeNameAlt || s.slug,
            slug: s.slug || slug,
            storeSerial: s.storeSerial,
            storeCode: s.storeCode,
            scanUrl: s.scanUrl,
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <TrendingProducts
            products={products as any}
            title={t("storeProducts")}
            viewAllHref={`/stores/${slug}`}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("noProducts")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
