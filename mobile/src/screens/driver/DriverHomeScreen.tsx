import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnlineToggle } from '../../components/driver/OnlineToggle';
import { useTodayShipments } from '../../hooks/useDriverShipments';
import { useDriverStore } from '../../store/driverStore';
import { driverService } from '../../services/driver.service';
import { useCurrentLocation } from '../../hooks/useLocationTracking';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList>;

export const DriverHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isOnline = useDriverStore(state => state.isOnline);
  const currentRoute = useDriverStore(state => state.currentRoute);
  const setCurrentRoute = useDriverStore(state => state.setCurrentRoute);
  const { shipments, isLoading, refetch } = useTodayShipments();
  const { location } = useCurrentLocation();

  // Fetch route on mount
  useEffect(() => {
    driverService.getCurrentRoute().then(route => {
      if (route) setCurrentRoute(route);
    });
  }, [setCurrentRoute]);

  // Calculate stats
  const assignedCount = shipments.filter(s => ['pending', 'assigned'].includes(s.status)).length;
  const inProgressCount = shipments.filter(s =>
    ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status),
  ).length;
  const completedCount = shipments.filter(s =>
    ['delivered'].includes(s.status),
  ).length;

  const todayEarnings = completedCount * 3.5 + 10; // Mock calculation

  const handleRefresh = async () => {
    await refetch();
  };

  const handleStartRoute = () => {
    if (shipments.length === 0) {
      Alert.alert('No Shipments', 'You have no shipments assigned for today.');
      return;
    }
    navigation.navigate('Map', { screen: 'MapView' });
  };

  const handleScanQR = () => {
    navigation.navigate('Scan');
  };

  const handleViewShipments = () => {
    navigation.navigate('Shipments', { screen: 'ShipmentsList' });
  };

  const nextPendingShipment = shipments.find(s =>
    ['assigned', 'picked_up', 'in_transit'].includes(s.status),
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.driverName}>Ali Hassan</Text>
        </View>
        <OnlineToggle size="medium" showLabel />
      </View>

      {/* Today's Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.assignedCard]}>
          <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="package-variant" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.summaryNumber}>{assignedCount}</Text>
          <Text style={styles.summaryLabel}>Assigned</Text>
        </View>

        <View style={[styles.summaryCard, styles.progressCard]}>
          <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
            <Icon name="truck-delivery" size={22} color="#8B5CF6" />
          </View>
          <Text style={styles.summaryNumber}>{inProgressCount}</Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>

        <View style={[styles.summaryCard, styles.completedCard]}>
          <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="check-circle" size={22} color="#10B981" />
          </View>
          <Text style={styles.summaryNumber}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>

        <View style={[styles.summaryCard, styles.earningsCard]}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="cash-multiple" size={22} color="#F59E0B" />
          </View>
          <Text style={styles.summaryNumber}>BHD {todayEarnings.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Earnings</Text>
        </View>
      </View>

      {/* Current Route Card */}
      {currentRoute && isOnline && (
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View style={styles.routeTitleRow}>
              <Icon name="routes" size={22} color="#3B82F6" />
              <Text style={styles.routeTitle}>Active Route</Text>
            </View>
            <View style={styles.routeBadge}>
              <Text style={styles.routeBadgeText}>
                {currentRoute.stops.filter(s => s.status === 'completed').length}/{currentRoute.stops.length} stops
              </Text>
            </View>
          </View>

          <View style={styles.routeDetails}>
            <View style={styles.routeDetail}>
              <Icon name="map-marker-distance" size={16} color="#6B7280" />
              <Text style={styles.routeDetailText}>{currentRoute.totalDistance} km</Text>
            </View>
            <View style={styles.routeDetail}>
              <Icon name="clock-outline" size={16} color="#6B7280" />
              <Text style={styles.routeDetailText}>~{currentRoute.estimatedTime} min</Text>
            </View>
          </View>

          {/* Next Stop Preview */}
          {nextPendingShipment && (
            <View style={styles.nextStop}>
              <Text style={styles.nextStopLabel}>Next Stop</Text>
              <View style={styles.nextStopContent}>
                <View style={styles.nextStopDot}>
                  <Text style={styles.nextStopNumber}>1</Text>
                </View>
                <View style={styles.nextStopInfo}>
                  <Text style={styles.nextStopName}>{nextPendingShipment.delivery.name}</Text>
                  <Text style={styles.nextStopAddress} numberOfLines={1}>
                    {nextPendingShipment.delivery.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.nextStopNav}
                  onPress={() => {
                    const { lat, lng } = nextPendingShipment.delivery;
                    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                  }}
                >
                  <Icon name="navigation-variant" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.continueRouteButton} onPress={handleStartRoute}>
            <Icon name="play" size={18} color="#fff" />
            <Text style={styles.continueRouteText}>Continue Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleViewShipments}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="package-variant-closed" size={26} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>View{'\n'}Shipments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleStartRoute}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="map-marker-path" size={26} color="#10B981" />
            </View>
            <Text style={styles.actionLabel}>Start{'\n'}Route</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleScanQR}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="qrcode-scan" size={26} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>Scan{'\n'}QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Earnings', { screen: 'EarningsMain' })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
              <Icon name="wallet" size={26} color="#8B5CF6" />
            </View>
            <Text style={styles.actionLabel}>My{'\n'}Earnings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Shipments Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Shipments</Text>
          <TouchableOpacity onPress={handleViewShipments}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {shipments.slice(0, 3).map(shipment => (
          <TouchableOpacity
            key={shipment.id}
            style={styles.recentItem}
            onPress={() =>
              navigation.navigate('Shipments', {
                screen: 'ShipmentDetail',
                params: { id: shipment.id },
              })
            }
          >
            <View style={styles.recentLeft}>
              <View
                style={[
                  styles.recentIcon,
                  {
                    backgroundColor:
                      shipment.status === 'delivered' ? '#D1FAE5' : '#DBEAFE',
                  },
                ]}
              >
                <Icon
                  name={shipment.status === 'delivered' ? 'check' : 'package-variant'}
                  size={16}
                  color={shipment.status === 'delivered' ? '#10B981' : '#3B82F6'}
                />
              </View>
              <View>
                <Text style={styles.recentTracking}>{shipment.trackingNumber}</Text>
                <Text style={styles.recentAddress} numberOfLines={1}>
                  {shipment.delivery.name} - {shipment.delivery.address}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  driverName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  assignedCard: {
    borderTopWidth: 3,
    borderTopColor: '#3B82F6',
  },
  progressCard: {
    borderTopWidth: 3,
    borderTopColor: '#8B5CF6',
  },
  completedCard: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  earningsCard: {
    borderTopWidth: 3,
    borderTopColor: '#F59E0B',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  routeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeDetailText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  nextStop: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  nextStopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextStopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextStopDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStopNumber: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  nextStopInfo: {
    flex: 1,
  },
  nextStopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  nextStopAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  nextStopNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  continueRouteText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTracking: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  recentAddress: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 240,
  },
});
