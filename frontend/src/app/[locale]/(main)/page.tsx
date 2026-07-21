"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

import { useFeaturedProducts } from "@/hooks/useProducts";
import { useFeaturedStores } from "@/hooks/useStores";
import { useCategories } from "@/hooks/useCategories";
import { isAdminRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats } from "@/hooks/useAdmin";

import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedStores } from "@/components/home/FeaturedStores";
import { TrendingProducts } from "@/components/home/TrendingProducts";

function HomePageSkeleton() {
  return (
    <div className="space-y-12">
      {/* Hero Skeleton */}
      <section className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden">
        <Skeleton className="absolute inset-0" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center space-y-6">
          <Skeleton className="h-12 w-3/4 max-w-2xl" />
          <Skeleton className="h-6 w-1/2 max-w-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
      </section>

      {/* Categories Skeleton */}
      <section className="container mx-auto px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Stores Skeleton */}
      <section className="container mx-auto px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products Skeleton */}
      <section className="container mx-auto px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <span>{message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-fit"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: featuredProducts,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorMsg,
    refetch: refetchProducts,
  } = useFeaturedProducts();

  const {
    data: featuredStores,
    isLoading: storesLoading,
    isError: storesError,
    error: storesErrorMsg,
    refetch: refetchStores,
  } = useFeaturedStores();

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorMsg,
    refetch: refetchCategories,
  } = useCategories();

  const { data: adminStats } = useAdminStats({
    enabled: isAdminRole(user?.role),
  });

  const isLoading = productsLoading || storesLoading || categoriesLoading;
  const isError = productsError || storesError || categoriesError;

  const handleRetry = () => {
    if (productsError) refetchProducts();
    if (storesError) refetchStores();
    if (categoriesError) refetchCategories();
  };

  if (isLoading && !isError) {
    return (
      <div className="min-h-screen bg-background">
        <HomePageSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={
          productsErrorMsg?.message ||
          storesErrorMsg?.message ||
          categoriesErrorMsg?.message ||
          t("error.loading")
        }
        onRetry={handleRetry}
      />
    );
  }

  const stats = adminStats
    ? {
        totalUsers: adminStats.totalUsers ?? 0,
        totalStores: adminStats.totalStores ?? 0,
        totalProducts: adminStats.totalProducts ?? 0,
        totalOrders: adminStats.totalOrders ?? 0,
      }
    : {
        totalUsers: 12500,
        totalStores: 850,
        totalProducts: 15000,
        totalOrders: 45000,
      };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section>
        <HeroSection
          title={t("hero.title")}
          subtitle={t("hero.subtitle")}
          stats={stats}
          primaryCta={{ label: t("hero.cta.primary"), href: "/stores" }}
          secondaryCta={{ label: t("hero.cta.secondary"), href: "/products" }}
        />
      </section>

      {/* Categories Section */}
      <section className="py-12">
        {categoriesLoading ? (
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CategoriesSection categories={categories ?? []} />
        )}
      </section>

      {/* Featured Stores */}
      <section className="py-12 bg-muted/30">
        {storesLoading ? (
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <FeaturedStores
            stores={featuredStores ?? []}
            title={t("featuredStores.title")}
            viewAllHref="/stores"
          />
        )}
      </section>

      {/* Trending Products */}
      <section className="py-12">
        {productsLoading ? (
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <TrendingProducts
            products={featuredProducts ?? []}
            title={t("trendingProducts.title")}
            viewAllHref="/products"
          />
        )}
      </section>

      {/* Trust Badges / Stats Banner */}
      <section className="py-12 bg-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.totalStores.toLocaleString(), label: t("stats.stores") },
              { value: stats.totalProducts.toLocaleString(), label: t("stats.products") },
              { value: stats.totalUsers.toLocaleString(), label: t("stats.customers") },
              { value: stats.totalOrders.toLocaleString(), label: t("stats.orders") },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
