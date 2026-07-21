"use client";

import { useEffect, useState, useCallback } from "react";

interface PushNotificationProps {
  vapidPublicKey?: string;
  apiEndpoint?: string;
}

interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  messages: boolean;
  priceDrops: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  orderUpdates: true,
  promotions: true,
  messages: true,
  priceDrops: true,
};

// Convert VAPID key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function PushNotification({
  vapidPublicKey = "BC9_YYtF5D9K1Z3-GyqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZYqRkZY",
  apiEndpoint = "/api/notifications/subscribe",
}: PushNotificationProps) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] =
    useState<PushSubscription | null>(null);
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Check support
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setIsSupported(false);
      return;
    }

    setPermission(Notification.permission);

    // Load saved settings
    const saved = localStorage.getItem("bhd_notification_settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {
        // use defaults
      }
    }
  }, []);

  // Check existing subscription
  useEffect(() => {
    if (!isSupported) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription =
          await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (error) {
        console.error("[Push] Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [isSupported]);

  // Handle push messages from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handlePushMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_MESSAGE_RECEIVED") {
        // Handle incoming push message data
        const { title, body, data } = event.data.payload || {};
        console.log("[Push] Message received:", { title, body, data });
      }
    };

    navigator.serviceWorker?.addEventListener("message", handlePushMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener(
        "message",
        handlePushMessage
      );
    };
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Request permission if not granted
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") {
          console.log("[Push] Permission denied");
          return;
        }
      }

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(newSubscription);

      // Send subscription to server
      await sendSubscriptionToServer(newSubscription, apiEndpoint);

      console.log("[Push] Subscribed successfully");
    } catch (error) {
      console.error("[Push] Subscription failed:", error);
    }
  }, [isSupported, vapidPublicKey, apiEndpoint]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify server about unsubscription
      await fetch(apiEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      console.log("[Push] Unsubscribed successfully");
    } catch (error) {
      console.error("[Push] Unsubscribe failed:", error);
    }
  }, [subscription, apiEndpoint]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem(
          "bhd_notification_settings",
          JSON.stringify(updated)
        );

        // Sync to server
        if (subscription) {
          fetch(apiEndpoint, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              settings: updated,
            }),
          }).catch(console.error);
        }

        return updated;
      });
    },
    [subscription, apiEndpoint]
  );

  // Send subscription to server
  const sendSubscriptionToServer = async (
    sub: PushSubscription,
    endpoint: string
  ) => {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          settings,
          userAgent: navigator.userAgent,
          language: navigator.language,
        }),
      });
    } catch (error) {
      console.error("[Push] Failed to send subscription:", error);
    }
  };

  // Toggle settings panel
  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  if (!isSupported) return null;

  return (
    <>
      {/* Push Notification Manager Button */}
      <button
        onClick={toggleSettings}
        aria-label="إدارة الإشعارات"
        style={{
          position: "fixed",
          bottom: "80px",
          left: "16px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: subscription ? "#006400" : "#999999",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 9980,
          transition: "background-color 0.2s",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          {subscription && (
            <circle cx="18" cy="6" r="4" fill="#FFD700" stroke="none" />
          )}
        </svg>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div
          role="dialog"
          aria-label="إعدادات الإشعارات"
          onClick={() => setShowSettings(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9997,
            backgroundColor: "rgba(0,0,0,0.5)",
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
              maxWidth: "480px",
              maxHeight: "80vh",
              overflow: "auto",
              direction: "rtl",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                }}
              >
                إعدادات الإشعارات
              </h2>
              <button
                onClick={() => setShowSettings(false)}
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

            {/* Status */}
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: subscription ? "#E8F5E9" : "#F5F5F5",
                borderRadius: "10px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: subscription ? "#006400" : "#999999",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "14px", color: "#333333" }}>
                {subscription
                  ? "الإشعارات مفعلة"
                  : "الإشعارات غير مفعلة"}
              </span>
            </div>

            {/* Main Toggle */}
            <ToggleRow
              label="تفعيل الإشعارات"
              description="استلام جميع الإشعارات"
              checked={!!subscription && settings.enabled}
              onChange={() => {
                if (!subscription) {
                  subscribe();
                } else if (settings.enabled) {
                  updateSettings({ enabled: false });
                } else {
                  updateSettings({ enabled: true });
                }
              }}
            />

            <div
              style={{
                height: "1px",
                backgroundColor: "#EEEEEE",
                margin: "12px 0",
              }}
            />

            {/* Category Toggles */}
            <ToggleRow
              label="تحديثات الطلبات"
              description="تأكيد الطلب، الشحن، والتوصيل"
              checked={settings.orderUpdates}
              onChange={() =>
                updateSettings({ orderUpdates: !settings.orderUpdates })
              }
              disabled={!subscription || !settings.enabled}
            />
            <ToggleRow
              label="العروض والتخفيضات"
              description="أحدث العروض والمنتجات المخفضة"
              checked={settings.promotions}
              onChange={() =>
                updateSettings({ promotions: !settings.promotions })
              }
              disabled={!subscription || !settings.enabled}
            />
            <ToggleRow
              label="الرسائل"
              description="رسائل من المتاجر والبائعين"
              checked={settings.messages}
              onChange={() =>
                updateSettings({ messages: !settings.messages })
              }
              disabled={!subscription || !settings.enabled}
            />
            <ToggleRow
              label="تنبيهات الأسعار"
              description="عند انخفاض سعر منتج تابعه"
              checked={settings.priceDrops}
              onChange={() =>
                updateSettings({ priceDrops: !settings.priceDrops })
              }
              disabled={!subscription || !settings.enabled}
            />

            {/* Actions */}
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                gap: "12px",
              }}
            >
              {subscription ? (
                <button
                  onClick={unsubscribe}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid #D32F2F",
                    backgroundColor: "#FFFFFF",
                    color: "#D32F2F",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  إلغاء الاشتراك
                </button>
              ) : (
                <button
                  onClick={subscribe}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#006400",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  تفعيل الإشعارات
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
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

// Toggle Row Component
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 500,
            color: "#1a1a1a",
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "13px", color: "#888888" }}>{description}</div>
      </div>
      <div
        onClick={(e) => {
          if (!disabled) {
            e.preventDefault();
            onChange();
          }
        }}
        style={{
          width: "48px",
          height: "28px",
          borderRadius: "14px",
          backgroundColor: checked ? "#006400" : "#CCCCCC",
          position: "relative",
          flexShrink: 0,
          transition: "background-color 0.2s",
          marginRight: "12px",
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            position: "absolute",
            top: "3px",
            right: checked ? "3px" : "23px",
            transition: "right 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </label>
  );
}

// Hook to check notification permission
export function useNotificationPermission(): {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
} {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, requestPermission };
}
