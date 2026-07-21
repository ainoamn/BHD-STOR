import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';

import { useAuthStore } from '@store/authStore';
import { colors } from '@theme/colors';

export type AppStackParamList = {
  Main: undefined;
  Auth: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

// Deep linking configuration
const linking = {
  prefixes: ['bhdoman://', 'https://bhdoman.com', 'https://www.bhdoman.com'],
  config: {
    screens: {
      Main: {
        screens: {
          MainTabs: {
            screens: {
              HomeTab: 'home',
              CategoriesTab: 'categories',
              CartTab: 'cart',
              OrdersTab: 'orders',
              ProfileTab: 'profile',
            },
          },
          ProductDetail: 'product/:productId',
          Products: 'products',
          Search: 'search',
          Store: 'store/:storeId',
          Checkout: 'checkout',
          Wishlist: 'wishlist',
          Chat: 'chat',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
    },
  },
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<any>(undefined);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('navigation_state');
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('Failed to restore navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  const handleStateChange = (state: any) => {
    AsyncStorage.setItem('navigation_state', JSON.stringify(state)).catch(
      console.error
    );
  };

  if (!isReady) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer
      linking={linking}
      initialState={initialState}
      onStateChange={handleStateChange}
      fallback={null}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
