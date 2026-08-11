"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

const landmarks = [
  {
    id: "fort",
    key: "fort" as const,
    src: "/brand/oman/fort-nizwa.webp",
    alt: "قلعة نزوى بين جبال الحجر",
    span: "sm:col-span-2 lg:row-span-2 min-h-[320px] sm:min-h-[420px] lg:min-h-full",
  },
  {
    id: "alam",
    key: "alAlam" as const,
    src: "/brand/oman/palace-alam.webp",
    alt: "قصر العلم في مسقط ليلاً",
    span: "min-h-[240px] sm:min-h-[260px]",
  },
  {
    id: "mutrah",
    key: "mutrah" as const,
    src: "/brand/oman/souq-mutrah.webp",
    alt: "سوق مطرح",
    span: "min-h-[240px] sm:min-h-[260px]",
  },
  {
    id: "coast",
    key: "coast" as const,
    src: "/brand/oman/fort-coast.webp",
    alt: "حصن ساحلي وجبال عُمان",
    span: "sm:col-span-2 min-h-[260px] sm:min-h-[300px]",
  },
];

export function OmaniLandmarksSection() {
  const t = useTranslations("home.landmarks");

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden bg-[#070c09]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.12), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="container relative mx-auto px-4">
        <div className="mb-10 sm:mb-12 max-w-3xl">
          <p className="mb-2 text-sm font-semibold tracking-[0.18em] uppercase text-[#D4AF37]">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/65 leading-relaxed max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 lg:auto-rows-[minmax(220px,1fr)]">
          {landmarks.map((item) => (
            <article
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-white/10 shadow-2xl shadow-black/40 ${item.span}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={
                  item.id === "fort" || item.id === "coast"
                    ? "(max-width: 640px) 100vw, 66vw"
                    : "(max-width: 640px) 100vw, 33vw"
                }
                quality={85}
                className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-95" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t(`items.${item.key}.name`)}
                </h3>
                <p className="mt-2 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
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
