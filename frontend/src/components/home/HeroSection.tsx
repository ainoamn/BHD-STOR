"use client";

import { useRef, useEffect } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrendingUp, Store, ShoppingBag, Users } from "lucide-react";

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

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function HeroSection({
  title,
  subtitle,
  stats,
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
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
    <section className="relative min-h-[min(100svh,820px)] flex items-end overflow-hidden">
      {/* Cinematic Al Hajar mountains — full-bleed hero */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/brand/oman/hero-coast.webp"
          alt="جبال الحجر، سلطنة عُمان"
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-[center_40%] hero-kenburns will-change-transform"
        />
        {/* Soft cinematic grade — keep mountains readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.25)_70%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />
        <div className="absolute inset-0 bg-[#0a2f14]/[0.12] mix-blend-soft-light" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pb-14 pt-32 sm:pb-20 sm:pt-28">
        <div className="max-w-2xl lg:max-w-3xl text-white">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/95 text-sm font-medium mb-6 border border-white/20 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
            </span>
            {safe("badge", "BHD Marketplace")}
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-5 drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] leading-[1.1]">
            {title}
          </h1>

          <p className="text-lg sm:text-xl text-white/90 mb-9 max-w-2xl leading-relaxed drop-shadow-md">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 mb-11">
            <Button
              size="lg"
              onClick={() => router.push(primaryCta.href)}
              className="text-base bg-[#006400] hover:bg-[#005200] text-white shadow-lg shadow-black/30"
            >
              <ShoppingBag className="me-2 h-5 w-5" />
              {primaryCta.label}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push(secondaryCta.href)}
              className="text-base border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
            >
              <Store className="me-2 h-5 w-5" />
              {secondaryCta.label}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md p-3.5 sm:p-4 shadow-lg shadow-black/20"
              >
                <stat.icon className="h-5 w-5 text-[#D4AF37] mb-2" />
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
