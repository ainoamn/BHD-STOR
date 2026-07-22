"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";

/**
 * Deep-link landing for physical store stickers (QR / barcode).
 * /ar/s/BHD26-XXXXXX → that seller's store page only — never marketplace home.
 */
export default function StoreScanPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("pages.storeScan");
  const code = decodeURIComponent(String(params.code || ""));

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!code) {
        router.replace("/stores");
        return;
      }
      try {
        const res = await api.get<{
          success: boolean;
          data: { storePath: string; slug: string };
        }>(`/stores/scan/${encodeURIComponent(code)}`);
        const path = res.data.data.storePath || `/stores/${res.data.data.slug}`;
        if (!cancelled) router.replace(path);
      } catch {
        // Demo / offline fallback: treat code as slug if API unavailable
        if (!cancelled) {
          try {
            const res = await api.get<{ success: boolean; data: { slug: string } }>(
              `/stores/slug/${encodeURIComponent(code.toLowerCase())}`
            );
            if (res.data?.data?.slug) {
              router.replace(`/stores/${res.data.data.slug}`);
              return;
            }
          } catch {
            /* ignore */
          }
          router.replace(`/stores?scan=${encodeURIComponent(code)}&error=1`);
        }
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center gap-4">
      <Store className="h-12 w-12 text-muted-foreground opacity-50" />
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground max-w-sm">{t("loading")}</p>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <Button variant="ghost" onClick={() => router.push("/stores")}>
        {t("browseStores")}
      </Button>
    </div>
  );
}
