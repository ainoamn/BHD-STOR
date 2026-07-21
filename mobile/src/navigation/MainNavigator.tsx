import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';

// Screens
import HomeScreen from '@screens/HomeScreen';
import CategoriesScreen from '@screens/CategoriesScreen';
import CartScreen from '@screens/CartScreen';
import OrdersScreen from '@screens/OrdersScreen';
import ProfileScreen from '@screens/ProfileScreen';
import ProductDetailScreen from '@screens/ProductDetailScreen';
import ProductsScreen from '@screens/ProductsScreen';
import SearchScreen from '@screens/SearchScreen';
import StoreScreen from '@screens/StoreScreen';
import CheckoutScreen from '@screens/CheckoutScreen';
import WishlistScreen from '@screens/WishlistScreen';
import ChatScreen from '@screens/ChatScreen';

import { useCartStore } from '@store/cartStore';

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
  ProductDetail: { productId: string };
  Products: { categoryId?: string; categoryName?: string; featured?: boolean };
  Search: { query?: string };
  Store: { storeId: string };
  Checkout: undefined;
  Wishlist: undefined;
  Chat: undefined;
  Login: undefined;
  Register: undefined;
  Settings: undefined;
  Notifications: undefined;
  Help: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  StoreDashboard: undefined;
  AdminDashboard: undefined;
  BecomeSeller: undefined;
  OrderDetail: { orderId: string };
  TrackShipment: { orderId: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const tabBarIcon =
  (name: string) =>
  ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Icon name={focused ? name : `${name}-outline`} size={size} color={color} />
  );

const CartTabIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => {
  const cartCount = useCartStore((s) => s.totalCount());

  return (
    <View>
      <Icon name={cartCount() > 0 ? 'cart' : 'cart-outline'} size={size} color={color} />
      {cartCount() > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>
            {cartCount() > 99 ? '99+' : cartCount()}
          </Text>
        </View>
      )}
    </View>
  );
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: 4,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: tabBarIcon('home'),
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: tabBarIcon('shape'),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused, color, size }) => (
            <CartTabIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: tabBarIcon('package-variant'),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: tabBarIcon('account'),
        }}
      />
    </Tab.Navigator>
  );
};

// Import Text from react-native for the cart badge
import { Text } from 'react-native';

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          gestureEnabled: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Store"
        component={StoreScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  cartBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 3,
  },
});

export default MainNavigator;
