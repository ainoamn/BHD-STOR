import apiClient, { ApiResponse } from './api';
import { User, Tokens } from '@store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  storeName?: string;
  storeDescription?: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<Tokens>> {
    const response = await apiClient.post<ApiResponse<Tokens>>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  async resetPassword(
    token: string,
    password: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      { token, password }
    );
    return response.data;
  },

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/verify-email',
      { token }
    );
    return response.data;
  },

  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/resend-verification',
      { email }
    );
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(
      '/auth/profile',
      data
    );
    return response.data;
  },

  async uploadAvatar(uri: string): Promise<ApiResponse<{ avatar: string }>> {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await apiClient.post<ApiResponse<{ avatar: string }>>(
      '/auth/avatar',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      { oldPassword, newPassword }
    );
    return response.data;
  },

  async socialLogin(
    provider: 'google' | 'apple' | 'facebook',
    token: string
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      `/auth/social/${provider}`,
      { token }
    );
    return response.data;
  },
};

export default authService;
