import { MetadataRoute } from "next";

const SITE_URL = "https://bhd.market";

// ─── Types ───────────────────────────────────────────────────────────

interface ProductRoute {
  slug: string;
  updatedAt: string;
  images?: string[];
}

interface StoreRoute {
  slug: string;
  updatedAt: string;
}

interface CategoryRoute {
  slug: string;
  name: string;
  updatedAt: string;
  priority?: number;
}

// ─── Static Routes ───────────────────────────────────────────────────

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/ar`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/en`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/faq`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    url: `${SITE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    url: `${SITE_URL}/shipping`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/returns`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/sell`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/stores`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/categories`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/deals`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/new-arrivals`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/bestsellers`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/careers`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/sitemap`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.4,
  },
];

// ─── API Fetch Functions ─────────────────────────────────────────────

/**
 * Fetch products from API for dynamic routes
 * Fallback to empty array if API is unavailable
 */
async function fetchProducts(): Promise<ProductRoute[]> {
  try {
    const response = await fetch(`${SITE_URL}/api/products?limit=1000&fields=slug,updatedAt,images`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) throw new Error("Failed to fetch products");

    const data = await response.json();
    return data.products || [];
  } catch {
    // Return fallback data if API is not available
    console.log("[Sitemap] Using fallback product routes");
    return [];
  }
}

/**
 * Fetch stores from API for dynamic routes
 */
async function fetchStores(): Promise<StoreRoute[]> {
  try {
    const response = await fetch(`${SITE_URL}/api/stores?limit=500&fields=slug,updatedAt`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error("Failed to fetch stores");

    const data = await response.json();
    return data.stores || [];
  } catch {
    console.log("[Sitemap] Using fallback store routes");
    return [];
  }
}

/**
 * Fetch categories from API for dynamic routes
 */
async function fetchCategories(): Promise<CategoryRoute[]> {
  try {
    const response = await fetch(`${SITE_URL}/api/categories?limit=100&fields=slug,name,updatedAt`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error("Failed to fetch categories");

    const data = await response.json();
    return data.categories || [];
  } catch {
    console.log("[Sitemap] Using fallback category routes");
    return getDefaultCategories();
  }
}

// Default categories as fallback
function getDefaultCategories(): CategoryRoute[] {
  return [
    { slug: "fashion", name: "أزياء", updatedAt: new Date().toISOString(), priority: 0.8 },
    { slug: "electronics", name: "إلكترونيات", updatedAt: new Date().toISOString(), priority: 0.8 },
    { slug: "jewelry", name: "مجوهرات", updatedAt: new Date().toISOString(), priority: 0.8 },
    { slug: "perfumes", name: "عطور", updatedAt: new Date().toISOString(), priority: 0.8 },
    { slug: "home", name: "منزل وديكور", updatedAt: new Date().toISOString(), priority: 0.7 },
    { slug: "beauty", name: "جمال وعناية", updatedAt: new Date().toISOString(), priority: 0.7 },
    { slug: "food", name: "مواد غذائية", updatedAt: new Date().toISOString(), priority: 0.7 },
    { slug: "sports", name: "رياضة", updatedAt: new Date().toISOString(), priority: 0.6 },
    { slug: "books", name: "كتب", updatedAt: new Date().toISOString(), priority: 0.6 },
    { slug: "kids", name: "أطفال", updatedAt: new Date().toISOString(), priority: 0.7 },
    { slug: "handmade", name: "صناعات يدوية", updatedAt: new Date().toISOString(), priority: 0.7 },
    { slug: "automotive", name: "سيارات", updatedAt: new Date().toISOString(), priority: 0.5 },
  ];
}

// ─── Sitemap Generation ──────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic routes in parallel
  const [products, stores, categories] = await Promise.all([
    fetchProducts(),
    fetchStores(),
    fetchCategories(),
  ]);

  // Generate product routes
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Generate store routes
  const storeRoutes: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${SITE_URL}/store/${store.slug}`,
    lastModified: new Date(store.updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Generate category routes
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: "weekly",
    priority: category.priority || 0.7,
  }));

  // Generate Arabic alternate routes for key pages
  const arabicRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/ar/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/ar/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/ar/stores`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // Combine all routes
  const allRoutes: MetadataRoute.Sitemap = [
    ...STATIC_ROUTES,
    ...productRoutes,
    ...storeRoutes,
    ...categoryRoutes,
    ...arabicRoutes,
  ];

  return allRoutes;
}

// ─── Product Sitemap (separate file) ─────────────────────────────────

export async function generateProductSitemap(): Promise<string> {
  const products = await fetchProducts();

  const entries = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastmod: product.updatedAt,
    changefreq: "weekly" as const,
    priority: 0.7,
    images: product.images?.map((img) => ({
      url: img.startsWith("http") ? img : `${SITE_URL}${img}`,
      title: product.slug,
    })),
  }));

  return generateXmlSitemap(entries);
}

// ─── Store Sitemap (separate file) ───────────────────────────────────

export async function generateStoreSitemap(): Promise<string> {
  const stores = await fetchStores();

  const entries = stores.map((store) => ({
    url: `${SITE_URL}/store/${store.slug}`,
    lastmod: store.updatedAt,
    changefreq: "weekly" as const,
    priority: 0.6,
  }));

  return generateXmlSitemap(entries);
}

// ─── Category Sitemap (separate file) ────────────────────────────────

export async function generateCategorySitemap(): Promise<string> {
  const categories = await fetchCategories();

  const entries = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    lastmod: category.updatedAt,
    changefreq: "weekly" as const,
    priority: category.priority || 0.7,
  }));

  return generateXmlSitemap(entries);
}

// ─── XML Sitemap Generator Helper ────────────────────────────────────

interface SitemapXmlEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: { url: string; title?: string; caption?: string }[];
}

function generateXmlSitemap(entries: SitemapXmlEntry[]): string {
  const xmlEntries = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? new Date(entry.lastmod).toISOString()
        : new Date().toISOString();

      let imageXml = "";
      if (entry.images && entry.images.length > 0) {
        imageXml = entry.images
          .map(
            (img) =>
              `    <image:image>\n` +
              `      <image:loc>${escapeXml(img.url)}</image:loc>\n` +
              (img.title ? `      <image:title>${escapeXml(img.title)}</image:title>\n` : "") +
              `    </image:image>`
          )
          .join("\n");
      }

      return (
        `  <url>\n` +
        `    <loc>${escapeXml(entry.url)}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${entry.changefreq || "weekly"}</changefreq>\n` +
        `    <priority>${(entry.priority ?? 0.5).toFixed(1)}</priority>\n` +
        (imageXml ? imageXml + "\n" : "") +
        `  </url>`
      );
    })
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset\n` +
    `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n` +
    `>\n` +
    xmlEntries +
    `\n</urlset>`
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
