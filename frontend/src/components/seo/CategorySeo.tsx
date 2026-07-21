"use client";

import Head from "next/head";
import DefaultSeo from "./DefaultSeo";
import {
  generateBreadcrumbJsonLd,
} from "@/lib/seo";

interface CategoryProduct {
  id: string;
  name: string;
  slug: string;
  image?: string;
  price?: number;
  priceCurrency?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  position?: number;
}

interface CategorySeoProps {
  // Category Info
  id: string;
  name: string;
  description: string;
  slug: string;
  image?: string;

  // Hierarchy
  parentCategory?: {
    name: string;
    slug: string;
  };
  subcategories?: {
    name: string;
    slug: string;
    count?: number;
  }[];

  // Products in category
  products?: CategoryProduct[];
  totalProducts?: number;

  // Filters
  filters?: {
    brands?: string[];
    priceRange?: { min: number; max: number };
  };

  // Pagination
  currentPage?: number;
  totalPages?: number;

  // SEO
  locale?: "ar" | "en";
  keywords?: string[];
  noindex?: boolean;
  canonicalParams?: string; // For filtered URLs
}

const SITE_URL = "https://bhd.market";

export default function CategorySeo({
  id,
  name,
  description,
  slug,
  image,
  parentCategory,
  subcategories = [],
  products = [],
  totalProducts,
  filters,
  currentPage = 1,
  totalPages = 1,
  locale = "ar",
  keywords = [],
  noindex = false,
  canonicalParams,
}: CategorySeoProps) {
  const categoryUrl = `${SITE_URL}/category/${slug}${canonicalParams || ""}`;
  const categoryImage = image || "/images/og-category.jpg";
  const isPaginated = currentPage > 1;

  // Build breadcrumbs
  const breadcrumbItems = [
    { name: "الرئيسية", url: "/" },
    ...(parentCategory
      ? [
          {
            name: parentCategory.name,
            url: `/category/${parentCategory.slug}`,
          },
        ]
      : []),
    { name, url: `/category/${slug}` },
  ];

  // Generate CollectionPage structured data
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${categoryUrl}#collection`,
    name: `${name} - BHD Marketplace`,
    description,
    url: categoryUrl,
    image: categoryImage.startsWith("http")
      ? categoryImage
      : `${SITE_URL}${categoryImage}`,
    inLanguage: locale === "ar" ? "ar" : "en",
    isPartOf: {
      "@type": "WebSite",
      name: "BHD Marketplace",
      url: SITE_URL,
    },
    about: {
      "@type": "Thing",
      name,
      description,
    },
    ...(totalProducts && {
      totalItems: totalProducts.toString(),
    }),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: product.position || index + 1,
        item: {
          "@type": "Product",
          "@id": `${SITE_URL}/product/${product.slug}`,
          name: product.name,
          url: `${SITE_URL}/product/${product.slug}`,
          ...(product.image && {
            image: product.image.startsWith("http")
              ? product.image
              : `${SITE_URL}${product.image}`,
          }),
          ...(product.price && {
            offers: {
              "@type": "Offer",
              price: product.price.toString(),
              priceCurrency: product.priceCurrency || "OMR",
              availability: "https://schema.org/InStock",
            },
          }),
          ...(product.rating && product.reviewCount && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating.toString(),
              reviewCount: product.reviewCount.toString(),
            },
          }),
          ...(product.brand && {
            brand: {
              "@type": "Brand",
              name: product.brand,
            },
          }),
        },
      })),
    },
  };

  // Generate BreadcrumbList structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  // Generate SearchAction for category search
  const searchActionJsonLd = {
    "@context": "https://schema.org",
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${categoryUrl}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };

  const defaultKeywords = [
    name,
    parentCategory?.name || "",
    ...subcategories.map((s) => s.name),
    "تسوق",
    "شراء",
    "عمان",
    "مسقط",
    "BHD",
    "BHD Marketplace",
    "منتجات",
    "متجر",
  ].filter(Boolean);

  // Determine page title
  const pageTitle = isPaginated
    ? `${name} - صفحة ${currentPage}`
    : name;

  return (
    <>
      <DefaultSeo
        title={pageTitle}
        description={description}
        canonical={categoryUrl}
        ogImage={categoryImage}
        ogType="website"
        locale={locale}
        keywords={[...defaultKeywords, ...keywords]}
        noindex={noindex || isPaginated}
      >
        {/* Pagination meta tags */}
        {currentPage > 1 && (
          <link
            rel="prev"
            href={`${SITE_URL}/category/${slug}${
              currentPage === 2 ? "" : `?page=${currentPage - 1}`
            }`}
          />
        )}
        {currentPage < totalPages && (
          <link
            rel="next"
            href={`${SITE_URL}/category/${slug}?page=${currentPage + 1}`}
          />
        )}

        {/* Category-specific meta */}
        {totalProducts && (
          <meta name="category:product_count" content={totalProducts.toString()} />
        )}
        {filters?.brands && filters.brands.length > 0 && (
          <meta name="category:brands" content={filters.brands.join(",")} />
        )}
        {subcategories.length > 0 && (
          <meta
            name="category:subcategories"
            content={subcategories.map((s) => s.name).join(",")}
          />
        )}

        {/* Dublin Core metadata */}
        <meta name="DC.title" content={name} />
        <meta name="DC.description" content={description} />
        <meta name="DC.type" content="Collection" />
        <meta name="DC.language" content={locale === "ar" ? "ar" : "en"} />
      </DefaultSeo>

      {/* Structured Data - JSON-LD */}
      <Head>
        {/* CollectionPage Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionJsonLd, null, 2),
          }}
        />

        {/* BreadcrumbList Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd, null, 2),
          }}
        />

        {/* SearchAction Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(searchActionJsonLd, null, 2),
          }}
        />

        {/* Subcategory SiteNavigationElement */}
        {subcategories.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: subcategories.map((sub, index) => ({
                    "@type": "SiteNavigationElement",
                    position: index + 1,
                    name: sub.name,
                    url: `${SITE_URL}/category/${sub.slug}`,
                    ...(sub.count && {
                      description: `${sub.count} منتجات`,
                    }),
                  })),
                },
                null,
                2
              ),
            }}
          />
        )}

        {/* Filter by brand OfferCatalog */}
        {filters?.brands && filters.brands.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "OfferCatalog",
                  name: `${name} - الفلاتر`,
                  itemListElement: filters.brands.map((brand, index) => ({
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Product",
                      brand: {
                        "@type": "Brand",
                        name: brand,
                      },
                    },
                  })),
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
