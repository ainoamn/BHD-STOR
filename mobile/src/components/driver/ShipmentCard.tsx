import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Shipment } from '../../types/driver.types';

interface ShipmentCardProps {
  shipment: Shipment;
  onPress?: (shipment: Shipment) => void;
  onComplete?: (shipment: Shipment) => void;
  onNavigate?: (shipment: Shipment) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending: { color: '#F59E0B', bg: '#FEF3C7', icon: 'clock-outline', label: 'Pending' },
  assigned: { color: '#3B82F6', bg: '#DBEAFE', icon: 'package-variant', label: 'Assigned' },
  picked_up: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'truck-delivery', label: 'Picked Up' },
  in_transit: { color: '#06B6D4', bg: '#CFFAFE', icon: 'truck-fast', label: 'In Transit' },
  out_for_delivery: { color: '#10B981', bg: '#D1FAE5', icon: 'map-marker-radius', label: 'Out for Delivery' },
  delivered: { color: '#10B981', bg: '#D1FAE5', icon: 'check-circle', label: 'Delivered' },
  failed: { color: '#EF4444', bg: '#FEE2E2', icon: 'alert-circle', label: 'Failed' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', icon: 'close-circle', label: 'Cancelled' },
};

const serviceConfig: Record<string, { color: string; bg: string; label: string }> = {
  standard: { color: '#6B7280', bg: '#F3F4F6', label: 'Standard' },
  express: { color: '#F59E0B', bg: '#FEF3C7', label: 'Express' },
  same_day: { color: '#10B981', bg: '#D1FAE5', label: 'Same Day' },
};

export const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  onPress,
  onComplete,
  onNavigate,
  compact = false,
}) => {
  const status = statusConfig[shipment.status] || statusConfig.pending;
  const service = serviceConfig[shipment.serviceType] || serviceConfig.standard;

  const handleCall = useCallback(() => {
    const phone = shipment.delivery.phone;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Cannot make phone call');
    });
  }, [shipment.delivery.phone]);

  const handleNavigate = useCallback(() => {
    const { lat, lng } = shipment.delivery;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Cannot open maps');
    });
    onNavigate?.(shipment);
  }, [shipment, onNavigate]);

  const renderRightActions = useCallback(() => {
    if (['delivered', 'failed', 'cancelled'].includes(shipment.status)) return null;
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeButton, styles.navigateSwipe]}
          onPress={handleNavigate}
        >
          <Icon name="navigation-variant" size={24} color="#fff" />
          <Text style={styles.swipeText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.swipeButton, styles.callSwipe]} onPress={handleCall}>
          <Icon name="phone" size={24} color="#fff" />
          <Text style={styles.swipeText}>Call</Text>
        </TouchableOpacity>
        {onComplete && (
          <TouchableOpacity
            style={[styles.swipeButton, styles.completeSwipe]}
            onPress={() => onComplete(shipment)}
          >
            <Icon name="check" size={24} color="#fff" />
            <Text style={styles.swipeText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [shipment, handleNavigate, handleCall, onComplete]);

  const truncateAddress = (addr: string) => {
    if (compact && addr.length > 40) return addr.substring(0, 40) + '...';
    if (addr.length > 60) return addr.substring(0, 60) + '...';
    return addr;
  };

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2}>
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact]}
        onPress={() => onPress?.(shipment)}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.trackingRow}>
            <Icon name="barcode" size={16} color="#6B7280" />
            <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Service Type & COD */}
        <View style={styles.tagsRow}>
          <View style={[styles.serviceBadge, { backgroundColor: service.bg }]}>
            <Text style={[styles.serviceText, { color: service.color }]}>{service.label}</Text>
          </View>
          {shipment.codAmount ? (
            <View style={styles.codBadge}>
              <Icon name="cash" size={12} color="#10B981" />
              <Text style={styles.codText}>COD BHD {shipment.codAmount.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        {/* Receiver Info */}
        <View style={styles.receiverSection}>
          <Icon name="account-circle" size={20} color="#374151" />
          <View style={styles.receiverInfo}>
            <Text style={styles.receiverName}>{shipment.delivery.name}</Text>
            <Text style={styles.receiverPhone}>{shipment.delivery.phone}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressSection}>
          <Icon name="map-marker" size={16} color="#6B7280" />
          <Text style={styles.addressText}>{truncateAddress(shipment.delivery.address)}</Text>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Icon name="phone" size={18} color="#3B82F6" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleNavigate}>
            <Icon name="navigation-variant" size={18} color="#10B981" />
            <Text style={styles.actionText}>Navigate</Text>
          </TouchableOpacity>
          {onComplete && ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => onComplete(shipment)}
            >
              <Icon name="check-circle" size={18} color="#fff" />
              <Text style={[styles.actionText, styles.completeText]}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompact: {
    padding: 10,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  codText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  receiverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  receiverInfo: {
    flex: 1,
  },
  receiverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  receiverPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    gap: 6,
    flex: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  completeText: {
    color: '#fff',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  swipeButton: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  navigateSwipe: {
    backgroundColor: '#3B82F6',
  },
  callSwipe: {
    backgroundColor: '#10B981',
  },
  completeSwipe: {
    backgroundColor: '#059669',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
