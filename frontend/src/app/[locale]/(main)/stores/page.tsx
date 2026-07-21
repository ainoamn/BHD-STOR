"use client";

import { useTranslations } from "next-intl";
import { Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStores } from "@/hooks/useStores";
import { FeaturedStores } from "@/components/home/FeaturedStores";

export default function StoresPage() {
  const t = useTranslations("pages.stores");
  const { data, isLoading, isError } = useStores();
  const stores = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : isError && stores.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("error")}</p>
        </div>
      ) : (
        <FeaturedStores
          stores={stores as any}
          title={t("allStores")}
          viewAllHref="/stores"
        />
      )}
    </div>
  );
}
