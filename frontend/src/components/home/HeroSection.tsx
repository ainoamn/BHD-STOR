"use client";

import { useRef, useEffect } from "react";
import { useInView } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, TrendingUp, Store, ShoppingBag, Users } from "lucide-react";
import Image from "next/image";

interface HeroStats {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  stats: HeroStats;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (ref.current) {
          ref.current.textContent = Math.floor(eased * value).toLocaleString() + suffix;
        }
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, value, suffix]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

export function HeroSection({ title, subtitle, stats, primaryCta, secondaryCta }: HeroSectionProps) {
  const router = useRouter();
  const t = useTranslations("home.hero");

  const safe = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  const statItems = [
    { value: stats.totalStores, label: safe("stats.stores", "Stores"), icon: Store },
    { value: stats.totalProducts, label: safe("stats.products", "Products"), icon: ShoppingBag },
    { value: stats.totalUsers, label: safe("stats.buyers", "Buyers"), icon: Users },
    { value: stats.totalOrders, label: safe("stats.orders", "Orders"), icon: TrendingUp },
  ];

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80"
          alt="BHD Marketplace Hero"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {safe("badge", "BHD Marketplace")}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg" onClick={() => router.push(primaryCta.href)} className="text-base">
              <ShoppingBag className="mr-2 h-5 w-5" />
              {primaryCta.label}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push(secondaryCta.href)}
              className="text-base"
            >
              <Store className="mr-2 h-5 w-5" />
              {secondaryCta.label}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50"
              >
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl sm:text-3xl font-bold">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
