"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/Button";
import {
  Smartphone,
  Shirt,
  Sofa,
  Apple,
  Wrench,
  Dumbbell,
  BookOpen,
  Watch,
  Car,
  Gift,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount?: number;
}

interface CategoriesSectionProps {
  categories: Category[];
}

const iconMap: Record<string, React.ElementType> = {
  electronics: Smartphone,
  fashion: Shirt,
  clothing: Shirt,
  home: Sofa,
  furniture: Sofa,
  grocery: Apple,
  food: Apple,
  services: Wrench,
  sports: Dumbbell,
  books: BookOpen,
  accessories: Watch,
  automotive: Car,
  gifts: Gift,
  default: Sparkles,
};

function getCategoryIcon(categoryName: string): React.ElementType {
  const lower = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return icon;
  }
  return iconMap.default;
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const router = useRouter();
  const t = useTranslations("home.categories");

  if (!categories || categories.length === 0) {
    return (
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      </div>
    );
  }

  const displayCategories = categories.slice(0, 12);

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/categories")}>
          {t("viewAll")}
          <MoreHorizontal className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {displayCategories.map((category) => {
          const Icon = getCategoryIcon(category.name);
          return (
            <button
              key={category.id}
              type="button"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/categories/${category.slug}`)}
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <Icon className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                  {category.name}
                </p>
                {category.productCount !== undefined && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {category.productCount.toLocaleString()} {t("products")}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoriesSectionSkeleton() {
  return (
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
