import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import { DriverHomeScreen } from '../screens/driver/DriverHomeScreen';
import { ShipmentsScreen } from '../screens/driver/ShipmentsScreen';
import { ShipmentDetailScreen } from '../screens/driver/ShipmentDetailScreen';
import { MapScreen } from '../screens/driver/MapScreen';
import { DeliveryCompletionScreen } from '../screens/driver/DeliveryCompletionScreen';
import { EarningsScreen } from '../screens/driver/EarningsScreen';
import { ProfileScreen } from '../screens/driver/ProfileScreen';
import { ScanScreen } from '../screens/driver/ScanScreen';
import { IssueReportScreen } from '../screens/driver/IssueReportScreen';

// Navigation param types
export type ShipmentsStackParamList = {
  ShipmentsList: undefined;
  ShipmentDetail: { id: string };
  DeliveryCompletion: { shipmentId: string };
  IssueReport: { shipmentId: string };
};

export type MapStackParamList = {
  MapView: undefined;
  ShipmentDetail: { id: string };
};

export type EarningsStackParamList = {
  EarningsMain: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

export type DriverStackParamList = {
  DriverTabs: undefined;
  Shipments: undefined;
  Map: undefined;
  Earnings: undefined;
  Profile: undefined;
  Scan: undefined;
} & ShipmentsStackParamList &
  MapStackParamList &
  EarningsStackParamList &
  ProfileStackParamList;

export type DriverTabParamList = {
  Home: undefined;
  Shipments: undefined;
  Map: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();
const ShipmentsStack = createNativeStackNavigator<ShipmentsStackParamList>();
const MapStackNav = createNativeStackNavigator<MapStackParamList>();
const EarningsStackNav = createNativeStackNavigator<EarningsStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const RootStack = createNativeStackNavigator<DriverStackParamList>();

// Tab icon configuration
const tabIcons: Record<string, { inactive: string; active: string }> = {
  Home: { inactive: 'home-outline', active: 'home' },
  Shipments: { inactive: 'package-variant-closed', active: 'package-variant-closed-check' },
  Map: { inactive: 'map-outline', active: 'map' },
  Earnings: { inactive: 'wallet-outline', active: 'wallet' },
  Profile: { inactive: 'account-outline', active: 'account' },
};

// Shipments Stack Navigator
const ShipmentsStackNavigator: React.FC = () => (
  <ShipmentsStack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#F9FAFB' },
      headerShadowVisible: false,
      headerTitleStyle: { fontWeight: '700', color: '#111827' },
    }}
  >
    <ShipmentsStack.Screen
      name="ShipmentsList"
      component={ShipmentsScreen}
      options={{ headerTitle: 'Shipments' }}
    />
    <ShipmentsStack.Screen
      name="ShipmentDetail"
      component={ShipmentDetailScreen}
      options={{ headerTitle: 'Shipment Details' }}
    />
    <ShipmentsStack.Screen
      name="DeliveryCompletion"
      component={DeliveryCompletionScreen}
      options={{
        headerTitle: 'Complete Delivery',
        presentation: 'fullScreenModal',
      }}
    />
    <ShipmentsStack.Screen
      name="IssueReport"
      component={IssueReportScreen}
      options={{
        headerTitle: 'Report Issue',
        presentation: 'modal',
      }}
    />
  </ShipmentsStack.Navigator>
);

// Map Stack Navigator
const MapStackNavigator: React.FC = () => (
  <MapStackNav.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#111827' },
      headerTitleStyle: { fontWeight: '700', color: '#fff' },
      headerTintColor: '#fff',
    }}
  >
    <MapStackNav.Screen
      name="MapView"
      component={MapScreen}
      options={{ headerTitle: 'Route Map', headerShown: false }}
    />
  </MapStackNav.Navigator>
);

// Earnings Stack Navigator
const EarningsStackNavigator: React.FC = () => (
  <EarningsStackNav.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#F9FAFB' },
      headerShadowVisible: false,
      headerTitleStyle: { fontWeight: '700', color: '#111827' },
    }}
  >
    <EarningsStackNav.Screen
      name="EarningsMain"
      component={EarningsScreen}
      options={{ headerTitle: 'My Earnings' }}
    />
  </EarningsStackNav.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => (
  <ProfileStackNav.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: '#F9FAFB' },
      headerShadowVisible: false,
      headerTitleStyle: { fontWeight: '700', color: '#111827' },
    }}
  >
    <ProfileStackNav.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerTitle: 'My Profile' }}
    />
  </ProfileStackNav.Navigator>
);

// Badge component for tab bar
const TabBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// Bottom Tab Navigator
const DriverTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarItemStyle: styles.tabBarItem,
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ focused, color, size }) => {
        const icons = tabIcons[route.name] || tabIcons.Home;
        const iconName = focused ? icons.active : icons.inactive;

        return (
          <View style={styles.iconContainer}>
            <Icon name={iconName} size={22} color={color} />
            {route.name === 'Shipments' && !focused && <TabBadge count={3} />}
          </View>
        );
      },
    })}
    initialRouteName="Home"
  >
    <Tab.Screen
      name="Home"
      component={DriverHomeScreen}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen
      name="Shipments"
      component={ShipmentsStackNavigator}
      options={{ tabBarLabel: 'Shipments' }}
    />
    <Tab.Screen
      name="Map"
      component={MapStackNavigator}
      options={{ tabBarLabel: 'Map' }}
    />
    <Tab.Screen
      name="Earnings"
      component={EarningsStackNavigator}
      options={{ tabBarLabel: 'Earnings' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStackNavigator}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

// Root Stack Navigator (with modal screens)
export const DriverNavigator: React.FC = () => {
  // In production, check auth state here
  const isAuthenticated = true;
  const isDriver = true;

  if (!isAuthenticated) {
    // Would redirect to login screen
    return (
      <View style={styles.authFallback}>
        <Icon name="lock" size={48} color="#D1D5DB" />
        <Text style={styles.authFallbackText}>Please login to continue</Text>
      </View>
    );
  }

  if (!isDriver) {
    return (
      <View style={styles.authFallback}>
        <Icon name="account-cancel" size={48} color="#D1D5DB" />
        <Text style={styles.authFallbackText}>Driver access required</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen name="DriverTabs" component={DriverTabNavigator} />
      <RootStack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="ShipmentDetail"
        component={ShipmentDetailScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          headerTitle: 'Shipment Details',
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerShadowVisible: false,
        }}
      />
      <RootStack.Screen
        name="DeliveryCompletion"
        component={DeliveryCompletionScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="IssueReport"
        component={IssueReportScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Report Issue',
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerShadowVisible: false,
        }}
      />
    </RootStack.Navigator>
  );
};

// Wrapper with NavigationContainer for standalone usage
export const DriverApp: React.FC = () => (
  <NavigationContainer>
    <DriverNavigator />
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 8,
    paddingTop: 6,
    height: 64,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  authFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  authFallbackText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
});
