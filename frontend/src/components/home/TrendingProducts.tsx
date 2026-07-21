"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { useAddToCart } from "@/hooks/useCart";
import { useToggleWishlist } from "@/hooks/useWishlist";
import { useCurrency } from "@/hooks/useCurrency";

import {
  ShoppingCart,
  Heart,
  Star,
  ChevronRight,
  Package,
  Eye,
  Plus,
  Loader2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  images?: string[];
  category: string;
  storeName: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  isFeatured?: boolean;
  isOnSale?: boolean;
}

interface TrendingProductsProps {
  products: Product[];
  title: string;
  viewAllHref: string;
}

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendingProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TrendingProducts({ products, title, viewAllHref }: TrendingProductsProps) {
  const router = useRouter();
  const t = useTranslations("home.trendingProducts");
  const { formatPrice } = useCurrency();

  const addToCartMutation = useAddToCart();
  const toggleWishlistMutation = useToggleWishlist();

  if (!products || products.length === 0) {
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
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("empty.title")}</p>
          <p className="text-sm mt-1">{t("empty.description")}</p>
        </div>
      </div>
    );
  }

  const displayProducts = products.slice(0, 10);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(t("outOfStock"));
      return;
    }

    addToCartMutation.mutate(
      {
        productId: product.id,
        quantity: 1,
      },
      {
        onSuccess: () => {
          toast.success(t("addedToCart"), {
            description: product.name,
          });
        },
        onError: (err: any) => {
          toast.error(t("addToCartError"), {
            description: err?.response?.data?.message || err?.message,
          });
        },
      }
    );
  };

  const handleToggleWishlist = (productId: string) => {
    toggleWishlistMutation.mutate(productId, {
      onSuccess: (data: any) => {
        toast.success(data?.added ? t("addedToWishlist") : t("removedFromWishlist"));
      },
      onError: (err: any) => {
        toast.error(t("wishlistError"), {
          description: err?.response?.data?.message || err?.message,
        });
      },
    });
  };

  const discountPercent = (product: Product) => {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null;
    return Math.round(
      ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
    );
  };

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayProducts.map((product, index) => {
          const discount = discountPercent(product);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {product.image || product.images?.[0] ? (
                    <img
                      src={product.image || product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-chart-2/10">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount && (
                      <Badge className="bg-red-500 text-white hover:bg-red-600">
                        -{discount}%
                      </Badge>
                    )}
                    {product.isFeatured && (
                      <Badge variant="secondary" className="text-xs">
                        {t("featured")}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product.id);
                      }}
                      disabled={toggleWishlistMutation.isPending}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/products/${product.slug}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Out of Stock Overlay */}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Badge variant="secondary" className="text-sm">
                        {t("outOfStock")}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent
                  className="p-3 flex-1 flex flex-col"
                  onClick={() => router.push(`/products/${product.slug}`)}
                >
                  {/* Category */}
                  <p className="text-xs text-muted-foreground mb-1">{product.category}</p>

                  {/* Name */}
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1 flex-1">
                    {product.name}
                  </h3>

                  {/* Store */}
                  <p className="text-xs text-muted-foreground mb-2">{product.storeName}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-medium">{product.rating?.toFixed(1) ?? "0.0"}</span>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviewsCount ?? 0})
                    </span>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock <= 0 || addToCartMutation.isPending}
                    >
                      {addToCartMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
