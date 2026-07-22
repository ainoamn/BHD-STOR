"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  const t = useTranslations("pages.help");

  const faqs = ["q1", "q2", "q3"] as const;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="space-y-4">
        {faqs.map((key) => (
          <Card key={key}>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold">{t(`${key}.question`)}</h3>
              <p className="text-muted-foreground text-sm">{t(`${key}.answer`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
