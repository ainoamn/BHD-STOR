"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

const landmarks = [
  {
    id: "fort",
    key: "fort" as const,
    src: "/brand/oman/fort-nizwa.webp",
    alt: "قلعة نزوى، عُمان",
  },
  {
    id: "alam",
    key: "alAlam" as const,
    src: "/brand/oman/palace-alam.webp",
    alt: "قصر العلم، مسقط",
  },
  {
    id: "mutrah",
    key: "mutrah" as const,
    src: "/brand/oman/souq-mutrah.webp",
    alt: "سوق مطرح، مسقط",
  },
  {
    id: "coast",
    key: "coast" as const,
    src: "/brand/oman/fort-coast.webp",
    alt: "حصن ساحلي عُماني",
  },
];

/**
 * Realistic Omani landmarks gallery.
 * Photos are local WebP (~quality 78) + next/image lazy load (LCP-safe: no priority).
 */
export function OmaniLandmarksSection() {
  const t = useTranslations("home.landmarks");

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden bg-[#0c1410]">
      <div className="container relative mx-auto px-4">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium tracking-wide text-[#D4AF37]">
            {t("eyebrow")}
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {t("title")}
          </h2>
          <p className="mt-3 text-white/70 leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          {landmarks.map((item, index) => (
            <article
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl ${
                index === 0 ? "sm:col-span-2 lg:col-span-2 min-h-[280px] sm:min-h-[340px]" : "min-h-[240px] sm:min-h-[280px]"
              }`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 640px) 100vw, 100vw"
                    : "(max-width: 640px) 100vw, 50vw"
                }
                quality={75}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {t(`items.${item.key}.name`)}
                </h3>
                <p className="mt-1.5 text-sm text-white/80 max-w-xl">
                  {t(`items.${item.key}.blurb`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
