"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";

export default function AboutPage() {
  const t = useTranslations("pages.about");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <Card>
        <CardContent className="p-6 space-y-4 text-muted-foreground leading-relaxed">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
