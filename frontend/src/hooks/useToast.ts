'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification position on screen
 */
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

/**
 * Individual toast notification interface
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Notification message */
  message: string;
  /** Toast type - determines styling */
  type: ToastType;
  /** Auto-dismiss duration in milliseconds */
  duration: number;
  /** Creation timestamp */
  createdAt: number;
  /** Whether the toast is currently exiting */
  isExiting: boolean;
  /** Optional title for the toast */
  title?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

/**
 * Toast state management interface
 */
export interface ToastState {
  /** Array of active toasts */
  toasts: Toast[];
  /** Add a new toast notification */
  addToast: (options: AddToastOptions) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Remove all toasts */
  clearAll: () => void;
  /** Position of toast container */
  position: ToastPosition;
  /** Set toast container position */
  setPosition: (position: ToastPosition) => void;
  /** Maximum number of toasts to display */
  maxToasts: number;
  /** Update max toasts */
  setMaxToasts: (count: number) => void;
}

/**
 * Options for adding a new toast
 */
export interface AddToastOptions {
  /** Notification message (required) */
  message: string;
  /** Toast type (default: 'info') */
  type?: ToastType;
  /** Auto-dismiss duration in ms (default: 5000) */
  duration?: number;
  /** Optional title */
  title?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** If true, pauses auto-dismiss on hover */
  pauseOnHover?: boolean;
}

/**
 * Generate a unique toast ID
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Default toast durations by type (in milliseconds)
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

/**
 * Maximum number of toasts shown at once
 */
const DEFAULT_MAX_TOASTS = 5;

/**
 * Custom hook for managing toast notifications.
 *
 * Provides a complete toast notification system with:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Toast queue management with max limit
 * - Enter/exit animations support
 * - Pause on hover
 * - Configurable position
 * - Action buttons
 *
 * @returns ToastState object with all toast management functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { addToast, removeToast, toasts, clearAll } = useToast();
 *
 *   const handleClick = () => {
 *     addToast({
 *       message: 'Item added to cart!',
 *       type: 'success',
 *       duration: 3000,
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleClick}>Add to Cart</button>
 *       <ToastContainer toasts={toasts} onRemove={removeToast} />
 *     </>
 *   );
 * }
 * ```
 */
export function useToast(): ToastState {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position, setPosition] = useState<ToastPosition>('top-right');
  const [maxToasts, setMaxToasts] = useState<number>(DEFAULT_MAX_TOASTS);

  // Use refs to track timers without re-rendering
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pauseTimersRef = useRef<Map<string, number>>(new Map());

  /**
   * Clean up all timers on unmount
   */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  /**
   * Remove a toast by ID with exit animation
   */
  const removeToast = useCallback((id: string) => {
    // Mark toast as exiting for animation
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, isExiting: true } : toast))
    );

    // Clear any existing timer for this toast
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }

    // Remove from DOM after exit animation
    const removeTimer = setTimeout(() => {
      setToasts((prev) => {
        const toast = prev.find((t) => t.id === id);
        if (toast?.onDismiss) {
          toast.onDismiss();
        }
        return prev.filter((t) => t.id !== id);
      });
      timersRef.current.delete(`${id}-exit`);
    }, 300); // Match CSS animation duration

    timersRef.current.set(`${id}-exit`, removeTimer);
  }, []);

  /**
   * Add a new toast notification
   */
  const addToast = useCallback(
    (options: AddToastOptions): string => {
      const {
        message,
        type = 'info',
        duration = DEFAULT_DURATIONS[type],
        title,
        action,
        onDismiss,
      } = options;

      const id = generateToastId();

      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        title,
        action,
        onDismiss,
        createdAt: Date.now(),
        isExiting: false,
      };

      setToasts((prev) => {
        // Remove oldest toasts if exceeding max
        const updatedToasts = [...prev, newToast];
        if (updatedToasts.length > maxToasts) {
          const toRemove = updatedToasts.slice(0, updatedToasts.length - maxToasts);
          toRemove.forEach((toast) => {
            if (!toast.isExiting) {
              removeToast(toast.id);
            }
          });
          return updatedToasts.slice(-maxToasts);
        }
        return updatedToasts;
      });

      // Set auto-dismiss timer
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration + 100); // Add small buffer for animation

        timersRef.current.set(id, timer);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  /**
   * Pause auto-dismiss for a specific toast (on hover)
   */
  const pauseToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
      pauseTimersRef.current.set(id, Date.now());
    }
  }, []);

  /**
   * Resume auto-dismiss for a specific toast (on mouse leave)
   */
  const resumeToast = useCallback(
    (id: string) => {
      const toast = toasts.find((t) => t.id === id);
      const pausedAt = pauseTimersRef.current.get(id);

      if (toast && pausedAt) {
        const elapsed = Date.now() - pausedAt;
        const remaining = Math.max(0, toast.duration - elapsed);

        if (remaining > 0) {
          const timer = setTimeout(() => {
            removeToast(id);
          }, remaining);
          timersRef.current.set(id, timer);
        } else {
          removeToast(id);
        }

        pauseTimersRef.current.delete(id);
      }
    },
    [toasts, removeToast]
  );

  /**
   * Clear all toasts
   */
  const clearAll = useCallback(() => {
    // Mark all as exiting
    setToasts((prev) =>
      prev.map((toast) => ({ ...toast, isExiting: true }))
    );

    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    pauseTimersRef.current.clear();

    // Remove all after animation
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  /**
   * Update an existing toast
   */
  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<Toast, 'id'>>) => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
      );
    },
    []
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    position,
    setPosition,
    maxToasts,
    setMaxToasts,
  };
}

/**
 * Convenience hook with pre-configured toast helpers
 */
export function useToastHelpers() {
  const { addToast, removeToast, clearAll, toasts } = useToast();

  const success = useCallback(
    (message: string, options?: Omit<AddToastOptions, 'message' | 'type'>) => {
      return addToast({ ...options, message, type: 'success' });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<AddToastOptions, 'message' | 'type'>) => {
      return addToast({ ...options, message, type: 'error' });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<AddToastOptions, 'message' | 'type'>) => {
      return addToast({ ...options, message, type: 'warning' });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<AddToastOptions, 'message' | 'type'>) => {
      return addToast({ ...options, message, type: 'info' });
    },
    [addToast]
  );

  return {
    success,
    error,
    warning,
    info,
    addToast,
    removeToast,
    clearAll,
    toasts,
  };
}

export default useToast;
