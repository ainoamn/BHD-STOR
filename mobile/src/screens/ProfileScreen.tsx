import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { useAuth } from '@hooks/useAuth';
import { useCartStore } from '@store/cartStore';

interface ProfileScreenProps {
  locale?: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

interface MenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  screen?: string;
  color?: string;
  badge?: number;
  action?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  locale = 'en',
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);

  const { user, isAuthenticated, isAdmin, isSeller, logout } = useAuth();
  const cartCount = useCartStore((s) => s.totalCount());

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  const mainMenuItems: MenuItem[] = [
    {
      icon: 'package-variant',
      label: 'My Orders',
      subtitle: 'View order history',
      screen: 'Orders',
      color: colors.primary,
    },
    {
      icon: 'map-marker-outline',
      label: 'My Addresses',
      subtitle: 'Manage shipping addresses',
      screen: 'Addresses',
      color: colors.info,
    },
    {
      icon: 'heart-outline',
      label: 'My Wishlist',
      subtitle: 'Saved items',
      screen: 'Wishlist',
      color: colors.accent,
    },
    {
      icon: 'cart-outline',
      label: 'My Cart',
      subtitle: `${cartCount()} items`,
      screen: 'Cart',
      color: colors.success,
      badge: cartCount(),
    },
  ];

  const sellerMenuItems: MenuItem[] = isSeller
    ? [
        {
          icon: 'store',
          label: 'Store Dashboard',
          subtitle: 'Manage your store',
          screen: 'StoreDashboard',
          color: colors.secondary,
        },
      ]
    : [
        {
          icon: 'store-plus',
          label: 'Become a Seller',
          subtitle: 'Open your own store',
          screen: 'BecomeSeller',
          color: colors.secondary,
        },
      ];

  const adminMenuItems: MenuItem[] = isAdmin
    ? [
        {
          icon: 'shield-account',
          label: 'Admin Dashboard',
          subtitle: 'Manage the marketplace',
          screen: 'AdminDashboard',
          color: colors.error,
        },
      ]
    : [];

  const settingsMenuItems: MenuItem[] = [
    {
      icon: 'bell-outline',
      label: 'Notifications',
      subtitle: 'Manage notifications',
      screen: 'Notifications',
      color: colors.warning,
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'FAQs and contact',
      screen: 'Help',
      color: colors.info,
    },
  ];

  const renderMenuSection = (
    title: string,
    items: MenuItem[]
  ) => (
    <View style={styles.menuSection}>
      <Text style={[styles.menuSectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.menuItem,
            index === items.length - 1 && styles.menuItemLast,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
          onPress={() => {
            if (item.action) {
              item.action();
            } else if (item.screen) {
              navigation.navigate(item.screen);
            }
          }}
        >
          <View
            style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}
          >
            <Icon name={item.icon} size={22} color={item.color} />
          </View>
          <View style={styles.menuContent}>
            <Text
              style={[styles.menuLabel, { textAlign: rtl ? 'right' : 'left' }]}
            >
              {item.label}
            </Text>
            {item.subtitle && (
              <Text
                style={[
                  styles.menuSubtitle,
                  { textAlign: rtl ? 'right' : 'left' },
                ]}
              >
                {item.subtitle}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.badge ? (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{item.badge}</Text>
              </View>
            ) : null}
            <Icon
              name="chevron-right"
              size={20}
              color={colors.textMuted}
              style={{ transform: [{ scaleX: rtl ? -1 : 1 }] }}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Icon name="account-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to BHD Oman</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to access your profile, orders, and more
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={[styles.userRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[styles.userName, { textAlign: rtl ? 'right' : 'left' }]}
            >
              {user?.fullName || 'User'}
            </Text>
            <Text
              style={[styles.userEmail, { textAlign: rtl ? 'right' : 'left' }]}
            >
              {user?.email}
            </Text>
            {user?.phone && (
              <Text
                style={[
                  styles.userPhone,
                  { textAlign: rtl ? 'right' : 'left' },
                ]}
              >
                {user.phone}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Icon name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Coupons</Text>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      {renderMenuSection('Account', mainMenuItems)}
      {renderMenuSection('Seller', sellerMenuItems)}
      {adminMenuItems.length > 0 && renderMenuSection('Admin', adminMenuItems)}
      {renderMenuSection('Preferences', settingsMenuItems)}

      {/* Dark Mode Toggle */}
      <View style={styles.menuSection}>
        <View
          style={[
            styles.menuItem,
            styles.menuItemLast,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: `${colors.info}15` }]}>
            <Icon
              name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color={colors.info}
            />
          </View>
          <View style={styles.menuContent}>
            <Text
              style={[styles.menuLabel, { textAlign: rtl ? 'right' : 'left' }]}
            >
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={onToggleDarkMode}
            trackColor={{ false: colors.border, true: `${colors.primary}50` }}
            thumbColor={isDarkMode ? colors.primary : colors.textMuted}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.versionText}>BHD Oman v1.0.0</Text>

      {/* Bottom Spacer */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // User Card
  userCard: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.borderLight,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Menu Sections
  menuSection: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  menuBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  menuBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  // Guest View
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
