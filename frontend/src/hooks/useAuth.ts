import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { isAdminRole, isSellerRole } from '@/lib/auth-helpers';
import { getPersistedUser, persistAuthSession, clearAuthSession } from '@/lib/auth-storage';
import type {
  User,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  UpdateProfileData,
  AuthResponse,
} from '@/services/auth.service';

// ------------------------------------------------------------------
// Query & Mutation Keys
// ------------------------------------------------------------------
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// ------------------------------------------------------------------
// Storage Helpers
// ------------------------------------------------------------------
const ACCESS_TOKEN_KEY = 'bhd_access_token';
const REFRESH_TOKEN_KEY = 'bhd_refresh_token';

const storeTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    clearAuthSession();
  }
};

// ------------------------------------------------------------------
// Individual Hooks
// ------------------------------------------------------------------

/**
 * Hook: useUser
 * Fetches the currently authenticated user.
 */
export function useUser(): UseQueryResult<User | null, Error> {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACCESS_TOKEN_KEY)
          : null;
      if (!token) return null;

      try {
        const user = await authService.getMe();
        const refresh =
          typeof window !== 'undefined'
            ? localStorage.getItem(REFRESH_TOKEN_KEY) || ''
            : '';
        persistAuthSession(token, refresh, user);
        return user;
      } catch {
        return getPersistedUser();
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook: useRegister
 * Mutation to register a new user.
 */
export function useRegister(): UseMutationResult<
  AuthResponse,
  Error,
  RegisterData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      if (data.accessToken && data.refreshToken) {
        storeTokens(data.accessToken, data.refreshToken);
        persistAuthSession(data.accessToken, data.refreshToken, data.user);
      }
      queryClient.setQueryData(authKeys.user(), data.user);
    },
  });
}

/**
 * Hook: useLogin
 * Mutation to log in a user. Stores tokens and refreshes user query on success.
 */
export function useLogin(): UseMutationResult<
  AuthResponse,
  Error,
  LoginCredentials
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      if (data.accessToken && data.refreshToken) {
        storeTokens(data.accessToken, data.refreshToken);
        persistAuthSession(data.accessToken, data.refreshToken, data.user);
      }
      queryClient.setQueryData(authKeys.user(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Also invalidate cart and wishlist on login
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Hook: useLogout
 * Mutation to log out. Clears tokens and invalidates all queries on success.
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
      window.location.href = '/';
    },
    onError: () => {
      // Even if the server logout fails, clear local state
      clearTokens();
      queryClient.clear();
      window.location.href = '/';
    },
  });
}

/**
 * Hook: useForgotPassword
 * Mutation to request a password reset email.
 */
export function useForgotPassword(): UseMutationResult<
  { message: string },
  Error,
  ForgotPasswordData
> {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
  });
}

/**
 * Hook: useResetPassword
 * Mutation to reset password with a token.
 */
export function useResetPassword(): UseMutationResult<
  { message: string },
  Error,
  ResetPasswordData
> {
  return useMutation({
    mutationFn: (data: ResetPasswordData) => authService.resetPassword(data),
  });
}

/**
 * Hook: useUpdateProfile
 * Mutation to update the authenticated user's profile.
 */
export function useUpdateProfile(): UseMutationResult<
  User,
  Error,
  UpdateProfileData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.user(), updatedUser);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}

/**
 * Hook: useUpdateAvatar
 * Mutation to update the user's avatar image.
 */
export function useUpdateAvatar(): UseMutationResult<
  User,
  Error,
  FormData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => authService.updateAvatar(formData),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.user(), updatedUser);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}

// ------------------------------------------------------------------
// Combined Auth Hook (convenience)
// ------------------------------------------------------------------

export interface UseAuthReturn {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  login: UseMutationResult<AuthResponse, Error, LoginCredentials>;
  logout: UseMutationResult<void, Error, void>;
  register: UseMutationResult<AuthResponse, Error, RegisterData>;
  forgotPassword: UseMutationResult<{ message: string }, Error, ForgotPasswordData>;
  resetPassword: UseMutationResult<{ message: string }, Error, ResetPasswordData>;
  updateProfile: UseMutationResult<User, Error, UpdateProfileData>;
  updateAvatar: UseMutationResult<User, Error, FormData>;
}

/**
 * Hook: useAuth
 * Centralised auth state combining user query and all auth mutations.
 */
export function useAuth(): UseAuthReturn {
  const userQuery = useUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  const updateProfileMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();

  const user = userQuery.data;
  const isLoading = userQuery.isLoading;
  const isAuthenticated = !!user;
  const isAdmin = isAdminRole(user?.role);
  const isSeller = isSellerRole(user?.role);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isSeller,
    login: loginMutation,
    logout: logoutMutation,
    register: registerMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    updateProfile: updateProfileMutation,
    updateAvatar: updateAvatarMutation,
  };
}
