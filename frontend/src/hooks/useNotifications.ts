import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import type {
  Notification,
  PaginatedNotifications,
  NotificationFilters,
} from '@/services/notifications.service';

// ------------------------------------------------------------------
// Query Keys
// ------------------------------------------------------------------
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.lists(), filters] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  unreadCount: () => [...notificationKeys.unread(), 'count'] as const,
};

// ------------------------------------------------------------------
// Notification Query Hooks
// ------------------------------------------------------------------

/**
 * Hook: useNotifications
 * Fetch paginated notifications. Refetches every 30s for real-time feel.
 */
export function useNotifications(
  filters: NotificationFilters = {},
): UseQueryResult<PaginatedNotifications, Error> {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationsService.getNotifications(filters),
    staleTime: 1000 * 15, // 15 seconds
    gcTime: 1000 * 60 * 5,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook: useUnreadCount
 * Fetch only the count of unread notifications. Refetches every 10s.
 */
export function useUnreadCount(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 5,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

// ------------------------------------------------------------------
// Notification Mutation Hooks (with Optimistic Updates)
// ------------------------------------------------------------------

/**
 * Hook: useMarkAsRead
 * Mark a specific notification as read with optimistic update.
 */
export function useMarkAsRead(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: notificationKeys.unreadCount(),
      });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData<PaginatedNotifications>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<number>(
        notificationKeys.unreadCount(),
      );

      // Optimistically update all notification lists
      previousLists.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, {
            ...data,
            items: data.items.map((item) =>
              item.id === notificationId
                ? { ...item, isRead: true, readAt: new Date().toISOString() }
                : item,
            ),
            unreadCount: Math.max(0, (data.unreadCount || 0) - 1),
          });
        }
      });

      // Optimistically update unread count
      if (previousCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          Math.max(0, previousCount - 1),
        );
      }

      return { previousLists, previousCount };
    },
    onError: (_err, _notificationId, context) => {
      // Rollback on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}

/**
 * Hook: useMarkAllAsRead
 * Mark all notifications as read with optimistic update.
 */
export function useMarkAllAsRead(): UseMutationResult<
  void,
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: notificationKeys.unreadCount(),
      });

      const previousLists = queryClient.getQueriesData<PaginatedNotifications>({
        queryKey: notificationKeys.lists(),
      });
      const previousCount = queryClient.getQueryData<number>(
        notificationKeys.unreadCount(),
      );

      // Optimistically mark all as read
      previousLists.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, {
            ...data,
            items: data.items.map((item) => ({
              ...item,
              isRead: true,
              readAt: item.readAt ?? new Date().toISOString(),
            })),
            unreadCount: 0,
          });
        }
      });

      queryClient.setQueryData(notificationKeys.unreadCount(), 0);

      return { previousLists, previousCount };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
