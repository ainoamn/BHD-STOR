"use client";

import Head from "next/head";
import DefaultSeo from "./DefaultSeo";
import {
  generateOrganizationJsonLd,
  generateWebsiteJsonLd,
} from "@/lib/seo";

interface FeaturedProduct {
  name: string;
  slug: string;
  image: string;
  price: number;
  priceCurrency?: string;
  category?: string;
}

interface FeaturedStore {
  name: string;
  slug: string;
  logo?: string;
  category?: string;
}

interface HomeSeoProps {
  locale?: "ar" | "en";
  featuredProducts?: FeaturedProduct[];
  featuredStores?: FeaturedStore[];
  topCategories?: {
    name: string;
    slug: string;
    productCount: number;
  }[];
  statistics?: {
    productCount?: number;
    storeCount?: number;
    userCount?: number;
  };
}

const SITE_URL = "https://bhd.market";
const SITE_NAME_AR = "BHD Marketplace - منصة التجارة العمانية";
const SITE_NAME_EN = "BHD Marketplace - Omani E-commerce Platform";
const HOME_DESCRIPTION_AR =
  "منصة BHD Marketplace - وجهتك الأولى للتجارة الإلكترونية الفاخرة في سلطنة عُمان. اكتشف آلاف المنتجات الفريدة من متاجر عمانية موثوقة. تسوق الأزياء، الإلكترونيات، المجوهرات، العطور، والمزيد.";
const HOME_DESCRIPTION_EN =
  "BHD Marketplace - Your premium destination for e-commerce in Oman. Discover thousands of unique products from trusted Omani stores. Shop fashion, electronics, jewelry, perfumes, and more.";

export default function HomeSeo({
  locale = "ar",
  featuredProducts = [],
  featuredStores = [],
  topCategories = [],
  statistics,
}: HomeSeoProps) {
  const isAr = locale === "ar";
  const siteName = isAr ? SITE_NAME_AR : SITE_NAME_EN;
  const description = isAr ? HOME_DESCRIPTION_AR : HOME_DESCRIPTION_EN;
  const homeUrl = `${SITE_URL}${isAr ? "/ar" : "/en"}`;

  // Generate Organization structured data
  const organizationJsonLd = generateOrganizationJsonLd();

  // Generate WebSite structured data
  const websiteJsonLd = generateWebsiteJsonLd();

  // Generate SearchAction (site search)
  const searchActionJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // WebPage structured data for homepage
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${homeUrl}#webpage`,
    url: homeUrl,
    name: siteName,
    description,
    inLanguage: isAr ? "ar" : "en",
    isPartOf: {
      "@id": `${SITE_URL}#website`,
    },
    about: {
      "@id": `${SITE_URL}#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/og-home.jpg`,
      width: "1200",
      height: "630",
    },
    ...(statistics?.productCount && {
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: statistics.productCount.toString(),
      },
    }),
  };

  // FAQPage structured data (common homepage FAQs)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: isAr
          ? "ما هي منصة BHD Marketplace؟"
          : "What is BHD Marketplace?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isAr
            ? "BHD Marketplace هي منصة التجارة الإلكترونية الرائدة في سلطنة عُمان، تربط المتاجر العمانية بالعملاء وتقدم تجربة تسوق فاخرة وموثوقة."
            : "BHD Marketplace is Oman's leading e-commerce platform, connecting Omani stores with customers and offering a premium, trusted shopping experience.",
        },
      },
      {
        "@type": "Question",
        name: isAr
          ? "هل يمكنني الشراء من متاجر متعددة في طلب واحد؟"
          : "Can I buy from multiple stores in one order?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isAr
            ? "نعم، يمكنك إضافة منتجات من متاجر مختلفة إلى سلة التسوق الخاصة بك وإتمام عملية الشراء في طلب واحد."
            : "Yes, you can add products from different stores to your cart and complete the purchase in a single order.",
        },
      },
      {
        "@type": "Question",
        name: isAr
          ? "ما هي طرق الدفع المتاحة؟"
          : "What payment methods are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isAr
            ? "نقبل الدفع عبر البطاقات الائتمانية، بطاقات الخصم، Apple Pay، Google Pay، والدفع عند الاستلام في مناطق محددة."
            : "We accept credit cards, debit cards, Apple Pay, Google Pay, and cash on delivery in select areas.",
        },
      },
      {
        "@type": "Question",
        name: isAr
          ? "كيف أصبح بائعاً على المنصة؟"
          : "How do I become a seller on the platform?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isAr
            ? "يمكنك التسجيل كبائع عبر صفحة 'انضم إلينا' وتقديم المستندات المطلوبة. فريقنا سيراجع طلبك خلال 24-48 ساعة."
            : "You can register as a seller through the 'Join Us' page and submit the required documents. Our team will review your application within 24-48 hours.",
        },
      },
    ],
  };

  // Carousel structured data for featured products
  const carouselJsonLd =
    featuredProducts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: featuredProducts.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: product.name,
              url: `${SITE_URL}/product/${product.slug}`,
              image: product.image.startsWith("http")
                ? product.image
                : `${SITE_URL}${product.image}`,
              offers: {
                "@type": "Offer",
                price: product.price.toString(),
                priceCurrency: product.priceCurrency || "OMR",
                availability: "https://schema.org/InStock",
              },
              ...(product.category && {
                category: product.category,
              }),
            },
          })),
        }
      : null;

  // Store carousel
  const storeCarouselJsonLd =
    featuredStores.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: featuredStores.map((store, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "LocalBusiness",
              name: store.name,
              url: `${SITE_URL}/store/${store.slug}`,
              ...(store.logo && {
                image: store.logo.startsWith("http")
                  ? store.logo
                  : `${SITE_URL}${store.logo}`,
              }),
              ...(store.category && {
                category: store.category,
              }),
            },
          })),
        }
      : null;

  const keywords = [
    "تسوق اونلاين عمان",
    "تجارة الكترونية عمان",
    "متاجر عمانية",
    "سلطنة عمان",
    "مسقط",
    "BHD",
    "BHD Marketplace",
    "تسوق فاخر",
    "منتجات عمانية",
    "Bazar",
    "بازار عمان",
    "online shopping Oman",
    "Omani products",
    "Muscat shopping",
    "ecommerce Oman",
    ...(topCategories.map((c) => c.name)),
  ];

  return (
    <>
      <DefaultSeo
        title={siteName}
        description={description}
        canonical={homeUrl}
        ogImage="/images/og-home.jpg"
        ogType="website"
        locale={locale}
        keywords={keywords}
      >
        {/* Homepage-specific meta tags */}
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

        {/* Preload critical homepage assets */}
        <link rel="preload" as="image" href="/images/hero-banner.jpg" />
        <link rel="preload" as="image" href="/images/og-home.jpg" />

        {/* Hreflang for homepage */}
        <link rel="alternate" hrefLang="ar" href={`${SITE_URL}/ar`} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}`} />

        {/* Homepage statistics */}
        {statistics?.productCount && (
          <meta property="bhd:product_count" content={statistics.productCount.toString()} />
        )}
        {statistics?.storeCount && (
          <meta property="bhd:store_count" content={statistics.storeCount.toString()} />
        )}
        {statistics?.userCount && (
          <meta property="bhd:user_count" content={statistics.userCount.toString()} />
        )}

        {/* Top categories meta */}
        {topCategories.length > 0 && (
          <meta
            property="bhd:categories"
            content={topCategories.map((c) => c.name).join(", ")}
          />
        )}

        {/* Refresh hint for dynamic content */}
        <meta httpEquiv="last-modified" content={new Date().toUTCString()} />

        {/* Page-specific theme color */}
        <meta name="theme-color" content="#F8F5F0" />
      </DefaultSeo>

      {/* Structured Data - JSON-LD */}
      <Head>
        {/* Organization Structured Data */}
        <script
          type="application/ld+json"
          id="organization-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd, null, 2),
          }}
        />

        {/* WebSite + SearchAction Structured Data */}
        <script
          type="application/ld+json"
          id="website-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd, null, 2),
          }}
        />

        {/* SearchAction standalone */}
        <script
          type="application/ld+json"
          id="search-action-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(searchActionJsonLd, null, 2),
          }}
        />

        {/* WebPage Structured Data */}
        <script
          type="application/ld+json"
          id="webpage-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageJsonLd, null, 2),
          }}
        />

        {/* FAQPage Structured Data */}
        <script
          type="application/ld+json"
          id="faq-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd, null, 2),
          }}
        />

        {/* Featured Products Carousel */}
        {carouselJsonLd && (
          <script
            type="application/ld+json"
            id="featured-products-schema"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(carouselJsonLd, null, 2),
            }}
          />
        )}

        {/* Featured Stores Carousel */}
        {storeCarouselJsonLd && (
          <script
            type="application/ld+json"
            id="featured-stores-schema"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(storeCarouselJsonLd, null, 2),
            }}
          />
        )}

        {/* LocalBusiness for BHD HQ */}
        <script
          type="application/ld+json"
          id="hq-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                name: "BHD Marketplace HQ",
                image: `${SITE_URL}/images/bhd-hq.jpg`,
                url: SITE_URL,
                telephone: "+968-XXXX-XXXX",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "شارع السلطان قابوس",
                  addressLocality: "مسقط",
                  addressRegion: "مسقط",
                  postalCode: "100",
                  addressCountry: "OM",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: 23.6139,
                  longitude: 58.5423,
                },
                openingHoursSpecification: [
                  {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                    ],
                    opens: "08:00",
                    closes: "18:00",
                  },
                  {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: "Saturday",
                    opens: "09:00",
                    closes: "14:00",
                  },
                ],
                priceRange: "$$",
              },
              null,
              2
            ),
          }}
        />

        {/* SoftwareApplication for the PWA */}
        <script
          type="application/ld+json"
          id="app-schema"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "BHD Marketplace",
                operatingSystem: "Any",
                applicationCategory: "ShoppingApplication",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "OMR",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.8",
                  ratingCount: "1500",
                },
                downloadUrl: `${SITE_URL}/manifest.json`,
                featureList: [
                  "تسوق من متاجر عمانية موثوقة",
                  "دفع آمن",
                  "تتبع الطلبات",
                  "إشعارات فورية",
                  "وضع offline",
                ],
              },
              null,
              2
            ),
          }}
        />
      </Head>
    </>
  );
}
