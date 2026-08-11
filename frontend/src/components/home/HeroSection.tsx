"use client";

import { useRef, useEffect } from "react";
import { useInView } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrendingUp, Store, ShoppingBag, Users } from "lucide-react";
import {
  OmanSkyline,
  OmaniLatticePattern,
} from "@/components/brand/OmaniIllustrations";

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
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden bg-[linear-gradient(160deg,#F8F5F0_0%,#E8F0E4_42%,#F3E9CF_100%)]">
      {/* Lightweight vector atmosphere — no remote photos */}
      <div className="absolute inset-0 z-0 text-primary/30">
        <OmaniLatticePattern className="absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(0,100,0,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] sm:h-[48%] lg:h-[52%] pointer-events-none select-none">
          <OmanSkyline className="absolute inset-x-0 bottom-0 h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </div>
      </div>

      <div className="absolute top-16 end-0 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-secondary/15 blur-3xl" aria-hidden />
      <div className="absolute bottom-24 start-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="container mx-auto px-4 relative z-10 py-12 lg:py-16">
        <div className="max-w-2xl lg:max-w-3xl">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {safe("badge", "BHD Marketplace")}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
            {title}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Button size="lg" onClick={() => router.push(primaryCta.href)} className="text-base">
              <ShoppingBag className="me-2 h-5 w-5" />
              {primaryCta.label}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push(secondaryCta.href)}
              className="text-base border-primary/20 bg-background/60 backdrop-blur-sm"
            >
              <Store className="me-2 h-5 w-5" />
              {secondaryCta.label}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-background/70 backdrop-blur-sm p-3 sm:p-4"
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
