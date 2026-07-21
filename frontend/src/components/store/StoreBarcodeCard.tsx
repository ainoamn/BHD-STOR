"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, QrCode, Hash, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

interface StoreIdentity {
  id: string;
  name: string;
  slug: string;
  storeSerial: string;
  storeCode: string;
  scanUrl: string;
}

/**
 * Shows the store's unique serial + QR for physical stickers.
 * Scanning opens /s/{serial} → this store only.
 */
export function StoreBarcodeCard({ storeId }: { storeId?: string }) {
  const t = useTranslations("dashboard.store.identity");
  const [identity, setIdentity] = useState<StoreIdentity | null>(null);
  const [copied, setCopied] = useState<"serial" | "url" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: StoreIdentity }>("/stores/mine");
        if (!cancelled) setIdentity(res.data.data);
      } catch {
        if (storeId) {
          try {
            const res = await api.get<{ success: boolean; data: any }>(`/stores/${storeId}`);
            const s = res.data.data;
            if (!cancelled && s?.storeSerial) {
              const origin =
                typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
              setIdentity({
                id: s.id,
                name: s.name,
                slug: s.slug,
                storeSerial: s.storeSerial,
                storeCode: s.storeCode,
                scanUrl: s.scanUrl || `${origin}/ar/s/${s.storeSerial}`,
              });
            }
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const copy = async (text: string, key: "serial" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(t("copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">{t("loading")}</CardContent>
      </Card>
    );
  }

  if (!identity?.storeSerial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("unavailable")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    identity.scanUrl
  )}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="rounded-lg border bg-white p-3 shrink-0">
          <img
            src={qrSrc}
            alt={t("qrAlt")}
            width={220}
            height={220}
            className="block"
          />
        </div>
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Hash className="h-3.5 w-3.5" />
              {t("serial")}
            </p>
            <p className="font-mono text-lg font-semibold tracking-wide">{identity.storeSerial}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("barcodeCode")}: <span className="font-mono">{identity.storeCode}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("scanUrl")}</p>
            <p className="text-sm break-all text-muted-foreground">{identity.scanUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(identity.storeSerial, "serial")}
            >
              {copied === "serial" ? <Check className="h-4 w-4 me-1" /> : <Copy className="h-4 w-4 me-1" />}
              {t("copySerial")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(identity.scanUrl, "url")}>
              {copied === "url" ? <Check className="h-4 w-4 me-1" /> : <Copy className="h-4 w-4 me-1" />}
              {t("copyUrl")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(identity.scanUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 me-1" />
              {t("openStore")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const a = document.createElement("a");
                a.href = qrSrc;
                a.download = `${identity.storeSerial}-qr.png`;
                a.target = "_blank";
                a.click();
              }}
            >
              <Download className="h-4 w-4 me-1" />
              {t("downloadQr")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("stickerHint")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
