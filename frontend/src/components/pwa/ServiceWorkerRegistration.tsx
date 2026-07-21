"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface ServiceWorkerRegistrationProps {
  checkInterval?: number; // in milliseconds, default 60 minutes
  scope?: string;
  swPath?: string;
}

interface UpdateToastProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

function UpdateToast({ onUpdate, onDismiss }: UpdateToastProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="sw-update-toast"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        right: "24px",
        zIndex: 9999,
        backgroundColor: "#006400",
        color: "#FFFFFF",
        padding: "16px 20px",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        direction: "rtl",
        maxWidth: "500px",
        margin: "0 auto",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span style={{ fontSize: "15px", fontWeight: 500 }}>
          يتوفر تحديث جديد للتطبيق
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={onUpdate}
          style={{
            backgroundColor: "#FFFFFF",
            color: "#006400",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          تحديث الآن
        </button>
        <button
          onClick={onDismiss}
          style={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.4)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}

export default function ServiceWorkerRegistration({
  checkInterval = 60 * 60 * 1000, // 60 minutes
  scope = "/",
  swPath = "/sw.js",
}: ServiceWorkerRegistrationProps) {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Listen for service worker update messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATE_AVAILABLE") {
        setShowUpdateToast(true);
      }
      if (event.data?.type === "SW_ACTIVATED") {
        window.location.reload();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let isMounted = true;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swPath, {
          scope,
          updateViaCache: "imports",
        });

        if (!isMounted) return;

        registrationRef.current = registration;

        // Check for existing waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdateToast(true);
        }

        // Listen for new waiting workers
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              setWaitingWorker(newWorker);
              setShowUpdateToast(true);

              // Also dispatch a custom event for other components
              window.dispatchEvent(
                new CustomEvent("swUpdateAvailable", {
                  detail: { worker: newWorker },
                })
              );
            }
          });
        });

        // Listen for controller changes (new SW activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (isMounted) {
            window.location.reload();
          }
        });

        console.log("[SW] Service Worker registered:", registration.scope);
      } catch (error) {
        console.error("[SW] Service Worker registration failed:", error);
      }
    };

    // Wait for page load to avoid blocking
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }

    return () => {
      isMounted = false;
    };
  }, [scope, swPath]);

  // Periodic update checks
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !checkInterval
    ) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        console.log("[SW] Checked for updates");
      } catch (error) {
        console.error("[SW] Update check failed:", error);
      }
    };

    intervalRef.current = setInterval(checkForUpdates, checkInterval);

    // Also check on page visibility change (user returning to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkInterval]);

  // Manual update handler
  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      // Send skip waiting message to the new service worker
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setShowUpdateToast(false);
  }, [waitingWorker]);

  // Dismiss update toast
  const handleDismiss = useCallback(() => {
    setShowUpdateToast(false);
  }, []);

  return (
    <>
      {showUpdateToast && (
        <UpdateToast onUpdate={handleUpdate} onDismiss={handleDismiss} />
      )}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

// Hook to manually trigger update checks
export function useServiceWorkerUpdate() {
  const checkForUpdates = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    } catch (error) {
      console.error("[SW] Manual update check failed:", error);
    }
  }, []);

  return { checkForUpdates };
}
