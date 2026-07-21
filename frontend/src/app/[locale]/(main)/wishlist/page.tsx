"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WishlistPage() {
  const t = useTranslations("pages.wishlist");

  return (
    <div className="container mx-auto px-4 py-16 text-center space-y-4">
      <Heart className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md mx-auto">{t("empty")}</p>
      <Button onClick={() => window.location.href = "/products"}>{t("browse")}</Button>
    </div>
  );
}
