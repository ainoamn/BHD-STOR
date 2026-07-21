"use client";

import { useEffect, useState, useCallback } from "react";

interface OfflineIndicatorProps {
  autoHideDelay?: number; // ms to auto-hide when back online
  showSyncStatus?: boolean;
}

type SyncStatus = "idle" | "syncing" | "synced" | "error";

export default function OfflineIndicator({
  autoHideDelay = 3000,
  showSyncStatus = true,
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingActions, setPendingActions] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(true);

      // Trigger sync if there are pending actions
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        triggerBackgroundSync();
      }

      // Auto-hide after delay
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      setSyncStatus("idle");
    };

    // Check initial state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setIsVisible(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoHideDelay]);

  // Check for pending sync actions
  useEffect(() => {
    if (!showSyncStatus) return;

    const checkPendingActions = async () => {
      try {
        // Check IndexedDB for queued actions
        const db = await openIndexedDB("bhd-sync", 1);
        const stores = ["cart-actions", "wishlist-actions", "review-actions", "order-actions"];
        let total = 0;

        for (const storeName of stores) {
          const count = await db.count(storeName);
          total += count;
        }

        setPendingActions(total);
      } catch {
        // IndexedDB not available or empty
      }
    };

    checkPendingActions();

    // Check periodically when offline
    if (!isOnline) {
      const interval = setInterval(checkPendingActions, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, showSyncStatus]);

  // Trigger background sync
  const triggerBackgroundSync = useCallback(async () => {
    if (!isOnline) return;

    setSyncStatus("syncing");

    try {
      const registration = await navigator.serviceWorker.ready;

      // Register all sync tags
      const syncTags = [
        "sync-cart-actions",
        "sync-wishlist",
        "sync-reviews",
        "sync-orders",
      ];

      await Promise.all(
        syncTags.map((tag) =>
          registration.sync
            .register(tag)
            .catch((err) => console.log(`[Sync] ${tag} failed:`, err))
        )
      );

      // Wait a bit then check status
      setTimeout(() => {
        setSyncStatus("synced");
        setPendingActions(0);
      }, 2000);
    } catch (error) {
      console.error("[Sync] Background sync failed:", error);
      setSyncStatus("error");
    }
  }, [isOnline]);

  // Manually dismiss the indicator
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="offline-indicator"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9990,
        direction: "rtl",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div
        style={{
          backgroundColor: isOnline ? "#006400" : "#B91C1C",
          color: "#FFFFFF",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
        }}
      >
        {/* Icon & Message */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Status Icon */}
          {isOnline ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ flexShrink: 0 }}
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ flexShrink: 0 }}
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          )}

          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {isOnline
              ? syncStatus === "syncing"
                ? "جاري المزامنة..."
                : syncStatus === "synced"
                ? "متصل - تمت المزامنة"
                : "متصل بالإنترنت"
              : "غير متصل بالإنترنت"}
          </span>

          {/* Pending Actions Badge */}
          {!isOnline && pendingActions > 0 && (
            <span
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "10px",
                whiteSpace: "nowrap",
              }}
            >
              {pendingActions} إجراء معلق
            </span>
          )}

          {/* Sync Status for online */}
          {isOnline && showSyncStatus && syncStatus === "synced" && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                opacity: 0.9,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              تم التحديث
            </span>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          aria-label="إخفاء"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#FFFFFF",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "14px",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          ×
        </button>
      </div>

      {/* Progress bar for syncing */}
      {isOnline && syncStatus === "syncing" && (
        <div
          style={{
            height: "2px",
            backgroundColor: "rgba(255,255,255,0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "30%",
              backgroundColor: "#FFFFFF",
              animation: "progressSlide 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes progressSlide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}

// Hook for online status
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// IndexedDB helper
function openIndexedDB(
  dbName: string,
  version: number
): Promise<{ count: (store: string) => Promise<number> }> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      resolve({
        count: (storeName: string) =>
          new Promise((res, rej) => {
            try {
              const tx = db.transaction(storeName, "readonly");
              const store = tx.objectStore(storeName);
              const req = store.count();
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            } catch {
              res(0);
            }
          }),
      });
    };
  });
}
