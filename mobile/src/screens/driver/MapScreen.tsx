import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDriverStore } from '../../store/driverStore';
import { driverService } from '../../services/driver.service';
import { RouteMap } from '../../components/driver/RouteMap';
import type { Route, RouteStop } from '../../types/driver.types';

export const MapScreen: React.FC = () => {
  const currentRoute = useDriverStore(state => state.currentRoute);
  const setCurrentRoute = useDriverStore(state => state.setCurrentRoute);
  const location = useDriverStore(state => state.location);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [route, setRoute] = useState<Route | null>(currentRoute);
  const [isLoading, setIsLoading] = useState(!currentRoute);

  useEffect(() => {
    if (!currentRoute) {
      driverService.getCurrentRoute().then(r => {
        setRoute(r);
        setCurrentRoute(r);
        setIsLoading(false);
      });
    } else {
      setRoute(currentRoute);
      setIsLoading(false);
    }
  }, [currentRoute, setCurrentRoute]);

  useEffect(() => {
    if (route) {
      const firstPending = route.stops.findIndex(s => s.status === 'pending');
      if (firstPending >= 0) {
        setActiveStopIndex(firstPending);
      }
    }
  }, [route]);

  const handleStopPress = useCallback((stop: RouteStop) => {
    const index = route?.stops.findIndex(s => s.id === stop.id) ?? 0;
    setActiveStopIndex(index);
  }, [route]);

  const handleNavigateToStop = useCallback(() => {
    const activeStop = route?.stops[activeStopIndex];
    if (activeStop) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}`,
      );
    }
  }, [route, activeStopIndex]);

  const handleCallStop = useCallback(() => {
    Linking.openURL('tel:+97334442222');
  }, []);

  const activeStop = route?.stops[activeStopIndex];
  const completedStops = route?.stops.filter(s => s.status === 'completed').length ?? 0;
  const totalStops = route?.stops.length ?? 0;
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.centered}>
        <Icon name="map-marker-off" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Active Route</Text>
        <Text style={styles.emptySubtitle}>
          You don't have an active route assigned yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <RouteMap
          route={route}
          currentLocation={location}
          activeStopIndex={activeStopIndex}
          onStopPress={handleStopPress}
          fitToRoute
        />
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <View style={styles.routeInfo}>
            <Icon name="routes" size={20} color="#fff" />
            <Text style={styles.topBarTitle}>{route.name}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {completedStops}/{totalStops} stops
            </Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Stop selector dots */}
      <View style={styles.stopDotsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stopDotsContent}
        >
          {route.stops.map((stop, index) => (
            <TouchableOpacity
              key={stop.id}
              style={[
                styles.stopDot,
                index === activeStopIndex && styles.stopDotActive,
                stop.status === 'completed' && styles.stopDotCompleted,
                stop.status === 'failed' && styles.stopDotFailed,
              ]}
              onPress={() => handleStopPress(stop)}
            >
              <Text
                style={[
                  styles.stopDotText,
                  index === activeStopIndex && styles.stopDotTextActive,
                  stop.status === 'completed' && styles.stopDotTextCompleted,
                ]}
              >
                {stop.sequence}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom sheet */}
      {activeStop && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />

          <View style={styles.stopHeader}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{activeStop.sequence}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopTitle}>
                Stop {activeStop.sequence} of {totalStops}
              </Text>
              <Text style={styles.stopAddress} numberOfLines={2}>
                {activeStop.address}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                activeStop.status === 'completed'
                  ? styles.statusCompleted
                  : activeStop.status === 'failed'
                    ? styles.statusFailed
                    : styles.statusPending,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {activeStop.status === 'completed'
                  ? 'Done'
                  : activeStop.status === 'failed'
                    ? 'Failed'
                    : 'Pending'}
              </Text>
            </View>
          </View>

          {activeStop.estimatedArrival && (
            <View style={styles.etaRow}>
              <Icon name="clock-outline" size={16} color="#6B7280" />
              <Text style={styles.etaText}>Est. arrival: {activeStop.estimatedArrival}</Text>
            </View>
          )}

          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCallStop}>
              <Icon name="phone" size={20} color="#10B981" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.navBtn]}
              onPress={handleNavigateToStop}
            >
              <Icon name="navigation-variant" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, styles.navBtnText]}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17,24,39,0.85)',
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  stopDotsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
  },
  stopDotsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  stopDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  stopDotActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    transform: [{ scale: 1.1 }],
  },
  stopDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stopDotFailed: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  stopDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  stopDotTextActive: {
    color: '#fff',
  },
  stopDotTextCompleted: {
    color: '#fff',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNumberText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  stopAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingLeft: 52,
  },
  etaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  navBtn: {
    flex: 2,
    backgroundColor: '#3B82F6',
  },
  navBtnText: {
    color: '#fff',
  },
});
