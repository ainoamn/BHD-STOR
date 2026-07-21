/**
 * SEO Utilities Library
 * Generates structured data (JSON-LD), sitemaps, and robots.txt content
 * for BHD Marketplace
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface ProductData {
  id: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  brand?: string;
  sku?: string;
  mpn?: string;
  gtin?: string;
  url?: string;
  price: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder" | "BackOrder";
  category?: string;
  seller?: string;
  condition?: "New" | "Used" | "Refurbished";
  quantity?: number;
  datePublished?: string;
  dateModified?: string;
}

export interface StoreData {
  id: string;
  name: string;
  description: string;
  image?: string;
  url?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  rating?: {
    value: number;
    count: number;
  };
  openingHours?: {
    day: string;
    opens: string;
    closes: string;
    closed?: boolean;
  }[];
  foundingDate?: string;
  employeeCount?: string;
  categories?: string[];
  specialties?: string[];
  socialLinks?: { platform: string; url: string }[];
  productCount?: number;
  priceRange?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ReviewData {
  author: string;
  rating: number;
  title?: string;
  body: string;
  datePublished: string;
  verified?: boolean;
  productName?: string;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  alternates?: { lang: string; url: string }[];
  images?: { url: string; title?: string; caption?: string }[];
}

// ─── Constants ───────────────────────────────────────────────────────

const SITE_URL = "https://bhd.market";
const SITE_NAME = "BHD Marketplace";

// ─── Product Structured Data ─────────────────────────────────────────

export function generateProductJsonLd(product: ProductData): Record<string, unknown> {
  const {
    id,
    name,
    description,
    image,
    images = [],
    brand = "BHD Marketplace",
    sku,
    mpn,
    gtin,
    url,
    price,
    priceCurrency = "OMR",
    availability = "InStock",
    category,
    seller,
    condition = "New",
    quantity,
    datePublished,
    dateModified,
  } = product;

  const allImages = [image, ...images.filter((img) => img !== image)];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url ? `${url}#product` : undefined,
    name,
    description,
    image: allImages.map((img) =>
      img.startsWith("http") ? img : `${SITE_URL}${img}`
    ),
    url,
    sku: sku || id,
    ...(mpn && { mpn }),
    ...(gtin && { gtin }),
    brand: {
      "@type": "Brand",
      name: brand,
    },
    ...(category && {
      category: {
        "@type": "Thing",
        name: category,
      },
    }),
    offers: {
      "@type": "Offer",
      url,
      price: price.toString(),
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      itemCondition: `https://schema.org/${condition}Condition`,
      priceValidUntil: getPriceValidUntil(),
      ...(seller && {
        seller: {
          "@type": "Organization",
          name: seller,
        },
      }),
      ...(quantity !== undefined && {
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: quantity.toString(),
        },
      }),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "2.000",
          currency: "OMR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "OM",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
  };
}

// ─── Store / LocalBusiness Structured Data ────────────────────────────

export function generateStoreJsonLd(store: StoreData): Record<string, unknown> {
  const {
    id,
    name,
    description,
    image,
    url,
    logo,
    phone,
    email,
    address,
    city = "مسقط",
    state = "مسقط",
    postalCode,
    country = "OM",
    latitude,
    longitude,
    rating,
    openingHours,
    foundingDate,
    employeeCount,
    categories = [],
    specialties = [],
    socialLinks = [],
    productCount,
    priceRange,
  } = store;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url ? `${url}#store` : undefined,
    name,
    description,
    url,
    ...(image && {
      image: image.startsWith("http") ? image : `${SITE_URL}${image}`,
    }),
    ...(logo && {
      logo: logo.startsWith("http") ? logo : `${SITE_URL}${logo}`,
    }),
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: state,
      addressCountry: country,
      ...(address && { streetAddress: address }),
      ...(postalCode && { postalCode }),
    },
    ...(latitude !== undefined &&
      longitude !== undefined && {
        geo: {
          "@type": "GeoCoordinates",
          latitude,
          longitude,
        },
      }),
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.value.toString(),
        reviewCount: rating.count.toString(),
        bestRating: "5",
        worstRating: "1",
      },
    }),
    ...(openingHours &&
      openingHours.length > 0 && {
        openingHoursSpecification: openingHours
          .filter((h) => !h.closed)
          .map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: translateDayToEnglish(h.day),
            opens: h.opens,
            closes: h.closes,
          })),
      }),
    ...(foundingDate && { foundingDate }),
    ...(employeeCount && { numberOfEmployees: employeeCount }),
    ...(categories.length > 0 && {
      category: categories,
    }),
    ...(specialties.length > 0 && {
      knowsAbout: specialties,
    }),
    ...(socialLinks.length > 0 && {
      sameAs: socialLinks.map((link) => link.url),
    }),
    ...(productCount && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `منتجات ${name}`,
        numberOfItems: productCount.toString(),
      },
    }),
    ...(priceRange && { priceRange }),
    paymentAccepted: ["Credit Card", "Debit Card", "Cash", "Apple Pay", "Google Pay"],
    currenciesAccepted: "OMR",
    areaServed: {
      "@type": "Country",
      name: "Oman",
    },
  };

  return jsonLd;
}

// ─── Breadcrumb Structured Data ──────────────────────────────────────

export function generateBreadcrumbJsonLd(
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${SITE_URL}${item.url}`,
    })),
  };
}

// ─── Organization Structured Data ────────────────────────────────────

export function generateOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    alternateName: ["BHD", "BHD Marketplace Oman", "منصة BHD"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/logo.png`,
      width: "512",
      height: "512",
      caption: "BHD Marketplace Logo",
    },
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/og-default.jpg`,
      width: "1200",
      height: "630",
    },
    description:
      "منصة BHD Marketplace - وجهتك الأولى للتجارة الإلكترونية الفاخرة في سلطنة عُمان.",
    slogan: "تسوق فاخر، تجربة عمانية",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      streetAddress: "شارع السلطان قابوس",
      addressLocality: "مسقط",
      addressRegion: "مسقط",
      postalCode: "100",
      addressCountry: "OM",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+968-XXXX-XXXX",
        contactType: "customer service",
        availableLanguage: ["Arabic", "English"],
        areaServed: "OM",
      },
      {
        "@type": "ContactPoint",
        telephone: "+968-XXXX-XXXX",
        contactType: "technical support",
        availableLanguage: ["Arabic", "English"],
        areaServed: "OM",
      },
    ],
    sameAs: [
      "https://www.facebook.com/bhdmarketplace",
      "https://www.instagram.com/bhdmarketplace",
      "https://twitter.com/bhdmarketplace",
      "https://www.linkedin.com/company/bhd-marketplace",
      "https://www.tiktok.com/@bhdmarketplace",
      "https://www.snapchat.com/add/bhdmarketplace",
      "https://wa.me/968XXXXXXXX",
    ],
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "TradeAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/sell`,
        },
        name: "البيع على المنصة",
      },
    ],
  };
}

// ─── WebSite Structured Data ─────────────────────────────────────────

export function generateWebsiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    name: SITE_NAME,
    alternateName: "BHD",
    url: SITE_URL,
    description:
      "منصة التجارة الإلكترونية العمانية الفاخرة - اكتشف منتجات فريدة من متاجر عمانية موثوقة",
    inLanguage: ["ar", "en"],
    publisher: {
      "@id": `${SITE_URL}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    copyrightHolder: {
      "@id": `${SITE_URL}#organization`,
    },
    copyrightYear: new Date().getFullYear().toString(),
  };
}

// ─── Review Structured Data ──────────────────────────────────────────

export function generateReviewJsonLd(review: ReviewData): Record<string, unknown> {
  const {
    author,
    rating,
    title,
    body,
    datePublished,
    verified = false,
    productName,
  } = review;

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: author,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: rating.toString(),
      bestRating: "5",
      worstRating: "1",
    },
    ...(title && { name: title }),
    reviewBody: body,
    datePublished,
    ...(verified && {
      additionalType: "VerifiedPurchase",
    }),
    ...(productName && {
      itemReviewed: {
        "@type": "Product",
        name: productName,
      },
    }),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}

// ─── XML Sitemap Generator ───────────────────────────────────────────

export function generateSitemap(entries: SitemapEntry[]): string {
  const xmlEntries = entries.map((entry) => {
    const url = entry.url.startsWith("http") ? entry.url : `${SITE_URL}${entry.url}`;
    const lastmod = entry.lastmod || new Date().toISOString();
    const changefreq = entry.changefreq || "weekly";
    const priority = entry.priority ?? 0.5;

    let imageXml = "";
    if (entry.images && entry.images.length > 0) {
      imageXml = entry.images
        .map(
          (img) =>
            `    <image:image>\n` +
            `      <image:loc>${img.url}</image:loc>\n` +
            (img.title ? `      <image:title>${escapeXml(img.title)}</image:title>\n` : "") +
            (img.caption ? `      <image:caption>${escapeXml(img.caption)}</image:caption>\n` : "") +
            `    </image:image>`
        )
        .join("\n");
    }

    let alternateXml = "";
    if (entry.alternates && entry.alternates.length > 0) {
      alternateXml = entry.alternates
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.url}" />`
        )
        .join("\n");
    }

    return (
      `  <url>\n` +
      `    <loc>${url}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${changefreq}</changefreq>\n` +
      `    <priority>${priority.toFixed(1)}</priority>\n` +
      (alternateXml ? alternateXml + "\n" : "") +
      (imageXml ? imageXml + "\n" : "") +
      `  </url>`
    );
  });

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset\n` +
    `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `  xmlns:xhtml="http://www.w3.org/1999/xhtml"\n` +
    `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n` +
    `  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n` +
    `  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n` +
    `>\n` +
    xmlEntries.join("\n") +
    `\n</urlset>`
  );
}

// ─── Robots.txt Generator ────────────────────────────────────────────

export function generateRobotsTxt(
  sitemapUrl: string = `${SITE_URL}/sitemap.xml`,
  additionalRules: string = ""
): string {
  return `# BHD Marketplace - Robots.txt
# https://bhd.market/robots.txt
# Last updated: ${new Date().toISOString()}

# ─── General Rules ───
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /cart/
Disallow: /orders/
Disallow: /profile/
Disallow: /auth/
Disallow: /graphql
Disallow: /internal/
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*page=0$
Allow: /api/og/*

# ─── Crawl Rate ───
Crawl-delay: 1

# ─── Google Bot ───
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /internal/
Crawl-delay: 0.5

# ─── Google Images ───
User-agent: Googlebot-Image
Allow: /
Allow: /images/
Allow: /uploads/
Allow: /products/
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.png$
Allow: /*.webp$
Allow: /*.gif$
Disallow: /api/

# ─── Google Mobile ───
User-agent: Googlebot-Mobile
Allow: /
Disallow: /api/
Disallow: /admin/

# ─── Bing Bot ───
User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /internal/
Crawl-delay: 1

# ─── Yahoo Bot ───
User-agent: Slurp
Allow: /
Disallow: /api/
Disallow: /admin/
Crawl-delay: 2

# ─── Baidu ───
User-agent: Baiduspider
Allow: /
Disallow: /api/
Disallow: /admin/
Crawl-delay: 2

# ─── Yandex ───
User-agent: Yandex
Allow: /
Disallow: /api/
Disallow: /admin/
Crawl-delay: 2

# ─── Ahrefs ───
User-agent: AhrefsBot
Allow: /
Disallow: /api/
Disallow: /admin/
Crawl-delay: 2

# ─── SEMrush ───
User-agent: SemrushBot
Allow: /
Disallow: /api/
Disallow: /admin/
Crawl-delay: 2

# ─── Twitter Bot ───
User-agent: Twitterbot
Allow: /

# ─── Facebook Bot ───
User-agent: facebookexternalhit
Allow: /

# ─── LinkedIn Bot ───
User-agent: LinkedInBot
Allow: /

# ─── Sitemaps ───
Sitemap: ${sitemapUrl}
Sitemap: ${SITE_URL}/sitemap-products.xml
Sitemap: ${SITE_URL}/sitemap-stores.xml
Sitemap: ${SITE_URL}/sitemap-categories.xml
Sitemap: ${SITE_URL}/sitemap-static.xml
Sitemap: ${SITE_URL}/sitemap-images.xml

${additionalRules}
# ─── End of Robots.txt ───
`;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getPriceValidUntil(): string {
  // Valid for 1 year from now
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

function translateDayToEnglish(day: string): string {
  const translations: Record<string, string> = {
    الأحد: "Sunday",
    الاثنين: "Monday",
    الثلاثاء: "Tuesday",
    الأربعاء: "Wednesday",
    الخميس: "Thursday",
    الجمعة: "Friday",
    السبت: "Saturday",
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  };
  return translations[day] || day;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Additional Utility Functions ────────────────────────────────────

/**
 * Generate Open Graph image URL for a product
 */
export function generateProductOgImage(
  productName: string,
  price: number,
  currency: string = "OMR",
  imageUrl?: string
): string {
  const params = new URLSearchParams({
    title: productName,
    price: `${price} ${currency}`,
    ...(imageUrl && { image: imageUrl }),
  });
  return `${SITE_URL}/api/og/product?${params.toString()}`;
}

/**
 * Generate meta title with proper formatting
 */
export function generateMetaTitle(
  pageTitle: string,
  siteName: string = SITE_NAME,
  includeSiteName: boolean = true
): string {
  if (!includeSiteName || !pageTitle) return siteName;
  return `${pageTitle} | ${siteName}`;
}

/**
 * Truncate description to optimal SEO length
 */
export function truncateDescription(
  description: string,
  maxLength: number = 160
): string {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3).trim() + "...";
}

/**
 * Generate canonical URL
 */
export function generateCanonical(
  pathname: string,
  query?: Record<string, string>
): string {
  let url = `${SITE_URL}${pathname}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query).toString();
    url += `?${params}`;
  }
  return url;
}

/**
 * Generate language alternates
 */
export function generateLanguageAlternates(
  pathname: string
): { lang: string; url: string }[] {
  const cleanPath = pathname.replace(/^\/(ar|en)/, "");
  return [
    { lang: "ar", url: `${SITE_URL}/ar${cleanPath}` },
    { lang: "en", url: `${SITE_URL}/en${cleanPath}` },
    { lang: "x-default", url: `${SITE_URL}${cleanPath}` },
  ];
}

/**
 * Generate pagination links
 */
export function generatePaginationLinks(
  basePath: string,
  currentPage: number,
  totalPages: number
): { prev?: string; next?: string } {
  const links: { prev?: string; next?: string } = {};

  if (currentPage > 1) {
    links.prev =
      currentPage === 2
        ? basePath
        : `${basePath}?page=${currentPage - 1}`;
  }

  if (currentPage < totalPages) {
    links.next = `${basePath}?page=${currentPage + 1}`;
  }

  return links;
}

/**
 * Validate structured data (basic checks)
 */
export function validateStructuredData(
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data["@context"]) {
    errors.push("Missing @context");
  }
  if (!data["@type"]) {
    errors.push("Missing @type");
  }

  const type = data["@type"] as string;

  switch (type) {
    case "Product":
      if (!data.name) errors.push("Product: Missing name");
      if (!data.image) errors.push("Product: Missing image");
      if (!data.offers) errors.push("Product: Missing offers");
      break;
    case "LocalBusiness":
      if (!data.name) errors.push("LocalBusiness: Missing name");
      if (!data.address) errors.push("LocalBusiness: Missing address");
      break;
    case "BreadcrumbList":
      if (!data.itemListElement)
        errors.push("BreadcrumbList: Missing itemListElement");
      break;
    case "WebSite":
      if (!data.url) errors.push("WebSite: Missing url");
      break;
    case "Organization":
      if (!data.name) errors.push("Organization: Missing name");
      if (!data.url) errors.push("Organization: Missing url");
      break;
  }

  return { valid: errors.length === 0, errors };
}
