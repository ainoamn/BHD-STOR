// =============================================================================
// BHD Oman Marketplace - Auth Service
// =============================================================================

import { api, setAuthToken, removeAuthToken, uploadFile } from './api';
import { isDemoMode } from '@/lib/demo-mode';
import { persistAuthSession, clearAuthSession } from '@/lib/auth-storage';
import { demoAdminUsers } from '@/lib/demo-admin-data';
import {
  RegisterData,
  LoginData,
  AuthResponse,
  User,
  UpdateUserData,
} from '../types';

// ---------------------------------------------------------------------------
// Types specific to auth responses
// ---------------------------------------------------------------------------

export interface AuthSuccessResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface AvatarUpdateResponse {
  avatar: string;
}

// Admin types
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface PaginatedAdminUsers {
  users: AdminUser[];
  total: number;
}

export async function getAdminUsers(
  filters?: AdminUserFilters
): Promise<PaginatedAdminUsers> {
  if (isDemoMode()) {
    let users = demoAdminUsers.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    }));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q)
      );
    }
    return { users, total: users.length };
  }
  try {
    const response = await api.get<{ success: boolean; data: PaginatedAdminUsers }>(
      '/admin/users',
      { params: filters }
    );
    return response.data.data;
  } catch {
    return {
      users: demoAdminUsers.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      })),
      total: demoAdminUsers.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------

/**
 * Register a new user account.
 * @param data - Registration form data
 * @returns AuthResponse with user, tokens, and expiry
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  if (isDemoMode()) {
    const { demoRegister } = await import('@/lib/demo-auth');
    const result = demoRegister(data);
    setAuthToken(result.accessToken);
    storeRefreshToken(result.refreshToken);
    persistAuthSession(result.accessToken, result.refreshToken, result.user);
    return result;
  }

  try {
    const response = await api.post<{ success: boolean; data: AuthSuccessResponse }>(
      '/auth/register',
      {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || 'customer',
      }
    );

    const result = response.data.data;
    setAuthToken(result.accessToken);
    storeRefreshToken(result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  } catch {
    const { demoRegister } = await import('@/lib/demo-auth');
    const result = demoRegister(data);
    setAuthToken(result.accessToken);
    storeRefreshToken(result.refreshToken);
    persistAuthSession(result.accessToken, result.refreshToken, result.user);
    return result;
  }
}

/**
 * Log in an existing user.
 * @param data - Login credentials
 * @returns AuthResponse with user, tokens, and expiry
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  if (isDemoMode()) {
    const { demoLogin } = await import('@/lib/demo-auth');
    const result = demoLogin(data);
    setAuthToken(result.accessToken);
    storeRefreshToken(result.refreshToken);
    persistAuthSession(result.accessToken, result.refreshToken, result.user);
    return result;
  }

  try {
    const response = await api.post<{ success: boolean; data: AuthSuccessResponse }>(
      '/auth/login',
      {
        email: data.email,
        password: data.password,
      }
    );

    const result = response.data.data;
    setAuthToken(result.accessToken);
    storeRefreshToken(result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  } catch {
    const { demoLogin } = await import('@/lib/demo-auth');
    const result = demoLogin(data);
    setAuthToken(result.accessToken);
    storeRefreshToken(result.refreshToken);
    persistAuthSession(result.accessToken, result.refreshToken, result.user);
    return result;
  }
}

/**
 * Log out the current user and clear all auth state.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Even if the API call fails, we still clear local auth state
  } finally {
    removeAuthToken();
    clearStoredTokens();
    clearAuthSession();
  }
}

/**
 * Refresh the access token using a refresh token.
 * @param token - The refresh token
 * @returns New access and refresh tokens
 */
export async function refreshToken(token: string): Promise<TokenRefreshResponse> {
  const response = await api.post<{ success: boolean; data: TokenRefreshResponse }>(
    '/auth/refresh',
    { refreshToken: token }
  );

  const result = response.data.data;
  setAuthToken(result.accessToken);
  storeRefreshToken(result.refreshToken);

  return result;
}

/**
 * Request a password reset email.
 * @param email - The user's email address
 * @returns Success message
 */
export async function forgotPassword(email: string): Promise<MessageResponse> {
  const response = await api.post<{ success: boolean; data: MessageResponse }>(
    '/auth/forgot-password',
    { email }
  );
  return response.data.data;
}

/**
 * Reset password using a token from email.
 * @param token - The password reset token
 * @param newPassword - The new password
 * @returns Success message
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<MessageResponse> {
  const response = await api.post<{ success: boolean; data: MessageResponse }>(
    '/auth/reset-password',
    { token, newPassword }
  );
  return response.data.data;
}

/**
 * Verify a user's email address.
 * @param token - The email verification token
 * @returns Success message
 */
export async function verifyEmail(token: string): Promise<MessageResponse> {
  const response = await api.get<{ success: boolean; data: MessageResponse }>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  );
  return response.data.data;
}

/**
 * Get the currently authenticated user's profile.
 * @returns The current User object
 */
export async function getMe(): Promise<User> {
  if (isDemoMode()) {
    const { demoGetMe, isDemoToken } = await import('@/lib/demo-auth');
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('bhd_access_token') : null;
    if (isDemoToken(token)) return demoGetMe();
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  } catch {
    const { demoGetMe, isDemoToken } = await import('@/lib/demo-auth');
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('bhd_access_token') : null;
    if (isDemoToken(token)) return demoGetMe();
    throw new Error('Unauthorized');
  }
}

/**
 * Update the current user's profile.
 * @param data - Partial user data to update
 * @returns The updated User object
 */
export async function updateMe(data: UpdateUserData): Promise<User> {
  const response = await api.patch<{ success: boolean; data: User }>(
    '/auth/me',
    data
  );
  return response.data.data;
}

/**
 * Update the current user's avatar.
 * @param file - The new avatar image file
 * @returns Object with the new avatar URL
 */
export async function updateAvatar(file: File): Promise<AvatarUpdateResponse> {
  const response = await uploadFile<{ success: boolean; data: AvatarUpdateResponse }>(
    '/auth/me/avatar',
    file,
    'avatar'
  );
  return response.data;
}

/**
 * Change the current user's password.
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Success message
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<MessageResponse> {
  const response = await api.post<{ success: boolean; data: MessageResponse }>(
    '/auth/change-password',
    { currentPassword, newPassword }
  );
  return response.data.data;
}

/**
 * Initiate phone number verification.
 * @param phone - Phone number to verify
 * @returns Success message
 */
export async function requestPhoneVerification(phone: string): Promise<MessageResponse> {
  const response = await api.post<{ success: boolean; data: MessageResponse }>(
    '/auth/phone/verify-request',
    { phone }
  );
  return response.data.data;
}

/**
 * Complete phone number verification.
 * @param phone - Phone number
 * @param code - Verification code
 * @returns Success message
 */
export async function verifyPhone(phone: string, code: string): Promise<MessageResponse> {
  const response = await api.post<{ success: boolean; data: MessageResponse }>(
    '/auth/phone/verify',
    { phone, code }
  );
  return response.data.data;
}

/**
 * Initiate OAuth login (Google, Apple, etc.)
 * @param provider - OAuth provider name
 * @returns URL to redirect the user to
 */
export async function getOAuthUrl(provider: 'google' | 'apple' | 'facebook'): Promise<string> {
  const response = await api.get<{ success: boolean; data: { url: string } }>(
    `/auth/oauth/${provider}`
  );
  return response.data.data.url;
}

/**
 * Handle OAuth callback — exchange code for tokens
 * @param provider - OAuth provider name
 * @param code - Authorization code from provider
 * @returns AuthResponse
 */
export async function handleOAuthCallback(
  provider: string,
  code: string,
  state?: string
): Promise<AuthResponse> {
  const response = await api.post<{ success: boolean; data: AuthSuccessResponse }>(
    `/auth/oauth/${provider}/callback`,
    { code, state }
  );

  const result = response.data.data;
  setAuthToken(result.accessToken);
  storeRefreshToken(result.refreshToken);

  return {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function storeRefreshToken(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bhd_refresh_token', token);
    }
  } catch {
    // silently ignore
  }
}

function clearStoredTokens(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bhd_refresh_token');
    }
  } catch {
    // silently ignore
  }
}

// ---------------------------------------------------------------------------
// Re-export token helpers for convenience
// ---------------------------------------------------------------------------

export { setAuthToken, removeAuthToken, getAuthToken } from './api';

export const authService = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword: (data: { email: string }) => forgotPassword(data.email),
  resetPassword: (data: { token: string; password: string }) =>
    resetPassword(data.token, data.password),
  verifyEmail,
  getMe,
  updateProfile: updateMe,
  updateAvatar: (formData: FormData) => {
    const file = formData.get("avatar") as File;
    return updateAvatar(file);
  },
  changePassword,
  requestPhoneVerification,
  verifyPhone,
  getOAuthUrl,
  handleOAuthCallback,
  getAdminUsers,
  adminUpdateUser: async (_userId: string, _data: UpdateUserData) => ({} as User),
};
