import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  storeId?: string;
  isVerified: boolean;
  locale: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: Tokens | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

const secureSaveTokens = async (tokens: Tokens): Promise<void> => {
  try {
    await Keychain.setGenericPassword(
      'auth_tokens',
      JSON.stringify(tokens),
      { service: 'com.bhd.marketplace.tokens' }
    );
  } catch (error) {
    console.error('Failed to save tokens securely:', error);
  }
};

const secureDeleteTokens = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({
      service: 'com.bhd.marketplace.tokens',
    });
  } catch (error) {
    console.error('Failed to delete tokens:', error);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      login: async (user, tokens) => {
        await secureSaveTokens(tokens);
        set({ user, tokens, isAuthenticated: true, error: null });
      },

      logout: async () => {
        await secureDeleteTokens();
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
