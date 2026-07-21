"use client";

import Head from "next/head";
import { usePathname } from "next/navigation";

interface DefaultSeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product" | "profile";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  noindex?: boolean;
  nofollow?: boolean;
  locale?: "ar" | "en";
  alternateLocales?: string[];
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  children?: React.ReactNode;
}

const SITE_NAME = "BHD Marketplace";
const SITE_URL = "https://bhd.market";
const DEFAULT_DESCRIPTION =
  "منصة BHD - وجهتك الأولى للتجارة الإلكترونية الفاخرة في سلطنة عُمان. اكتشف منتجات فريدة من متاجر عمانية موثوقة.";
const DEFAULT_OG_IMAGE = "/images/og-default.jpg";
const TWITTER_HANDLE = "@bhdmarketplace";
const FB_APP_ID = "123456789012345";

export default function DefaultSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  twitterCard = "summary_large_image",
  noindex = false,
  nofollow = false,
  locale = "ar",
  alternateLocales = ["en"],
  keywords = [],
  author = "BHD Marketplace",
  publishedTime,
  modifiedTime,
  children,
}: DefaultSeoProps) {
  const pathname = usePathname();
  const currentUrl = `${SITE_URL}${pathname || "/"}`;
  const canonicalUrl = canonical || currentUrl;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const robotsContent = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
    "max-snippet:-1",
    "max-image-preview:large",
    "max-video-preview:-1",
  ].join(", ");

  const defaultKeywords = [
    "تسوق اونلاين",
    "تجارة الكترونية",
    "عمان",
    "مسقط",
    "منتجات عمانية",
    "تسوق",
    "متاجر",
    "BHD",
    "online shopping",
    "Oman",
    "Muscat",
    "e-commerce",
  ];
  const allKeywords = [...defaultKeywords, ...keywords];

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(", ")} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />

      {/* Character Set & Viewport - typically in _document.tsx but included for completeness */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />

      {/* Theme Color */}
      <meta name="theme-color" content="#006400" />
      <meta name="msapplication-TileColor" content="#006400" />
      <meta name="msapplication-navbutton-color" content="#006400" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#006400" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Language Alternates */}
      <link rel="alternate" hrefLang={locale} href={currentUrl} />
      {alternateLocales.map((altLocale) => (
        <link
          key={altLocale}
          rel="alternate"
          hrefLang={altLocale}
          href={`${SITE_URL}/${altLocale}${pathname?.replace(/^\/(ar|en)/, "") || "/"}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_URL}${pathname?.replace(/^\/(ar|en)/, "") || "/"}`}
      />

      {/* Open Graph Tags */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={locale === "ar" ? "ar_OM" : "en_OM"} />
      {alternateLocales.map((altLocale) => (
        <meta
          key={altLocale}
          property="og:locale:alternate"
          content={altLocale === "ar" ? "ar_OM" : "en_OM"}
        />
      ))}
      <meta property="og:image" content={`${SITE_URL}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="fb:app_id" content={FB_APP_ID} />

      {/* Article specific OG tags */}
      {ogType === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${ogImage}`} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:domain" content="bhd.market" />

      {/* Favicon Links */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76x76.png" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#006400" />

      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Preconnect Hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://cdn.bhd.market" />
      <link rel="dns-prefetch" href="https://images.bhd.market" />

      {/* Mobile App Meta Tags */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="BHD" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="BHD Marketplace" />
      <meta name="format-detection" content="telephone=no" />

      {/* Verification Tags */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
      <meta name="facebook-domain-verification" content="your-fb-verification-code" />

      {/* Geo Tags */}
      <meta name="geo.region" content="OM" />
      <meta name="geo.placename" content="Muscat" />
      <meta name="geo.position" content="23.6139;58.5423" />
      <meta name="ICBM" content="23.6139, 58.5423" />

      {/* Copyright */}
      <meta name="copyright" content={`${new Date().getFullYear()} BHD Marketplace`} />

      {/* Additional structured data children */}
      {children}
    </Head>
  );
}

// Specialized SEO variants for common use cases
export function NoIndexSeo({
  title,
  reason = "private",
}: {
  title: string;
  reason?: "private" | "draft" | "canonical" | "search";
}) {
  return (
    <DefaultSeo
      title={title}
      noindex
      nofollow={reason === "private"}
      description=""
    />
  );
}

// Quick SEO preset for product pages
export function QuickProductSeo({
  name,
  price,
  currency = "OMR",
  image,
  category,
}: {
  name: string;
  price: number;
  currency?: string;
  image?: string;
  category?: string;
}) {
  const title = name;
  const description = `اشترِ ${name} بسعر ${price} ${currency}${category ? ` من قسم ${category}` : ""}. تسوق الآن على BHD Marketplace.`;

  return (
    <DefaultSeo
      title={title}
      description={description}
      ogType="product"
      ogImage={image || "/images/og-product.jpg"}
      keywords={[name, category || "", "شراء", "عمان"].filter(Boolean)}
    />
  );
}
