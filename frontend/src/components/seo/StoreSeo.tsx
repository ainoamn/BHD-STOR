"use client";

import Head from "next/head";
import DefaultSeo from "./DefaultSeo";
import {
  generateStoreJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";

interface StoreLocation {
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface StoreHours {
  day: string;
  opens: string;
  closes: string;
  closed?: boolean;
}

interface StoreSocialLink {
  platform: string;
  url: string;
}

interface StoreSeoProps {
  // Store Info
  id: string;
  name: string;
  description: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  phone?: string;
  email?: string;
  foundingDate?: string;
  employeeCount?: string;

  // Location
  location: StoreLocation;
  hasPhysicalLocation?: boolean;

  // Hours
  openingHours?: StoreHours[];

  // Rating
  rating?: {
    value: number;
    count: number;
  };

  // Categories
  categories?: string[];
  specialties?: string[];

  // Social
  socialLinks?: StoreSocialLink[];

  // Products count
  productCount?: number;

  // SEO
  locale?: "ar" | "en";
  keywords?: string[];
  noindex?: boolean;
  datePublished?: string;
  dateModified?: string;
}

const SITE_URL = "https://bhd.market";

export default function StoreSeo({
  id,
  name,
  description,
  slug,
  logo,
  coverImage,
  website,
  phone,
  email,
  foundingDate,
  employeeCount,
  location,
  hasPhysicalLocation = true,
  openingHours,
  rating,
  categories = [],
  specialties = [],
  socialLinks = [],
  productCount,
  locale = "ar",
  keywords = [],
  noindex = false,
  datePublished,
  dateModified,
}: StoreSeoProps) {
  const storeUrl = `${SITE_URL}/store/${slug}`;
  const storeImage = logo || coverImage || "/images/og-store.jpg";

  // Build breadcrumbs
  const breadcrumbItems = [
    { name: "الرئيسية", url: "/" },
    { name: "المتاجر", url: "/stores" },
    { name, url: `/store/${slug}` },
  ];

  // Generate LocalBusiness structured data
  const storeJsonLd = generateStoreJsonLd({
    id,
    name,
    description,
    image: storeImage,
    url: storeUrl,
    logo,
    phone,
    email,
    address: location.address,
    city: location.city || "مسقط",
    state: location.state,
    postalCode: location.postalCode,
    country: location.country || "OM",
    latitude: location.latitude,
    longitude: location.longitude,
    rating,
    openingHours,
    foundingDate,
    employeeCount,
    categories,
    specialties,
    socialLinks,
    productCount,
    priceRange: "$$",
  });

  // Generate Rating structured data
  const ratingJsonLd = rating
    ? {
        "@context": "https://schema.org",
        "@type": "AggregateRating",
        ratingValue: rating.value.toString(),
        reviewCount: rating.count.toString(),
        bestRating: "5",
        worstRating: "1",
      }
    : null;

  // Generate Breadcrumb structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  // Combine structured data
  const structuredData = [storeJsonLd, breadcrumbJsonLd];
  if (ratingJsonLd) {
    structuredData.push({
      ...storeJsonLd,
      aggregateRating: ratingJsonLd,
    } as any);
  }

  const defaultKeywords = [
    name,
    "متجر",
    "تاجر",
    "عمان",
    "مسقط",
    "منتجات",
    ...(categories || []),
    ...(specialties || []),
    "BHD Marketplace",
  ].filter(Boolean);

  return (
    <>
      <DefaultSeo
        title={`متجر ${name}`}
        description={description}
        canonical={storeUrl}
        ogImage={coverImage || logo || "/images/og-store.jpg"}
        ogType="profile"
        locale={locale}
        keywords={[...defaultKeywords, ...keywords]}
        noindex={noindex}
        publishedTime={datePublished}
        modifiedTime={dateModified}
      >
        {/* Store-specific meta tags */}
        {phone && <meta name="store:phone" content={phone} />}
        {email && <meta name="store:email" content={email} />}
        {website && <meta property="store:website" content={website} />}
        {rating && (
          <>
            <meta
              property="store:rating:value"
              content={rating.value.toString()}
            />
            <meta
              property="store:rating:count"
              content={rating.count.toString()}
            />
          </>
        )}
        {productCount && (
          <meta
            property="store:product_count"
            content={productCount.toString()}
          />
        )}

        {/* Geo tags for the store */}
        {location.latitude && location.longitude && (
          <>
            <meta name="geo.position" content={`${location.latitude};${location.longitude}`} />
            <meta name="ICBM" content={`${location.latitude}, ${location.longitude}`} />
            <meta property="place:location:latitude" content={location.latitude.toString()} />
            <meta property="place:location:longitude" content={location.longitude.toString()} />
          </>
        )}

        {/* Opening hours hint */}
        {openingHours && openingHours.length > 0 && (
          <meta
            name="business:contact_data:opening_hours"
            content={openingHours
              .filter((h) => !h.closed)
              .map((h) => `${h.day} ${h.opens}-${h.closes}`)
              .join(", ")}
          />
        )}
      </DefaultSeo>

      {/* Structured Data - JSON-LD */}
      <Head>
        {/* Main Store Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(storeJsonLd, null, 2),
          }}
        />

        {/* Breadcrumb Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd, null, 2),
          }}
        />

        {/* Storefront WebSite (if store has own website) */}
        {website && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: `${name} - ${website}`,
                  url: website,
                  publisher: {
                    "@id": `${storeUrl}#store`,
                  },
                },
                null,
                2
              ),
            }}
          />
        )}

        {/* Store hasOfferCatalog if products available */}
        {productCount && productCount > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "OfferCatalog",
                  name: `منتجات ${name}`,
                  itemListElement: {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Product",
                      name: `${name} Products`,
                    },
                  },
                  numberOfItems: productCount.toString(),
                  url: `${storeUrl}/products`,
                },
                null,
                2
              ),
            }}
          />
        )}

        {/* Social Profile links */}
        {socialLinks.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  name,
                  url: storeUrl,
                  sameAs: socialLinks.map((link) => link.url),
                },
                null,
                2
              ),
            }}
          />
        )}
      </Head>
    </>
  );
}
