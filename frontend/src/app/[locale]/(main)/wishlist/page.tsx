"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useRemoveFromWishlist,
  useWishlist,
  wishlistKeys,
} from "@/hooks/useWishlist";
import { wishlistService } from "@/services/wishlist.service";

export default function WishlistPage() {
  const t = useTranslations("pages.wishlist");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, isError } = useWishlist();
  const removeItem = useRemoveFromWishlist();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login?redirect=/wishlist");
    }
  }, [authLoading, isAuthenticated, router]);

  const items = data?.items ?? [];

  const onMoveToCart = async (productId: string) => {
    try {
      await wishlistService.moveToCart(productId);
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.detail() });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("تمت الإضافة إلى السلة");
    } catch (err: any) {
      toast.error(err?.message || "تعذر النقل إلى السلة");
    }
  };

  const onRemove = async (productId: string) => {
    try {
      await removeItem.mutateAsync(productId);
      toast.success("تمت الإزالة من المفضلة");
    } catch (err: any) {
      toast.error(err?.message || "تعذر الإزالة");
    }
  };

  const onClear = async () => {
    try {
      await wishlistService.clearWishlist();
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.detail() });
      toast.success("تم تفريغ المفضلة");
    } catch (err: any) {
      toast.error(err?.message || "تعذر تفريغ المفضلة");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isError) {
    return (
      <div className="container mx-auto max-w-4xl space-y-4 px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-destructive opacity-60" />
        <p className="text-destructive">تعذر تحميل المفضلة.</p>
        <Link href="/products">
          <Button variant="outline">{t("browse")}</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-16 text-center">
        <Heart className="mx-auto h-16 w-16 text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mx-auto max-w-md text-muted-foreground">{t("empty")}</p>
        <Button onClick={() => router.push("/products")}>{t("browse")}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {items.length} عنصر
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          تفريغ الكل
        </Button>
      </div>

      <ul className="divide-y rounded-lg border">
        {items.map((item) => (
          <li
            key={item.id || item.productId}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href={`/products/${item.productId}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.name}</p>
                <p className="text-sm text-primary">
                  {formatPrice(item.price)}
                </p>
              </div>
            </Link>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onMoveToCart(item.productId)}
              >
                <ShoppingCart className="me-1 h-4 w-4" />
                السلة
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={removeItem.isPending}
                onClick={() => onRemove(item.productId)}
              >
                {removeItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
