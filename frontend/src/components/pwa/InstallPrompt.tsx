"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  delay?: number; // Delay before showing prompt (ms)
  maxDismissals?: number; // Max times user can dismiss before stopping
}

export default function InstallPrompt({
  delay = 30000, // 30 seconds
  maxDismissals = 3,
}: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);

  // Detect iOS
  useEffect(() => {
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  // Check if app is already installed
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check display-mode for installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(isStandalone);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
      console.log("[PWA] App was installed");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Listen for display mode changes
    const mq = window.matchMedia("(display-mode: standalone)");
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mq.addEventListener("change", handleDisplayChange);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      mq.removeEventListener("change", handleDisplayChange);
    };
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after delay
      const timer = setTimeout(() => {
        const storedDismissals = parseInt(
          localStorage.getItem("bhd_install_dismissals") || "0",
          10
        );
        if (storedDismissals < maxDismissals) {
          setShowPrompt(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [delay, maxDismissals]);

  // Handle install click
  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      setShowPrompt(false);
      return;
    }

    if (!deferredPrompt) {
      setShowPrompt(false);
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[PWA] User accepted install");
    } else {
      console.log("[PWA] User dismissed install");
      const newCount = dismissCount + 1;
      setDismissCount(newCount);
      localStorage.setItem(
        "bhd_install_dismissals",
        newCount.toString()
      );
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt, isIOS, dismissCount]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem("bhd_install_dismissals", newCount.toString());
    setShowPrompt(false);
  }, [dismissCount]);

  // Close iOS instructions
  const handleCloseIOS = useCallback(() => {
    setShowIOSInstructions(false);
  }, []);

  // Don't show anything if already installed
  if (isInstalled) return null;

  return (
    <>
      {/* Install Prompt Banner */}
      {showPrompt && (
        <div
          role="dialog"
          aria-label="تثبيت التطبيق"
          className="install-prompt"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
            padding: "16px 20px",
            direction: "rtl",
            animation: "slideUpBanner 0.3s ease-out",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* App Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#006400",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#FFFFFF",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              BHD
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  lineHeight: 1.4,
                }}
              >
                ثبت تطبيق BHD
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "13px",
                  color: "#666666",
                  lineHeight: 1.4,
                }}
              >
                وصول أسرع وتجربة تسوق أفضل
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={handleInstall}
                style={{
                  backgroundColor: "#006400",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                تثبيت
              </button>
              <button
                onClick={handleDismiss}
                aria-label="إغلاق"
                style={{
                  backgroundColor: "transparent",
                  color: "#666666",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "18px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Install Instructions */}
      {showIOSInstructions && (
        <div
          role="dialog"
          aria-label="تعليمات التثبيت على iOS"
          onClick={handleCloseIOS}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px 20px 0 0",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              direction: "rtl",
              animation: "slideUpModal 0.3s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                }}
              >
                تثبيت التطبيق على iPhone
              </h3>
              <button
                onClick={handleCloseIOS}
                aria-label="إغلاق"
                style={{
                  backgroundColor: "#F5F5F5",
                  border: "none",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  fontSize: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <ol
              style={{
                padding: "0 20px 0 0",
                margin: 0,
                listStyle: "none",
                counterReset: "step",
              }}
            >
              {[
                {
                  text: 'اضغط على زر "المشاركة" Share في شريط Safari',
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16,6 12,2 8,6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  ),
                },
                {
                  text: 'مرر للأسفل واضغط على "إضافة إلى الشاشة الرئيسية"',
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  ),
                },
                {
                  text: 'اضغط "إضافة" في الأعلى',
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ),
                },
              ].map((step, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 0",
                    borderBottom:
                      index < 2 ? "1px solid #EEEEEE" : "none",
                    fontSize: "15px",
                    color: "#333333",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#E8F5E9",
                      color: "#006400",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {step.icon}
                  </div>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#FFF8E1",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#8B6914",
              }}
            >
              💡 بعد التثبيت، ستجد تطبيق BHD على شاشتك الرئيسية مثل أي تطبيق
              آخر
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUpBanner {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUpModal {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

// Hook to get install state
export function useIsInstalled(): boolean {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(standalone);
    };

    check();

    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", check);

    return () => mq.removeEventListener("change", check);
  }, []);

  return isInstalled;
}
