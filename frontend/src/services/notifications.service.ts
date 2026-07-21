// =============================================================================
// BHD Oman Marketplace - Notifications Service
// =============================================================================

import { api } from './api';
import { Notification } from '../types';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface NotificationPreferences {
  email: {
    orders: boolean;
    promotions: boolean;
    shipping: boolean;
    reviews: boolean;
    system: boolean;
  };
  push: {
    orders: boolean;
    promotions: boolean;
    shipping: boolean;
    reviews: boolean;
    system: boolean;
  };
  sms: {
    orders: boolean;
    shipping: boolean;
    promotions: boolean;
  };
}

// ---------------------------------------------------------------------------
// Notification Endpoints
// ---------------------------------------------------------------------------

/**
 * Get notifications for the current user.
 * @param page - Page number (default 1)
 * @param perPage - Items per page (default 20)
 * @returns List of notifications
 */
export async function getNotifications(
  page = 1,
  perPage = 20
): Promise<Notification[]> {
  const response = await api.get<{ success: boolean; data: Notification[] }>(
    '/notifications',
    { params: { page, perPage } }
  );
  return response.data.data;
}

/**
 * Mark a single notification as read.
 * @param notificationId - Notification UUID
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

/**
 * Get the count of unread notifications.
 * @returns Number of unread notifications
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<{ success: boolean; data: { count: number } }>(
    '/notifications/unread-count'
  );
  return response.data.data.count;
}

/**
 * Delete a notification.
 * @param notificationId - Notification UUID
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

/**
 * Delete all read notifications.
 */
export async function deleteReadNotifications(): Promise<void> {
  await api.delete('/notifications/read');
}

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

/**
 * Get the current user's notification preferences.
 * @returns Notification preference settings
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<{
    success: boolean;
    data: NotificationPreferences;
  }>('/notifications/preferences');
  return response.data.data;
}

/**
 * Update notification preferences.
 * @param preferences - Partial preferences to update
 * @returns Updated preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await api.patch<{
    success: boolean;
    data: NotificationPreferences;
  }>('/notifications/preferences', preferences);
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Push Notification Subscription (Web Push)
// ---------------------------------------------------------------------------

/**
 * Subscribe to push notifications.
 * @param subscription - PushSubscription object from the browser
 */
export async function subscribePush(
  subscription: PushSubscriptionJSON
): Promise<void> {
  await api.post('/notifications/push/subscribe', subscription);
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribePush(): Promise<void> {
  await api.delete('/notifications/push/subscribe');
}

// ---------------------------------------------------------------------------
// Real-time Notifications (SSE)
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time notifications via Server-Sent Events.
 * @param onNotification - Callback fired when a new notification arrives
 * @param onError - Callback fired on connection error
 * @returns A function to close the SSE connection
 */
export function subscribeToRealtimeNotifications(
  onNotification: (notification: Notification) => void,
  onError?: (error: Event) => void
): () => void {
  const eventSource = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/notifications/stream`,
    { withCredentials: true }
  );

  eventSource.addEventListener('notification', (event) => {
    try {
      const notification = JSON.parse(event.data) as Notification;
      onNotification(notification);
    } catch {
      // Ignore parse errors
    }
  });

  eventSource.addEventListener('error', (error) => {
    if (onError) {
      onError(error);
    }
    // Auto-reconnect is handled by EventSource by default
  });

  return () => {
    eventSource.close();
  };
}
