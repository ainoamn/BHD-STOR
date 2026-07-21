"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("pages.contact");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="grid gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Mail className="h-5 w-5 text-primary" />
            <span>support@bhdoman.com</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Phone className="h-5 w-5 text-primary" />
            <span>+968 9000 0000</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{t("address")}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
