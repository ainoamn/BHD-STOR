import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@theme/colors';
import { isRTL } from '@utils/rtl';
import { ordersService, Order } from '@services/orders.service';
import { useQuery } from '@tanstack/react-query';
import LoadingSkeleton from '@components/LoadingSkeleton';
import EmptyState from '@components/EmptyState';

interface OrdersScreenProps {
  locale?: string;
}

type OrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

const tabs: { key: OrderTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const statusColors: Record<string, string> = {
  pending: colors.pending,
  processing: colors.processing,
  shipped: colors.shipped,
  delivered: colors.delivered,
  cancelled: colors.error,
  refunded: colors.textMuted,
};

const statusIcons: Record<string, string> = {
  pending: 'clock-outline',
  processing: 'cog-outline',
  shipped: 'truck-delivery',
  delivered: 'check-circle-outline',
  cancelled: 'close-circle-outline',
  refunded: 'cash-refund',
};

const OrdersScreen: React.FC<OrdersScreenProps> = ({ locale = 'en' }) => {
  const navigation = useNavigation();
  const rtl = isRTL(locale);

  const [activeTab, setActiveTab] = useState<OrderTab>('all');

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () =>
      ordersService.getOrders({
        status: activeTab === 'all' ? undefined : activeTab,
        page: 1,
        limit: 20,
      }),
    select: (res) => res.data,
  });

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  const handleTrackShipment = (orderId: string) => {
    navigation.navigate('TrackShipment', { orderId });
  };

  const handleCancelOrder = async (orderId: string) => {
    // Show confirmation dialog
    try {
      await ordersService.cancelOrder(orderId, 'Cancelled by user');
      refetch();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      await ordersService.reorder(orderId);
      navigation.navigate('Cart');
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item.id)}
      activeOpacity={0.9}
    >
      {/* Order Header */}
      <View style={[styles.orderHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColors[item.status]}15` },
          ]}
        >
          <Icon
            name={statusIcons[item.status] || 'help-circle-outline'}
            size={12}
            color={statusColors[item.status]}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusColors[item.status] },
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Order Items Summary */}
      <View style={styles.itemsPreview}>
        <Text style={styles.itemsText}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.itemsNames} numberOfLines={1}>
          {item.items.map((i) => i.name).join(', ')}
        </Text>
      </View>

      {/* Order Footer */}
      <View style={[styles.orderFooter, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={styles.orderTotal}>OMR {item.total.toFixed(3)}</Text>
        <View style={[styles.actions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          {item.status === 'shipped' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.trackButton]}
              onPress={() => handleTrackShipment(item.id)}
            >
              <Icon name="map-marker" size={14} color={colors.primary} />
              <Text style={styles.actionButtonText}>Track</Text>
            </TouchableOpacity>
          )}
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelOrder(item.id)}
            >
              <Icon name="close" size={14} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          {item.status === 'delivered' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reorderButton]}
              onPress={() => handleReorder(item.id)}
            >
              <Icon name="reload" size={14} color={colors.success} />
              <Text style={[styles.actionButtonText, { color: colors.success }]}>
                Reorder
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <LoadingSkeleton type="order" count={3} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      {(!orders || orders.length === 0) ? (
        <EmptyState
          icon="package-variant"
          title="No orders yet"
          message="Your orders will appear here once you make a purchase"
          actionLabel="Start Shopping"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsPreview: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  itemsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemsNames: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  trackButton: {
    backgroundColor: `${colors.primary}10`,
  },
  cancelButton: {
    backgroundColor: `${colors.error}10`,
  },
  reorderButton: {
    backgroundColor: `${colors.success}10`,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default OrdersScreen;
