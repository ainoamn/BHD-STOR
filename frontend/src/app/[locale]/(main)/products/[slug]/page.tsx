"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Package, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductBySlug } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";
import { useAddToCart } from "@/hooks/useCart";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const t = useTranslations("pages.productDetail");
  const { formatPrice } = useCurrency();
  const addToCart = useAddToCart();

  const { data: product, isLoading, isError } = useProductBySlug(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Package className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">{t("notFound")}</h1>
        <Button onClick={() => router.push("/products")}>{t("backToProducts")}</Button>
      </div>
    );
  }

  const p = product as any;
  const displayName = p.nameAr || p.name;
  const image = p.image || p.images?.[0];
  const discount =
    p.compareAtPrice && p.compareAtPrice > p.price
      ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart.mutate(
      { productId: p.id, quantity: 1 },
      {
        onSuccess: () => toast.success(t("addedToCart")),
        onError: () => toast.error(t("addToCartError")),
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
          {image ? (
            <img src={image} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-20 w-20 text-muted-foreground" />
            </div>
          )}
          {discount && (
            <Badge className="absolute top-4 left-4 bg-red-500 text-white">-{discount}%</Badge>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{p.category}</p>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            {p.storeName && (
              <button
                className="text-sm text-primary hover:underline mt-2"
                onClick={() => router.push("/stores")}
              >
                {p.storeName}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{p.rating?.toFixed(1) ?? "4.5"}</span>
            <span className="text-muted-foreground text-sm">
              ({p.reviewsCount ?? p.reviewCount ?? 0} {t("reviews")})
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(p.price)}</span>
            {p.compareAtPrice && p.compareAtPrice > p.price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(p.compareAtPrice)}
              </span>
            )}
          </div>

          {p.description && (
            <p className="text-muted-foreground leading-relaxed">{p.description}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={addToCart.isPending || (p.stock !== undefined && p.stock <= 0)}
            >
              <ShoppingCart className="h-5 w-5" />
              {t("addToCart")}
            </Button>
          </div>

          {p.stock !== undefined && p.stock <= 0 && (
            <Badge variant="secondary">{t("outOfStock")}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
