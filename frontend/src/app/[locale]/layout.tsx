import React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { LocaleProviders } from "./providers";
import { SsoSessionHydrate } from "@/components/auth/SsoSessionHydrate";
import { SessionKeepAlive } from "@/components/auth/SessionKeepAlive";
import "@/styles/globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BHD Market - السوق العماني الذكي",
    template: "%s | BHD Market",
  },
  description:
    "أول منصة ذكية للتجارة الإلكترونية في سلطنة عمان. اكتشف منتجات عمانية أصيلة، تمور، عطور، هدايا تذكارية، والمزيد. تجربة تسوق فريدة مدعومة بالذكاء الاصطناعي.",
  keywords: [
    "BHD",
    "BHD Market",
    "Oman marketplace",
    "e-commerce Oman",
    "Omani products",
    "dates Oman",
    "frankincense",
    "عمان",
    "تسوق",
    "تمور عمانية",
    "عطور شرقية",
    "هدايا عمانية",
    "سوق عمان",
    "تجارة إلكترونية عمان",
  ],
  authors: [{ name: "BHD Technology" }],
  creator: "BHD Technology",
  publisher: "BHD Technology",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "ar_OM",
    url: "https://bhd.market",
    siteName: "BHD Market",
    title: "BHD Market - السوق العماني الذكي",
    description:
      "أول منصة ذكية للتجارة الإلكترونية في سلطنة عمان. اكتشف منتجات عمانية أصيلة.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BHD Market - السوق العماني الذكي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BHD Market - السوق العماني الذكي",
    description:
      "أول منصة ذكية للتجارة الإلكترونية في سلطنة عمان.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://bhd.market",
    languages: {
      "ar-OM": "https://bhd.market/ar",
      "en-OM": "https://bhd.market/en",
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  other: {
    "theme-color": "#075c45",
    "msapplication-TileColor": "#075c45",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "BHD Market",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const lang = locale === "ar" ? "ar" : "en";

  return (
    <html lang={lang} dir={dir} className={ibmPlexArabic.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body
        className={`${ibmPlexArabic.className} antialiased bg-[#fbfaf7] dark:bg-gray-950 text-[#092d24] dark:text-white min-h-screen`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SsoSessionHydrate />
          <SessionKeepAlive />
          <LocaleProviders>{children}</LocaleProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
