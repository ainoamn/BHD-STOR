import { MetadataRoute } from "next";

const SITE_URL = "https://bhd.market";

/**
 * Next.js Dynamic robots.txt
 * Generates robots.txt with comprehensive rules for different user agents
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ─── General Rules (All Bots) ───
      {
        userAgent: "*",
        allow: [
          "/",
          "/ar/",
          "/en/",
          "/product/",
          "/store/",
          "/category/",
          "/blog/",
          "/about",
          "/contact",
          "/faq",
          "/sell",
          "/stores",
          "/deals",
          "/new-arrivals",
          "/bestsellers",
        ],
        disallow: [
          "/api/",
          "/_next/",
          "/admin/",
          "/dashboard/",
          "/checkout/",
          "/cart/",
          "/orders/",
          "/profile/",
          "/auth/",
          "/graphql",
          "/internal/",
          "/settings/",
          "/notifications/",
          "/messages/",
          "/wallet/",
          "/shipping-addresses/",
          "/*?*sort=",
          "/*?*filter=",
          "/*?*page=0$",
          "/*.json$",
          "/*.xml$",
          "/_vercel/",
          "/_error",
          "/404",
          "/500",
        ],
        crawlDelay: 1,
      },

      // ─── Googlebot ───
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/checkout/",
          "/cart/",
          "/orders/",
          "/profile/",
          "/auth/",
          "/internal/",
          "/graphql",
        ],
        crawlDelay: 0.5,
      },

      // ─── Googlebot-Image ───
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/images/",
          "/uploads/",
          "/products/",
          "/store/",
        ],
        disallow: ["/api/", "/admin/"],
      },

      // ─── Googlebot-Mobile ───
      {
        userAgent: "Googlebot-Mobile",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },

      // ─── Bingbot ───
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/internal/",
          "/graphql",
        ],
        crawlDelay: 1,
      },

      // ─── Bingbot-Image ───
      {
        userAgent: "BingPreview",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },

      // ─── Yahoo Slurp ───
      {
        userAgent: "Slurp",
        allow: "/",
        disallow: ["/api/", "/admin/", "/internal/"],
        crawlDelay: 2,
      },

      // ─── Baidu ───
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout/"],
        crawlDelay: 2,
      },

      // ─── Yandex ───
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/api/", "/admin/", "/internal/"],
        crawlDelay: 2,
      },

      // ─── DuckDuckGo ───
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 1,
      },

      // ─── Ahrefs ───
      {
        userAgent: "AhrefsBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/internal/"],
        crawlDelay: 2,
      },

      // ─── Ahrefs Site Audit ───
      {
        userAgent: "AhrefsSiteAudit",
        allow: "/",
        disallow: [],
        crawlDelay: 1,
      },

      // ─── SEMrush ───
      {
        userAgent: "SemrushBot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/internal/"],
        crawlDelay: 2,
      },

      // ─── SEMrush Site Audit ───
      {
        userAgent: "SiteAuditBot",
        allow: "/",
        disallow: [],
        crawlDelay: 1,
      },

      // ─── Moz ───
      {
        userAgent: "rogerbot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 2,
      },

      // ─── Screaming Frog ───
      {
        userAgent: "Screaming Frog SEO Spider",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 1,
      },

      // ─── Social Media Crawlers ───

      // Facebook
      {
        userAgent: "facebookexternalhit",
        allow: "/",
        disallow: [],
      },

      // Facebook Catalog
      {
        userAgent: "facebookcatalog",
        allow: "/",
        disallow: ["/api/"],
      },

      // Twitter
      {
        userAgent: "Twitterbot",
        allow: "/",
        disallow: [],
      },

      // LinkedIn
      {
        userAgent: "LinkedInBot",
        allow: "/",
        disallow: [],
      },

      // Pinterest
      {
        userAgent: "Pinterestbot",
        allow: "/",
        disallow: ["/api/"],
      },

      // WhatsApp
      {
        userAgent: "WhatsApp",
        allow: "/",
        disallow: [],
      },

      // Telegram
      {
        userAgent: "TelegramBot",
        allow: "/",
        disallow: [],
      },

      // Instagram
      {
        userAgent: "Instagram",
        allow: "/",
        disallow: [],
      },

      // ─── Other SEO Tools ───

      // UptimeRobot
      {
        userAgent: "UptimeRobot",
        allow: "/",
        disallow: ["/api/"],
      },

      // GTmetrix
      {
        userAgent: "GTmetrix",
        allow: "/",
        disallow: [],
      },

      // PageSpeed
      {
        userAgent: "Chrome-Lighthouse",
        allow: "/",
        disallow: [],
      },

      // Google PageSpeed Insights
      {
        userAgent: "Speed Insights",
        allow: "/",
        disallow: [],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-products.xml`,
      `${SITE_URL}/sitemap-stores.xml`,
      `${SITE_URL}/sitemap-categories.xml`,
      `${SITE_URL}/sitemap-static.xml`,
      `${SITE_URL}/sitemap-images.xml`,
    ],
    host: SITE_URL,
  };
}
