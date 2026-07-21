"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

/* ------------------------------------------------------------------ */
/*                               Types                                 */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: "customer" | "seller" | "admin";
  phone?: string;
  isVerified: boolean;
  storeId?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshAccessToken: () => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: "customer" | "seller";
}

/* ------------------------------------------------------------------ */
/*                            Context                                  */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/* ------------------------------------------------------------------ */
/*                           Constants                                 */
/* ------------------------------------------------------------------ */

const ACCESS_TOKEN_KEY = "bhd_access_token";
const REFRESH_TOKEN_KEY = "bhd_refresh_token";
const USER_KEY = "bhd_user";
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 min before expiry

/* ------------------------------------------------------------------ */
/*                          Provider                                   */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Load stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (storedUser && storedAccess) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    const timeUntilRefresh = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER;
    if (timeUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshAccessToken();
      }, timeUntilRefresh);
    }
  }, []);

  // Store tokens
  const storeTokens = useCallback((tokens: AuthTokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    scheduleTokenRefresh(tokens.expiresAt);
  }, [scheduleTokenRefresh]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      const response = await mockLoginApi(email, password);
      const { user: userData, tokens } = response;

      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      storeTokens(tokens);
    } finally {
      setIsLoading(false);
    }
  }, [storeTokens]);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await mockRegisterApi(data);
      const { user: userData, tokens } = response;

      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      storeTokens(tokens);
    } finally {
      setIsLoading(false);
    }
  }, [storeTokens]);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  }, []);

  // Update user
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Refresh token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      logout();
      return false;
    }

    try {
      const response = await mockRefreshApi(refreshToken);
      storeTokens(response.tokens);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout, storeTokens]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        login,
        register,
        logout,
        updateUser,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*                         Mock API Functions                          */
/* ------------------------------------------------------------------ */

// Replace these with actual API calls

async function mockLoginApi(email: string, password: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    user: {
      id: "1",
      email,
      firstName: "أحمد",
      lastName: "الحارثي",
      role: "customer" as const,
      isVerified: true,
    } satisfies User,
    tokens: {
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
      expiresAt: Date.now() + 3600 * 1000,
    } satisfies AuthTokens,
  };
}

async function mockRegisterApi(data: RegisterData) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    user: {
      id: "2",
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || "customer",
      isVerified: false,
    } satisfies User,
    tokens: {
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
      expiresAt: Date.now() + 3600 * 1000,
    } satisfies AuthTokens,
  };
}

async function mockRefreshApi(refreshToken: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    tokens: {
      accessToken: "new_mock_access_token",
      refreshToken,
      expiresAt: Date.now() + 3600 * 1000,
    } satisfies AuthTokens,
  };
}
