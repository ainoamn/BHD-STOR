"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Heart, Settings, Shield, Store } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("pages.dashboard");

  const links = [
    { href: "/orders", icon: Package, label: t("orders") },
    { href: "/wishlist", icon: Heart, label: t("wishlist") },
    { href: "/settings", icon: Settings, label: t("settings") },
    { href: "/dashboard/admin", icon: Shield, label: t("admin") },
    { href: "/dashboard/store", icon: Store, label: t("store") },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-muted-foreground">{t("demoNote")}</p>
          <Button onClick={() => window.location.href = "/auth/login"}>{t("loginCta")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
