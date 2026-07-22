import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";
export const alt = "BHD Marketplace";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

// ─── Constants ───────────────────────────────────────────────────────

const SITE_NAME = "BHD Marketplace";
const TAGLINE_AR = "منصة التجارة العمانية الفاخرة";
const TAGLINE_EN = "Oman's Premium E-commerce Platform";
const BG_COLOR = "#F8F5F0";
const PRIMARY_COLOR = "#006400";
const GOLD_COLOR = "#C9A96E";
const DARK_COLOR = "#1A1A1A";
const TEXT_COLOR = "#333333";
const PRICE_COLOR = "#006400";

// ─── Font Loading ────────────────────────────────────────────────────

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBjOoCadl9OjTYYr8iQBhw.ttf"
    );
    if (response.ok) {
      return await response.arrayBuffer();
    }
  } catch {
    // Will use system font fallback
  }
  return null;
}

// ─── OG Image Generation ─────────────────────────────────────────────

export default async function OpenGraphImage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale || "ar";
  const isAr = locale === "ar";
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <OGImageLayout
        locale={locale}
        fontData={fontData}
      />
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "Tajawal",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
    }
  );
}

// ─── OG Image Layout Component ───────────────────────────────────────

function OGImageLayout({
  locale,
  fontData,
}: {
  locale: string;
  fontData: ArrayBuffer | null;
}) {
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: BG_COLOR,
        direction: dir as any,
        position: "relative",
        overflow: "hidden",
        fontFamily: fontData ? "Tajawal, sans-serif" : "system-ui, sans-serif",
      }}
    >
      {/* Decorative top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8px",
          background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${GOLD_COLOR} 100%)`,
        }}
      />

      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          backgroundColor: PRIMARY_COLOR,
          opacity: 0.05,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          backgroundColor: GOLD_COLOR,
          opacity: 0.08,
        }}
      />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "48px 60px",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Logo mark */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${GOLD_COLOR} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              B
            </div>
            {/* Logo text */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: PRIMARY_COLOR,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                }}
              >
                {SITE_NAME}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: TEXT_COLOR,
                  opacity: 0.6,
                  marginTop: 2,
                  lineHeight: 1,
                }}
              >
                {isAr ? TAGLINE_AR : TAGLINE_EN}
              </span>
            </div>
          </div>

          {/* Badge */}
          <div
            style={{
              backgroundColor: `${PRIMARY_COLOR}15`,
              color: PRIMARY_COLOR,
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: PRIMARY_COLOR,
                display: "inline-block",
              }}
            />
            {isAr ? "سلطنة عُمان" : "Sultanate of Oman"}
          </div>
        </div>

        {/* Hero Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            flex: 1,
          }}
        >
          {/* Text Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <h1
              style={{
                fontSize: isAr ? 52 : 48,
                fontWeight: 800,
                color: DARK_COLOR,
                lineHeight: 1.2,
                margin: 0,
                letterSpacing: -1,
              }}
            >
              {isAr ? (
                <>
                  اكتشف منتجات{" "}
                  <span style={{ color: PRIMARY_COLOR }}>فريدة</span>
                  <br />
                  من متاجر عمانية
                </>
              ) : (
                <>
                  Discover{" "}
                  <span style={{ color: PRIMARY_COLOR }}>Unique</span>{" "}
                  Products
                  <br />
                  From Omani Stores
                </>
              )}
            </h1>

            <p
              style={{
                fontSize: 18,
                color: TEXT_COLOR,
                opacity: 0.7,
                marginTop: 16,
                lineHeight: 1.6,
                maxWidth: 520,
              }}
            >
              {isAr
                ? "آلاف المنتجات من أزياء، إلكترونيات، مجوهرات، عطور وأكثر - كلها من متاجر عمانية موثوقة"
                : "Thousands of products from fashion, electronics, jewelry, perfumes & more - all from trusted Omani stores"}
            </p>

            {/* Stats Row */}
            <div
              style={{
                display: "flex",
                gap: 32,
                marginTop: 28,
              }}
            >
              <StatItem value="10K+" label={isAr ? "منتج" : "Products"} />
              <StatItem value="500+" label={isAr ? "متجر" : "Stores"} />
              <StatItem value="50K+" label={isAr ? "عميل" : "Customers"} />
            </div>
          </div>

          {/* Visual Element */}
          <div
            style={{
              width: 280,
              height: 280,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Decorative pattern */}
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: "50%",
                border: `3px solid ${GOLD_COLOR}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${PRIMARY_COLOR}10 0%, ${GOLD_COLOR}15 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Shopping bag icon */}
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={PRIMARY_COLOR}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>

              {/* Floating elements */}
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${GOLD_COLOR}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={GOLD_COLOR}
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 10,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: `${PRIMARY_COLOR}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={PRIMARY_COLOR}
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: `1px solid ${GOLD_COLOR}20`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Feature badges */}
            <FeatureBadge text={isAr ? "دفع آمن" : "Secure Payment"} />
            <FeatureBadge text={isAr ? "شحن سريع" : "Fast Shipping"} />
            <FeatureBadge text={isAr ? "منتجات أصلية" : "Authentic Products"} />
          </div>

          <span
            style={{
              fontSize: 14,
              color: TEXT_COLOR,
              opacity: 0.5,
              fontWeight: 500,
            }}
          >
            bhd.market
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: PRIMARY_COLOR,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 13,
          color: TEXT_COLOR,
          opacity: 0.6,
          marginTop: 4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function FeatureBadge({ text }: { text: string }) {
  return (
    <span
      style={{
        backgroundColor: `${PRIMARY_COLOR}10`,
        color: PRIMARY_COLOR,
        padding: "6px 14px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

// ─── Product-Specific OG Image ───────────────────────────────────────

export async function generateProductOGImage({
  productName,
  price,
  currency = "OMR",
  productImage,
  storeName,
  locale = "ar",
}: {
  productName: string;
  price: number;
  currency?: string;
  productImage?: string;
  storeName?: string;
  locale?: string;
}): Promise<ImageResponse> {
  const isAr = locale === "ar";
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <ProductOGLayout
        productName={productName}
        price={price}
        currency={currency}
        productImage={productImage}
        storeName={storeName}
        isAr={isAr}
        fontData={fontData}
      />
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "Tajawal",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
    }
  );
}

// Product OG Layout
function ProductOGLayout({
  productName,
  price,
  currency,
  productImage,
  storeName,
  isAr,
  fontData,
}: {
  productName: string;
  price: number;
  currency: string;
  productImage?: string;
  storeName?: string;
  isAr: boolean;
  fontData: ArrayBuffer | null;
}) {
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: BG_COLOR,
        direction: dir as any,
        position: "relative",
        overflow: "hidden",
        fontFamily: fontData ? "Tajawal, sans-serif" : "system-ui, sans-serif",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${GOLD_COLOR} 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "40px 50px",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Product Image Area */}
        <div
          style={{
            width: 420,
            height: 420,
            borderRadius: 24,
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            flexShrink: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PRIMARY_COLOR}
                strokeWidth="1"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: 14, color: TEXT_COLOR, opacity: 0.5 }}>
                {isAr ? "صورة المنتج" : "Product Image"}
              </span>
            </div>
          )}

          {/* BHD watermark */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: `${PRIMARY_COLOR}90`,
              color: "#FFFFFF",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            BHD
          </div>
        </div>

        {/* Product Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 16,
          }}
        >
          {/* Store name */}
          {storeName && (
            <span
              style={{
                fontSize: 14,
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              {storeName}
            </span>
          )}

          {/* Product name */}
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: DARK_COLOR,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {productName}
          </h1>

          {/* Price */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: PRICE_COLOR,
                lineHeight: 1,
              }}
            >
              {price.toFixed(3)}
            </span>
            <span
              style={{
                fontSize: 20,
                color: TEXT_COLOR,
                opacity: 0.7,
                fontWeight: 600,
              }}
            >
              {currency}
            </span>
          </div>

          {/* CTA hint */}
          <div
            style={{
              marginTop: 8,
              padding: "14px 24px",
              backgroundColor: PRIMARY_COLOR,
              color: "#FFFFFF",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {isAr ? "تسوق الآن على BHD" : "Shop Now on BHD"}
          </div>

          {/* URL */}
          <span
            style={{
              fontSize: 13,
              color: TEXT_COLOR,
              opacity: 0.5,
              marginTop: 12,
            }}
          >
            bhd.market
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Category OG Image ───────────────────────────────────────────────

export async function generateCategoryOGImage({
  categoryName,
  productCount,
  categoryImage,
  locale = "ar",
}: {
  categoryName: string;
  productCount?: number;
  categoryImage?: string;
  locale?: string;
}): Promise<ImageResponse> {
  const isAr = locale === "ar";
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG_COLOR,
          position: "relative",
          overflow: "hidden",
          fontFamily: fontData ? "Tajawal, sans-serif" : "system-ui, sans-serif",
          padding: "48px 60px",
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${GOLD_COLOR} 100%)`,
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${GOLD_COLOR} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            B
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: PRIMARY_COLOR }}>
            {SITE_NAME}
          </span>
        </div>

        {/* Main */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: DARK_COLOR,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {categoryName}
          </h1>
          {productCount && (
            <p
              style={{
                fontSize: 22,
                color: TEXT_COLOR,
                opacity: 0.7,
                margin: 0,
              }}
            >
              {isAr
                ? `${productCount.toLocaleString("ar-OM")}+ منتج متاح`
                : `${productCount.toLocaleString("en-OM")}+ Products Available`}
            </p>
          )}
          <div
            style={{
              marginTop: 16,
              padding: "14px 32px",
              backgroundColor: PRIMARY_COLOR,
              color: "#FFFFFF",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {isAr ? "تصفح المنتجات" : "Browse Products"}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 14,
            color: TEXT_COLOR,
            opacity: 0.5,
          }}
        >
          bhd.market
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "Tajawal",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
    }
  );
}
