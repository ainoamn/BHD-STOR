"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";

export default function SettingsPage() {
  const t = useTranslations("pages.settings");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          {t("demoNote")}
        </CardContent>
      </Card>
    </div>
  );
}
