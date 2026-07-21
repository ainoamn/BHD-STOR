"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Copy,
  Check,
  QrCode,
  Hash,
  ExternalLink,
  Download,
  Printer,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

export interface StoreIdentity {
  id?: string;
  name: string;
  slug: string;
  storeSerial: string;
  storeCode: string;
  scanUrl: string;
}

type StoreBarcodeCardProps = {
  /** Seller dashboard: load via /stores/mine or /stores/:id */
  storeId?: string;
  /** Public store page: pass identity from store payload */
  identity?: Partial<StoreIdentity> | null;
  /** Compact layout for storefront */
  variant?: "dashboard" | "storefront";
};

function buildScanUrl(serial: string): string {
  if (typeof window === "undefined") return `/ar/s/${serial}`;
  return `${window.location.origin}/ar/s/${encodeURIComponent(serial)}`;
}

function normalizeIdentity(raw: Partial<StoreIdentity> & { name?: string; slug?: string }): StoreIdentity | null {
  const slug = raw.slug || "";
  const name = raw.name || slug || "Store";
  let storeSerial = (raw.storeSerial || "").trim().toUpperCase();
  let storeCode = (raw.storeCode || "").trim().toUpperCase();

  if (!storeSerial && slug) {
    const compact = slug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8) || "STORE";
    storeSerial = `BHD-${compact}`;
    storeCode = `BHD${compact}`;
  }
  if (!storeSerial) return null;
  if (!storeCode) storeCode = storeSerial.replace(/-/g, "");

  return {
    id: raw.id,
    name,
    slug,
    storeSerial,
    storeCode,
    scanUrl: raw.scanUrl || buildScanUrl(storeSerial),
  };
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function fetchImageBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("image fetch failed");
  return res.blob();
}

/**
 * Store serial + QR sticker panel.
 * Seller dashboard and public store page: copy, download image/file, print.
 */
export function StoreBarcodeCard({
  storeId,
  identity: identityProp,
  variant = "dashboard",
}: StoreBarcodeCardProps) {
  const t = useTranslations("dashboard.store.identity");
  const printRef = useRef<HTMLDivElement>(null);
  const [identity, setIdentity] = useState<StoreIdentity | null>(
    identityProp ? normalizeIdentity(identityProp) : null
  );
  const [copied, setCopied] = useState<"serial" | "url" | "code" | null>(null);
  const [loading, setLoading] = useState(!identityProp);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (identityProp) {
      setIdentity(normalizeIdentity(identityProp));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; data: StoreIdentity }>("/stores/mine");
        if (!cancelled) setIdentity(normalizeIdentity(res.data.data));
      } catch {
        if (storeId) {
          try {
            const res = await api.get<{ success: boolean; data: any }>(`/stores/${storeId}`);
            if (!cancelled) setIdentity(normalizeIdentity(res.data.data));
          } catch {
            if (!cancelled) setIdentity(null);
          }
        } else if (!cancelled) {
          setIdentity(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, identityProp]);

  const qrSrc = useMemo(() => {
    if (!identity?.scanUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(
      identity.scanUrl
    )}`;
  }, [identity?.scanUrl]);

  const barcodeImgSrc = useMemo(() => {
    if (!identity?.storeCode) return "";
    // Code128-style barcode image for sticker printing
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
      identity.storeCode
    )}&scale=3&height=12&includetext&textxalign=center`;
  }, [identity?.storeCode]);

  const copy = async (text: string, key: "serial" | "url" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(t("copied"));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const downloadQrPng = useCallback(async () => {
    if (!identity || !qrSrc) return;
    setBusy(true);
    try {
      const blob = await fetchImageBlob(qrSrc);
      await downloadBlob(blob, `${identity.storeSerial}-qr.png`);
      toast.success(t("downloadDone"));
    } catch {
      // Fallback: open image for manual save
      window.open(qrSrc, "_blank");
      toast.message(t("downloadFallback"));
    } finally {
      setBusy(false);
    }
  }, [identity, qrSrc, t]);

  const downloadBarcodePng = useCallback(async () => {
    if (!identity || !barcodeImgSrc) return;
    setBusy(true);
    try {
      const blob = await fetchImageBlob(barcodeImgSrc);
      await downloadBlob(blob, `${identity.storeSerial}-barcode.png`);
      toast.success(t("downloadDone"));
    } catch {
      window.open(barcodeImgSrc, "_blank");
      toast.message(t("downloadFallback"));
    } finally {
      setBusy(false);
    }
  }, [identity, barcodeImgSrc, t]);

  const downloadStickerPng = useCallback(async () => {
    if (!identity || !qrSrc) return;
    setBusy(true);
    try {
      const qrBlob = await fetchImageBlob(qrSrc);
      const qrBitmap = await createImageBitmap(qrBlob);
      const canvas = document.createElement("canvas");
      const w = 720;
      const h = 960;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      ctx.fillStyle = "#111111";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BHD", w / 2, 90);
      ctx.font = "28px sans-serif";
      ctx.fillText(identity.name.slice(0, 28), w / 2, 140);

      const qrSize = 360;
      const qrX = (w - qrSize) / 2;
      ctx.drawImage(qrBitmap, qrX, 180, qrSize, qrSize);

      ctx.font = "bold 32px monospace";
      ctx.fillText(identity.storeSerial, w / 2, 600);
      ctx.font = "22px monospace";
      ctx.fillText(identity.storeCode, w / 2, 650);
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#444444";
      const urlLines = identity.scanUrl.match(/.{1,42}/g) || [identity.scanUrl];
      urlLines.slice(0, 3).forEach((line, i) => {
        ctx.fillText(line, w / 2, 720 + i * 28);
      });
      ctx.fillStyle = "#111111";
      ctx.font = "20px sans-serif";
      ctx.fillText(t("stickerFooter"), w / 2, 880);

      const stickerBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
      });
      await downloadBlob(stickerBlob, `${identity.storeSerial}-sticker.png`);
      toast.success(t("downloadDone"));
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setBusy(false);
    }
  }, [identity, qrSrc, t]);

  const downloadTextFile = useCallback(() => {
    if (!identity) return;
    const body = [
      `BHD Store Identity`,
      `==================`,
      `Name: ${identity.name}`,
      `Slug: ${identity.slug}`,
      `Serial: ${identity.storeSerial}`,
      `Barcode: ${identity.storeCode}`,
      `Scan URL: ${identity.scanUrl}`,
      ``,
      `Scanning the QR/barcode opens this store only — not the full marketplace.`,
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${identity.storeSerial}-identity.txt`);
    toast.success(t("downloadDone"));
  }, [identity, t]);

  const printSticker = useCallback(() => {
    if (!printRef.current || !identity) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
    if (!win) {
      toast.error(t("printBlocked"));
      return;
    }
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${identity.storeSerial} — BHD</title>
  <style>
    @page { size: 80mm 100mm; margin: 6mm; }
    body { font-family: system-ui, sans-serif; text-align: center; color: #111; }
    .box { border: 2px solid #111; padding: 12px; border-radius: 8px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; font-weight: 600; margin: 0 0 12px; }
    img.qr { width: 180px; height: 180px; }
    img.bc { width: 90%; max-width: 260px; margin-top: 10px; }
    .serial { font-family: ui-monospace, monospace; font-size: 18px; font-weight: 700; margin-top: 10px; }
    .code { font-family: ui-monospace, monospace; font-size: 12px; color: #333; }
    .url { font-size: 10px; word-break: break-all; color: #444; margin-top: 8px; }
    .hint { font-size: 10px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>BHD</h1>
    <h2>${identity.name.replace(/</g, "")}</h2>
    <img class="qr" src="${qrSrc}" alt="QR" />
    <div class="serial">${identity.storeSerial}</div>
    <div class="code">${identity.storeCode}</div>
    <img class="bc" src="${barcodeImgSrc}" alt="Barcode" />
    <div class="url">${identity.scanUrl}</div>
    <p class="hint">${t("stickerFooter")}</p>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  }, [identity, qrSrc, barcodeImgSrc, t]);

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

  const isStorefront = variant === "storefront";

  return (
    <Card className={isStorefront ? "border-dashed" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="h-5 w-5" />
          {isStorefront ? t("storefrontTitle") : t("title")}
        </CardTitle>
        <CardDescription>
          {isStorefront ? t("storefrontDescription") : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6 items-start">
        <div ref={printRef} className="space-y-3 shrink-0 w-full sm:w-auto">
          <div className="rounded-lg border bg-white p-3 inline-block">
            <img src={qrSrc} alt={t("qrAlt")} width={200} height={200} className="block" />
          </div>
          <div className="rounded-lg border bg-white p-3 max-w-[280px]">
            <img
              src={barcodeImgSrc}
              alt={t("barcodeAlt")}
              className="w-full h-auto"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 min-w-0 w-full">
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
            <Button size="sm" variant="outline" onClick={() => copy(identity.storeSerial, "serial")}>
              {copied === "serial" ? <Check className="h-4 w-4 me-1" /> : <Copy className="h-4 w-4 me-1" />}
              {t("copySerial")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => copy(identity.storeCode, "code")}>
              {copied === "code" ? <Check className="h-4 w-4 me-1" /> : <Copy className="h-4 w-4 me-1" />}
              {t("copyCode")}
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
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t">
            <Button size="sm" variant="secondary" disabled={busy} onClick={downloadQrPng}>
              <ImageIcon className="h-4 w-4 me-1" />
              {t("downloadQr")}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={downloadBarcodePng}>
              <Download className="h-4 w-4 me-1" />
              {t("downloadBarcode")}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={downloadStickerPng}>
              <Download className="h-4 w-4 me-1" />
              {t("downloadSticker")}
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadTextFile}>
              <FileText className="h-4 w-4 me-1" />
              {t("downloadFile")}
            </Button>
            <Button size="sm" onClick={printSticker}>
              <Printer className="h-4 w-4 me-1" />
              {t("printSticker")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{t("stickerHint")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
