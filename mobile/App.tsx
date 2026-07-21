/**
 * BHD Oman E-Commerce Marketplace
 * Root Application Component
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, LogBox, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';

import AppNavigator from '@navigation/AppNavigator';
import ErrorBoundary from '@components/ErrorBoundary';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
  'VirtualizedLists should never be nested',
]);

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Handle app focus for React Query
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

// Toast config for consistent styling
const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View
      style={{
        height: 60,
        width: '90%',
        backgroundColor: '#28A745',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{text1}</Text>
      {text2 && <Text style={{ color: '#FFF', fontSize: 12, marginTop: 2 }}>{text2}</Text>}
    </View>
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View
      style={{
        height: 60,
        width: '90%',
        backgroundColor: '#DC3545',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{text1}</Text>
      {text2 && <Text style={{ color: '#FFF', fontSize: 12, marginTop: 2 }}>{text2}</Text>}
    </View>
  ),
  info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View
      style={{
        height: 60,
        width: '90%',
        backgroundColor: '#17A2B8',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{text1}</Text>
      {text2 && <Text style={{ color: '#FFF', fontSize: 12, marginTop: 2 }}>{text2}</Text>}
    </View>
  ),
};

// Need to import View and Text for toast config
import { View, Text } from 'react-native';

const App: React.FC = () => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider
            publishableKey={
              process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'
            }
            merchantIdentifier="com.bhd.marketplace"
            urlScheme="bhdoman"
          >
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={isDarkMode ? '#121212' : '#F8F9FA'}
              translucent={false}
            />

            <AppNavigator />

            <Toast config={toastConfig} position="top" topOffset={60} />
          </StripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
