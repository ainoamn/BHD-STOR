// =============================================================================
// BHD Oman Marketplace - Axios API Instance
// =============================================================================

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  Canceler,
} from 'axios';
import { isDemoToken } from '@/lib/demo-token';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const AUTH_TOKEN_KEY = 'bhd_access_token';
const REFRESH_TOKEN_KEY = 'bhd_refresh_token';
const TOKEN_EXPIRES_KEY = 'bhd_token_expires';

// In-memory token (avoids localStorage access on every call)
let __memoryToken: string | null = null;
let __isRefreshing = false;
let __refreshSubscribers: Array<(token: string) => void> = [];

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/**
 * Store auth token in memory + localStorage (if available)
 */
export function setAuthToken(token: string): void {
  __memoryToken = token;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // silently ignore localStorage errors (e.g. private mode)
  }
}

/**
 * Remove auth token from memory + localStorage
 */
export function removeAuthToken(): void {
  __memoryToken = null;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_KEY);
    }
  } catch {
    // silently ignore
  }
}

/**
 * Get current auth token (memory first, then localStorage)
 */
export function getAuthToken(): string | null {
  if (__memoryToken) return __memoryToken;
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // silently ignore
  }
  return null;
}

/**
 * Get refresh token from storage
 */
function getRefreshToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // silently ignore
  }
  return null;
}

/**
 * Subscribe to token refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  __refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onTokenRefreshed(newToken: string): void {
  __refreshSubscribers.forEach((cb) => cb(newToken));
  __refreshSubscribers = [];
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 3000;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Request interceptor: attach auth token
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();

    // Attach Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set Content-Type for FormData requests
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      // Remove default Content-Type to let browser set boundary
      delete config.headers['content-type'];
    }

    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = new Date().toISOString();

    // Add cancellation token support via request config
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Response interceptor: handle errors & token refresh
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Any successful response processing can go here
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No config available — can't retry
    if (!originalRequest) {
      return Promise.reject(formatApiError(error));
    }

    const status = error.response?.status;

    // ── 401 Unauthorized ──────────────────────────────────────────────────
    if (status === 401) {
      const currentToken = getAuthToken();

      // Demo tokens should never trigger refresh/clear flows
      if (isDemoToken(currentToken)) {
        return Promise.reject(formatApiError(error));
      }

      const refreshToken = getRefreshToken();

      // No refresh token — redirect to login
      if (!refreshToken) {
        removeAuthToken();
        redirectToLogin();
        return Promise.reject(formatApiError(error));
      }

      // Already refreshing — queue this request
      if (__isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      // Start token refresh
      __isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const {
          accessToken,
          refreshToken: newRefreshToken,
        } = refreshResponse.data.data as {
          accessToken: string;
          refreshToken: string;
        };

        setAuthToken(accessToken);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          }
        } catch {
          // ignore
        }

        // Update original request header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Notify queued requests
        onTokenRefreshed(accessToken);
        __isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        __isRefreshing = false;
        __refreshSubscribers = [];
        removeAuthToken();
        redirectToLogin();
        return Promise.reject(formatApiError(refreshError as AxiosError));
      }
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────
    if (status === 403) {
      // User lacks permission — could emit an event or toast
      if (typeof window !== 'undefined') {
        // Option: emit global event for toast notification
        window.dispatchEvent(
          new CustomEvent('bhd:forbidden', {
            detail: { message: 'You do not have permission to perform this action.' },
          })
        );
      }
      return Promise.reject(formatApiError(error));
    }

    // ── 404 Not Found ─────────────────────────────────────────────────────
    if (status === 404) {
      return Promise.reject(formatApiError(error));
    }

    // ── 422 Validation Error ──────────────────────────────────────────────
    if (status === 422) {
      return Promise.reject(formatApiError(error));
    }

    // ── 429 Rate Limit ────────────────────────────────────────────────────
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      return Promise.reject(
        formatApiError(error, `Rate limited. Retry after ${retryAfter ?? 'a few'} seconds.`)
      );
    }

    // ── 500 Server Error ──────────────────────────────────────────────────
    if (status && status >= 500) {
      return Promise.reject(
        formatApiError(error, 'Something went wrong on our end. Please try again later.')
      );
    }

    // ── Network / Other errors ────────────────────────────────────────────
    if (!error.response) {
      return Promise.reject(
        formatApiError(error, 'Network error. Please check your connection and try again.')
      );
    }

    return Promise.reject(formatApiError(error));
  }
);

// ---------------------------------------------------------------------------
// Error formatting helper
// ---------------------------------------------------------------------------

interface FormattedApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, string[]>;
  originalError: AxiosError;
}

function formatApiError(
  error: AxiosError,
  fallbackMessage?: string
): FormattedApiError {
  const response = error.response;
  const data = response?.data as
    | { message?: string; error?: { message?: string; details?: Record<string, string[]> }; code?: string }
    | undefined;

  let message = fallbackMessage || 'An unexpected error occurred.';
  let details: Record<string, string[]> | undefined;
  let code: string | undefined;

  if (data) {
    // Backend error format
    message =
      (data as Record<string, unknown>).message as string ||
      (data.error?.message as string) ||
      fallbackMessage ||
      'An unexpected error occurred.';
    details = data.error?.details;
    code = data.code || String(response?.status);
  } else if (error.message) {
    message = error.message;
  }

  return {
    message,
    status: response?.status,
    code,
    details,
    originalError: error,
  };
}

// ---------------------------------------------------------------------------
// Redirect helper
// ---------------------------------------------------------------------------

function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bhd:sessionExpired'));
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    const locale = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
    window.location.href = `/${locale}/auth/login?returnUrl=${returnUrl}`;
  }
}

// ---------------------------------------------------------------------------
// Cancel token helpers
// ---------------------------------------------------------------------------

/**
 * Create an Axios cancel token source
 */
export function createCancelToken(): { token: AbortSignal; cancel: Canceler } {
  const controller = new AbortController();
  return {
    token: controller.signal,
    cancel: ((reason?: string) => {
      controller.abort(reason || 'Request cancelled');
    }) as unknown as Canceler,
  };
}

/**
 * Check if an error is a cancellation
 */
export function isCancel(error: unknown): boolean {
  return axios.isCancel(error);
}

/**
 * Check if an error is an AbortError (cancelled)
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

// ---------------------------------------------------------------------------
// Typed request helpers
// ---------------------------------------------------------------------------

/**
 * Make a GET request with proper typing
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.get<T>(url, config);
  return response.data;
}

/**
 * Make a POST request with proper typing
 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.post<T>(url, data, config);
  return response.data;
}

/**
 * Make a PUT request with proper typing
 */
export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.put<T>(url, data, config);
  return response.data;
}

/**
 * Make a PATCH request with proper typing
 */
export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.patch<T>(url, data, config);
  return response.data;
}

/**
 * Make a DELETE request with proper typing
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.delete<T>(url, config);
  return response.data;
}

// ---------------------------------------------------------------------------
// Build query-string from filter object
// ---------------------------------------------------------------------------

/**
 * Convert a filter object to a URL query string.
 * Handles arrays, nested objects, and strips undefined values.
 */
export function buildQueryString(
  params: Record<string, unknown>
): string {
  const clean: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        clean[key] = value.join(',');
      }
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = JSON.stringify(value);
    } else {
      clean[key] = String(value);
    }
  });

  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// Upload helper (multipart/form-data)
// ---------------------------------------------------------------------------

/**
 * Upload a file with progress tracking
 */
export async function uploadFile<T>(
  url: string,
  file: File,
  fieldName = 'file',
  onProgress?: (percent: number) => void,
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const response = await api.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { api };
export default api;
export type { FormattedApiError as ApiErrorDetail };
