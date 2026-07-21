"use client";

import Head from "next/head";
import DefaultSeo from "./DefaultSeo";
import {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateReviewJsonLd,
} from "@/lib/seo";

interface Review {
  id: string;
  author: string;
  rating: number;
  title?: string;
  body: string;
  datePublished: string;
  verified?: boolean;
}

interface ProductImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface ProductOffer {
  price: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder" | "BackOrder";
  condition?: "New" | "Used" | "Refurbished";
  seller?: string;
  url?: string;
  priceValidUntil?: string;
  itemOffered?: string;
}

interface ProductSeoProps {
  // Product Info
  id: string;
  name: string;
  description: string;
  brand?: string;
  sku?: string;
  mpn?: string;
  gtin?: string;
  category?: string;
  categorySlug?: string;
  subcategory?: string;

  // Media
  images: ProductImage[];
  mainImage?: string;

  // Pricing
  price: number;
  priceCurrency?: string;
  compareAtPrice?: number;
  offers?: ProductOffer[];

  // Availability
  inStock?: boolean;
  availability?: ProductOffer["availability"];
  quantity?: number;

  // Reviews
  reviews?: Review[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };

  // Store
  storeName?: string;
  storeSlug?: string;

  // SEO
  canonicalSlug: string;
  locale?: "ar" | "en";
  keywords?: string[];
  noindex?: boolean;

  // Dates
  datePublished?: string;
  dateModified?: string;
}

const SITE_URL = "https://bhd.market";

export default function ProductSeo({
  id,
  name,
  description,
  brand,
  sku,
  mpn,
  gtin,
  category,
  categorySlug,
  subcategory,
  images,
  mainImage,
  price,
  priceCurrency = "OMR",
  compareAtPrice,
  offers,
  inStock = true,
  availability = "InStock",
  quantity,
  reviews = [],
  aggregateRating,
  storeName,
  storeSlug,
  canonicalSlug,
  locale = "ar",
  keywords = [],
  noindex = false,
  datePublished,
  dateModified,
}: ProductSeoProps) {
  const productUrl = `${SITE_URL}/product/${canonicalSlug}`;
  const mainImageUrl = mainImage || images[0]?.url || "/images/og-product.jpg";

  // Build breadcrumbs
  const breadcrumbItems = [
    { name: "الرئيسية", url: "/" },
    ...(category
      ? [{ name: category, url: `/category/${categorySlug || ""}` }]
      : []),
    ...(subcategory
      ? [{ name: subcategory, url: `/category/${categorySlug || ""}` }]
      : []),
    { name, url: `/product/${canonicalSlug}` },
  ];

  // Generate Product structured data
  const productJsonLd = generateProductJsonLd({
    id,
    name,
    description,
    image: mainImageUrl,
    images: images.map((img) => img.url),
    brand: brand || storeName || "BHD Marketplace",
    sku: sku || id,
    mpn,
    gtin,
    url: productUrl,
    price,
    priceCurrency,
    availability: inStock ? availability || "InStock" : "OutOfStock",
    category,
    seller: storeName,
    condition: "New",
    quantity,
    datePublished,
    dateModified,
  });

  // Generate AggregateRating structured data
  const aggregateRatingJsonLd = aggregateRating
    ? {
        "@context": "https://schema.org",
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue.toString(),
        reviewCount: aggregateRating.reviewCount.toString(),
        bestRating: "5",
        worstRating: "1",
      }
    : null;

  // Generate Review structured data
  const reviewsJsonLd =
    reviews.length > 0
      ? reviews.map((review) =>
          generateReviewJsonLd({
            author: review.author,
            rating: review.rating,
            title: review.title,
            body: review.body,
            datePublished: review.datePublished,
            verified: review.verified,
            productName: name,
          })
        )
      : [];

  // Generate Breadcrumb structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  // Combine all structured data
  const structuredData = [
    {
      ...productJsonLd,
      ...(aggregateRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: aggregateRating.ratingValue,
          reviewCount: aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      ...(reviews.length > 0 && {
        review: reviewsJsonLd.map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.author?.name },
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.reviewRating?.ratingValue,
            bestRating: 5,
          },
          reviewBody: r.reviewBody,
          datePublished: r.datePublished,
        })),
      }),
    },
    breadcrumbJsonLd,
  ];

  const defaultKeywords = [
    name,
    brand || "",
    category || "",
    "شراء",
    "تسوق",
    "عمان",
    "مسقط",
    priceCurrency + " " + price.toString(),
    "BHD",
    "BHD Marketplace",
  ].filter(Boolean);

  return (
    <>
      <DefaultSeo
        title={name}
        description={description}
        canonical={productUrl}
        ogImage={mainImageUrl}
        ogType="product"
        locale={locale}
        keywords={[...defaultKeywords, ...keywords]}
        noindex={noindex}
        publishedTime={datePublished}
        modifiedTime={dateModified}
      >
        {/* Product-specific OG tags */}
        <meta property="product:price:amount" content={price.toString()} />
        <meta property="product:price:currency" content={priceCurrency} />
        <meta
          property="product:availability"
          content={inStock ? "instock" : "out of stock"}
        />
        <meta property="product:condition" content="new" />
        {brand && <meta property="product:brand" content={brand} />}
        {category && (
          <meta property="product:category" content={category} />
        )}
        {compareAtPrice && (
          <>
            <meta
              property="product:original_price:amount"
              content={compareAtPrice.toString()}
            />
            <meta
              property="product:original_price:currency"
              content={priceCurrency}
            />
          </>
        )}

        {/* All product images as OG images */}
        {images.slice(0, 5).map((img, index) => (
          <meta
            key={index}
            property={index === 0 ? "og:image" : "og:image"}
            content={img.url.startsWith("http") ? img.url : `${SITE_URL}${img.url}`}
          />
        ))}

        {/* Twitter Product Card */}
        <meta name="twitter:label1" content="السعر" />
        <meta name="twitter:data1" content={`${price} ${priceCurrency}`} />
        <meta name="twitter:label2" content="الاتاحة" />
        <meta
          name="twitter:data2"
          content={inStock ? "متوفر" : "غير متوفر"}
        />
      </DefaultSeo>

      {/* Structured Data - JSON-LD */}
      <Head>
        {structuredData.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data, null, 2),
            }}
          />
        ))}

        {/* ImageObject for each product image */}
        {images.map((img, index) => (
          <script
            key={`img-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "ImageObject",
                  contentUrl: img.url.startsWith("http")
                    ? img.url
                    : `${SITE_URL}${img.url}`,
                  name: img.alt || `${name} - صورة ${index + 1}`,
                  description: img.alt || `${name} product image`,
                  ...(img.width && { width: img.width.toString() }),
                  ...(img.height && { height: img.height.toString() }),
                },
                null,
                2
              ),
            }}
          />
        ))}
      </Head>
    </>
  );
}
