"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Star, MapPin, Package, ChevronRight, Store } from "lucide-react";

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  category: string;
  address?: string;
  city?: string;
  rating: number;
  reviewsCount: number;
  productsCount: number;
  isVerified: boolean;
}

interface FeaturedStoresProps {
  stores: Store[];
  title: string;
  viewAllHref: string;
}

function StoreCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-lg -mt-10 border-4 border-background" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturedStoresSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StoreCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeaturedStores({ stores, title, viewAllHref }: FeaturedStoresProps) {
  const router = useRouter();
  const t = useTranslations("home.featuredStores");

  if (!stores || stores.length === 0) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-1">{t("empty.subtitle")}</p>
          </div>
          <Button variant="ghost" onClick={() => router.push(viewAllHref)}>
            {t("viewAll")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("empty.title")}</p>
          <p className="text-sm mt-1">{t("empty.description")}</p>
        </div>
      </div>
    );
  }

  const displayStores = stores.slice(0, 8);

  return (
    <div className="container mx-auto px-4">
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={() => router.push(viewAllHref)}>
          {t("viewAll")}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStores.map((store, index) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Card
              className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30"
              onClick={() => router.push(`/stores/${store.slug}`)}
            >
              {/* Cover Image */}
              <div className="relative h-32 bg-muted overflow-hidden">
                {store.coverImage ? (
                  <img
                    src={store.coverImage}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <CardContent className="p-4">
                {/* Logo & Name */}
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-xl bg-background border-2 border-border flex items-center justify-center -mt-10 shadow-sm overflow-hidden">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {store.name}
                      </h3>
                      {store.isVerified && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                          {t("verified")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{store.category}</p>
                  </div>
                </div>

                {/* Description */}
                {store.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {store.description}
                  </p>
                )}

                {/* Location */}
                {(store.city || store.address) && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {store.city}
                      {store.address ? ` · ${store.address}` : ""}
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{store.rating?.toFixed(1) ?? "0.0"}</span>
                    <span className="text-muted-foreground text-xs">
                      ({store.reviewsCount ?? 0})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{store.productsCount ?? 0} {t("products")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
