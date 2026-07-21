"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Grid3X3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";

export default function CategoriesPage() {
  const t = useTranslations("pages.categories");
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => router.push(`/products?category=${category.slug}`)}
            >
              <CardContent className="p-6 text-center space-y-2">
                <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {category.nameAr?.charAt(0) || category.name.charAt(0)}
                </div>
                <h3 className="font-semibold">{category.nameAr || category.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("productCount", { count: category.productCount ?? 0 })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
