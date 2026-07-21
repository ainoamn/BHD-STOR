import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import { authService, LoginCredentials, RegisterData } from '@services/auth.service';
import Toast from 'react-native-toast-message';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    isLoading: storeLoading,
    error: storeError,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
    setError,
    clearError,
  } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onMutate: () => {
      setLoading(true);
      clearError();
    },
    onSuccess: (response) => {
      if (response.success) {
        storeLogin(response.data.user, response.data.tokens);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Login successful',
        });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onMutate: () => {
      setLoading(true);
      clearError();
    },
    onSuccess: (response) => {
      if (response.success) {
        storeLogin(response.data.user, response.data.tokens);
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'Account created successfully',
        });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: message,
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      storeLogout();
      queryClient.clear();
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'See you soon!',
      });
    },
    onError: () => {
      // Still logout locally even if server fails
      storeLogout();
      queryClient.clear();
    },
  });

  // Profile query
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<typeof authService.updateProfile>[0]) =>
      authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update profile',
      });
    },
  });

  // Social login mutation
  const socialLoginMutation = useMutation({
    mutationFn: ({
      provider,
      token,
    }: {
      provider: 'google' | 'apple' | 'facebook';
      token: string;
    }) => authService.socialLogin(provider, token),
    onSuccess: (response) => {
      if (response.success) {
        storeLogin(response.data.user, response.data.tokens);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Login successful',
        });
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.response?.data?.message || 'Social login failed',
      });
    },
  });

  return {
    // State
    user,
    isAuthenticated,
    isLoading: storeLoading || loginMutation.isPending || registerMutation.isPending,
    error: storeError,

    // Queries
    profile: profileQuery.data?.data,
    isProfileLoading: profileQuery.isLoading,

    // Mutations
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    socialLogin: socialLoginMutation.mutateAsync,

    // Helpers
    clearError,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller' || user?.role === 'admin',
  };
};

export default useAuth;
