import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShipmentCard } from '../../components/driver/ShipmentCard';
import { useFilteredShipments } from '../../hooks/useDriverShipments';
import { useDriverStore } from '../../store/driverStore';
import type { Shipment, ShipmentStatus } from '../../types/driver.types';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList>;

type FilterTab = 'pending' | 'in_progress' | 'completed';

export const ShipmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('pending');
  const setActiveShipment = useDriverStore(state => state.setActiveShipment);
  const { shipments, isLoading, refetch, counts } = useFilteredShipments(activeFilter);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleShipmentPress = useCallback(
    (shipment: Shipment) => {
      navigation.navigate('ShipmentDetail', { id: shipment.id });
    },
    [navigation],
  );

  const handleComplete = useCallback(
    (shipment: Shipment) => {
      setActiveShipment(shipment);
      navigation.navigate('DeliveryCompletion', { shipmentId: shipment.id });
    },
    [navigation, setActiveShipment],
  );

  const handleNavigate = useCallback((shipment: Shipment) => {
    const { lat, lng } = shipment.delivery;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  }, []);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="package-variant-closed" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Shipments</Text>
      <Text style={styles.emptySubtitle}>
        You don't have any {activeFilter.replace('_', ' ')} shipments right now.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Shipments</Text>
        <Text style={styles.headerSubtitle}>{counts.all} total assigned</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        {filterTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.segmentButton,
              activeFilter === tab.key && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text
              style={[
                styles.segmentLabel,
                activeFilter === tab.key && styles.segmentLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.segmentBadge,
                activeFilter === tab.key && styles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentBadgeText,
                  activeFilter === tab.key && styles.segmentBadgeTextActive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Shipments List */}
      <FlatList
        data={shipments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={handleShipmentPress}
            onComplete={handleComplete}
            onNavigate={handleNavigate}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#3B82F6',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentLabelActive: {
    color: '#fff',
  },
  segmentBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segmentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  segmentBadgeTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
