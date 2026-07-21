import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import { useAuthStore } from '@store/authStore';

const API_BASE_URL =
  process.env.API_BASE_URL || 'https://api.bhdoman.com/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.bhd.marketplace.tokens',
      });

      if (credentials) {
        const tokens = JSON.parse(credentials.password);
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
      }

      // Add locale header
      const { user } = useAuthStore.getState();
      if (user?.locale) {
        config.headers['Accept-Language'] = user.locale;
      }

      return config;
    } catch (error) {
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const credentials = await Keychain.getGenericPassword({
          service: 'com.bhd.marketplace.tokens',
        });

        if (credentials) {
          const tokens = JSON.parse(credentials.password);

          // Attempt to refresh token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refreshToken: tokens.refreshToken,
            }
          );

          const newTokens = refreshResponse.data.data.tokens;

          await Keychain.setGenericPassword(
            'auth_tokens',
            JSON.stringify(newTokens),
            { service: 'com.bhd.marketplace.tokens' }
          );

          useAuthStore.getState().setTokens(newTokens);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      // Handle forbidden
      console.warn('Access forbidden');
    }

    if (error.response?.status === 500) {
      console.error('Server error');
    }

    return Promise.reject(error);
  }
);

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export default apiClient;
