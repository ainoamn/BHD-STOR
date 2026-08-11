"use client";

import { useTranslations } from "next-intl";
import {
  AlAlamPalaceIllustration,
  CoastalFortIllustration,
  FortIllustration,
  MutrahSouqIllustration,
} from "@/components/brand/OmaniIllustrations";

const landmarks = [
  { id: "fort", Illustration: FortIllustration, key: "fort" },
  { id: "alam", Illustration: AlAlamPalaceIllustration, key: "alAlam" },
  { id: "mutrah", Illustration: MutrahSouqIllustration, key: "mutrah" },
  { id: "coast", Illustration: CoastalFortIllustration, key: "coast" },
] as const;

/**
 * Omani landmarks strip — colored SVG drawings only (no image network cost).
 */
export function OmaniLandmarksSection() {
  const t = useTranslations("home.landmarks");

  return (
    <section className="relative py-14 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #D4AF37 0, transparent 40%), radial-gradient(circle at 80% 60%, #006400 0, transparent 45%)",
        }}
        aria-hidden
      />

      <div className="container relative mx-auto px-4">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-secondary">{t("eyebrow")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {landmarks.map(({ id, Illustration, key }) => (
            <article
              key={id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-3 sm:p-4 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="mb-3 flex aspect-[4/3] items-end justify-center rounded-xl bg-gradient-to-b from-[#F8F5F0] to-[#EDE4D4] px-2 pt-2">
                <Illustration className="max-h-28 sm:max-h-32 w-full drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.03]" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                {t(`items.${key}.name`)}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {t(`items.${key}.blurb`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
