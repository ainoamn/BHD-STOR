"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "Tahoma, sans-serif", background: "#F8F5F0", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h2 style={{ color: "#006400" }}>حدث خطأ غير متوقع</h2>
            <p style={{ color: "#555" }}>{error?.message || "Something went wrong"}</p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#006400",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
