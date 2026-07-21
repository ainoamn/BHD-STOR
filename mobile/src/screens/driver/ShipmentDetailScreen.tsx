import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SimpleMap } from '../../components/driver/RouteMap';
import { useShipmentDetail, useUpdateShipmentStatus } from '../../hooks/useDriverShipments';
import { useCurrentLocation } from '../../hooks/useLocationTracking';
import { useDriverStore } from '../../store/driverStore';
import type { DriverStackParamList } from '../../navigation/DriverNavigator';

type NavigationProp = NativeStackNavigationProp<DriverStackParamList>;
type DetailRouteProp = RouteProp<DriverStackParamList, 'ShipmentDetail'>;

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending: { color: '#F59E0B', bg: '#FEF3C7', icon: 'clock-outline', label: 'Pending' },
  assigned: { color: '#3B82F6', bg: '#DBEAFE', icon: 'package-variant', label: 'Assigned' },
  picked_up: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'truck-delivery', label: 'Picked Up' },
  in_transit: { color: '#06B6D4', bg: '#CFFAFE', icon: 'truck-fast', label: 'In Transit' },
  out_for_delivery: { color: '#10B981', bg: '#D1FAE5', icon: 'map-marker-radius', label: 'Out for Delivery' },
  delivered: { color: '#10B981', bg: '#D1FAE5', icon: 'check-circle', label: 'Delivered' },
  failed: { color: '#EF4444', bg: '#FEE2E2', icon: 'alert-circle', label: 'Failed' },
};

const serviceConfig: Record<string, { color: string; bg: string; label: string }> = {
  standard: { color: '#6B7280', bg: '#F3F4F6', label: 'Standard' },
  express: { color: '#F59E0B', bg: '#FEF3C7', label: 'Express' },
  same_day: { color: '#10B981', bg: '#D1FAE5', label: 'Same Day' },
};

export const ShipmentDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { id } = route.params;
  const { location } = useCurrentLocation();
  const setActiveShipment = useDriverStore(state => state.setActiveShipment);

  const { data: shipment, isLoading, isError } = useShipmentDetail(id);
  const { updateStatus, isUpdating } = useUpdateShipmentStatus();
  const [showCodConfirm, setShowCodConfirm] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading shipment details...</Text>
      </View>
    );
  }

  if (isError || !shipment) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load shipment details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusConfig[shipment.status] || statusConfig.pending;
  const service = serviceConfig[shipment.serviceType] || serviceConfig.standard;

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Cannot make phone call'));
  };

  const handleNavigate = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const handleMarkPickedUp = () => {
    Alert.alert('Confirm Pickup', 'Have you picked up this shipment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          updateStatus({ id: shipment.id, status: 'picked_up' });
        },
      },
    ]);
  };

  const handleCompleteDelivery = () => {
    if (shipment.codAmount && !showCodConfirm) {
      setShowCodConfirm(true);
      return;
    }
    setActiveShipment(shipment);
    navigation.navigate('DeliveryCompletion', { shipmentId: shipment.id });
  };

  const handleReportIssue = () => {
    navigation.navigate('IssueReport', { shipmentId: shipment.id });
  };

  const canPickup = ['pending', 'assigned'].includes(shipment.status);
  const canDeliver = ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status);
  const isCompleted = ['delivered', 'failed', 'cancelled'].includes(shipment.status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
        <Icon name={status.icon} size={28} color={status.color} />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
        </View>
        <View style={[styles.serviceBadge, { backgroundColor: service.bg }]}>
          <Text style={[styles.serviceText, { color: service.color }]}>{service.label}</Text>
        </View>
      </View>

      {/* Map Preview */}
      <View style={styles.mapContainer}>
        <SimpleMap
          location={location}
          destination={{ lat: shipment.delivery.lat, lng: shipment.delivery.lng }}
        />
      </View>

      {/* Pickup Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="store-marker" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.sectionTitle}>Pickup Information</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoValue}>{shipment.pickup.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <TouchableOpacity onPress={() => handleCall(shipment.pickup.phone)}>
              <Text style={[styles.infoValue, styles.linkText]}>{shipment.pickup.phone}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{shipment.pickup.address}</Text>
          </View>
          {shipment.pickup.notes && (
            <View style={[styles.infoRow, styles.notesRow]}>
              <Icon name="information" size={16} color="#F59E0B" />
              <Text style={styles.notesText}>{shipment.pickup.notes}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Delivery Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="map-marker" size={18} color="#10B981" />
          </View>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To</Text>
            <Text style={styles.infoValue}>{shipment.delivery.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <TouchableOpacity onPress={() => handleCall(shipment.delivery.phone)}>
              <Text style={[styles.infoValue, styles.linkText]}>{shipment.delivery.phone}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{shipment.delivery.address}</Text>
          </View>
          {shipment.delivery.notes && (
            <View style={[styles.infoRow, styles.notesRow]}>
              <Icon name="information" size={16} color="#F59E0B" />
              <Text style={styles.notesText}>{shipment.delivery.notes}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Package Details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#EDE9FE' }]}>
            <Icon name="package" size={18} color="#8B5CF6" />
          </View>
          <Text style={styles.sectionTitle}>Package Details</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.packageGrid}>
            <View style={styles.packageItem}>
              <Icon name="weight" size={20} color="#6B7280" />
              <Text style={styles.packageValue}>{shipment.package.weight} kg</Text>
              <Text style={styles.packageLabel}>Weight</Text>
            </View>
            <View style={styles.packageItem}>
              <Icon name="ruler-square" size={20} color="#6B7280" />
              <Text style={styles.packageValue}>
                {shipment.package.dimensions.length}×{shipment.package.dimensions.width}×
                {shipment.package.dimensions.height}
              </Text>
              <Text style={styles.packageLabel}>Dimensions (cm)</Text>
            </View>
            <View style={styles.packageItem}>
              <Icon name="layers" size={20} color="#6B7280" />
              <Text style={styles.packageValue}>{shipment.package.pieces}</Text>
              <Text style={styles.packageLabel}>Pieces</Text>
            </View>
            <View style={styles.packageItem}>
              <Icon name="tag" size={20} color="#6B7280" />
              <Text style={styles.packageValue}>BHD {shipment.package.value}</Text>
              <Text style={styles.packageLabel}>Value</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{shipment.package.description}</Text>
          </View>
        </View>
      </View>

      {/* COD Section */}
      {shipment.codAmount ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="cash" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.sectionTitle}>Cash on Delivery</Text>
          </View>
          <View style={[styles.infoCard, styles.codCard]}>
            <View style={styles.codRow}>
              <Text style={styles.codLabel}>Amount to Collect</Text>
              <Text style={styles.codAmount}>BHD {shipment.codAmount.toFixed(2)}</Text>
            </View>
            {shipment.codCollected && (
              <View style={styles.codCollected}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.codCollectedText}>COD Collected</Text>
              </View>
            )}
            {showCodConfirm && !shipment.codCollected && (
              <View style={styles.codConfirm}>
                <Icon name="alert" size={20} color="#F59E0B" />
                <Text style={styles.codConfirmText}>
                  Make sure to collect BHD {shipment.codAmount.toFixed(2)} before completing delivery
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* Sender Notes */}
      {shipment.notes && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="note-text" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.sectionTitle}>Notes from Sender</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.notesText}>{shipment.notes}</Text>
          </View>
        </View>
      )}

      {/* OTP Info */}
      {shipment.otp && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="lock" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>Delivery OTP</Text>
          </View>
          <View style={[styles.infoCard, styles.otpCard]}>
            <Text style={styles.otpCode}>{shipment.otp}</Text>
            <Text style={styles.otpLabel}>Share this OTP with the receiver</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => handleNavigate(shipment.delivery.lat, shipment.delivery.lng)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="navigation-variant" size={22} color="#3B82F6" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Navigate</Text>
            <Text style={styles.actionSubtitle}>Open maps for directions</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => handleCall(shipment.delivery.phone)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="phone" size={22} color="#10B981" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Call Receiver</Text>
            <Text style={styles.actionSubtitle}>{shipment.delivery.phone}</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {canPickup && (
          <TouchableOpacity
            style={[styles.mainButton, styles.pickupButton]}
            onPress={handleMarkPickedUp}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="truck-delivery" size={20} color="#fff" />
                <Text style={styles.mainButtonText}>Mark as Picked Up</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canDeliver && (
          <TouchableOpacity
            style={[styles.mainButton, styles.deliverButton]}
            onPress={handleCompleteDelivery}
          >
            <Icon name="check-circle" size={20} color="#fff" />
            <Text style={styles.mainButtonText}>Complete Delivery</Text>
          </TouchableOpacity>
        )}

        {!isCompleted && (
          <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
            <Icon name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  trackingNumber: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  serviceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoLabel: {
    width: 90,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  linkText: {
    color: '#3B82F6',
  },
  notesRow: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  packageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  packageItem: {
    alignItems: 'center',
    gap: 4,
  },
  packageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  packageLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  codCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  codRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  codAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F59E0B',
  },
  codCollected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  codCollectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  codConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  codConfirmText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  otpCard: {
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  otpCode: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 8,
  },
  otpLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 6,
  },
  pickupButton: {
    backgroundColor: '#8B5CF6',
  },
  deliverButton: {
    backgroundColor: '#10B981',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomPadding: {
    height: 30,
  },
});
