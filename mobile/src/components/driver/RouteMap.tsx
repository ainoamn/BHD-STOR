import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Route, RouteStop, Location } from '../../types/driver.types';

interface RouteMapProps {
  route: Route;
  currentLocation?: Location | null;
  activeStopIndex?: number;
  onStopPress?: (stop: RouteStop) => void;
  mapStyle?: 'standard' | 'satellite' | 'hybrid';
  showTraffic?: boolean;
  fitToRoute?: boolean;
}

const BAHRAIN_REGION = {
  latitude: 26.2,
  longitude: 50.58,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export const RouteMap: React.FC<RouteMapProps> = ({
  route,
  currentLocation,
  activeStopIndex = 0,
  onStopPress,
  mapStyle = 'standard',
  showTraffic = false,
  fitToRoute = true,
}) => {
  const mapRef = React.useRef<MapView>(null);

  // Build route coordinates
  const routeCoordinates = useMemo(() => {
    const coords = route.stops.map(stop => ({
      latitude: stop.lat,
      longitude: stop.lng,
    }));
    // Add current location as first point if available
    if (currentLocation) {
      coords.unshift({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      });
    }
    return coords;
  }, [route.stops, currentLocation]);

  // Calculate map region to fit all stops
  const initialRegion = useMemo(() => {
    if (routeCoordinates.length === 0) return BAHRAIN_REGION;

    let minLat = routeCoordinates[0].latitude;
    let maxLat = routeCoordinates[0].latitude;
    let minLng = routeCoordinates[0].longitude;
    let maxLng = routeCoordinates[0].longitude;

    routeCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const padding = 0.02;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + padding * 2, 0.05),
      longitudeDelta: Math.max(maxLng - minLng + padding * 2, 0.05),
    };
  }, [routeCoordinates]);

  // Fit map to show all stops
  useEffect(() => {
    if (fitToRoute && mapRef.current && routeCoordinates.length > 1) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoordinates, {
          edgePadding: { top: 60, right: 40, bottom: 200, left: 40 },
          animated: true,
        });
      }, 500);
    }
  }, [fitToRoute, routeCoordinates]);

  const getStopColor = (index: number, status: RouteStop['status']) => {
    if (status === 'completed') return '#10B981';
    if (status === 'failed') return '#EF4444';
    if (index === activeStopIndex) return '#3B82F6';
    return '#F59E0B';
  };

  const mapType = mapStyle === 'satellite' ? 'satellite' : mapStyle === 'hybrid' ? 'hybrid' : 'standard';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
        showsTraffic={showTraffic}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton
        showsCompass
        showsScale
        loadingEnabled
        loadingIndicatorColor="#3B82F6"
      >
        {/* Route Polyline */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#3B82F6"
          strokeWidth={4}
          lineDashPattern={[0]}
        />

        {/* Completed portion of route */}
        {activeStopIndex > 0 && (
          <Polyline
            coordinates={routeCoordinates.slice(0, activeStopIndex + 1)}
            strokeColor="#10B981"
            strokeWidth={4}
          />
        )}

        {/* Stop Markers */}
        {route.stops.map((stop, index) => {
          const color = getStopColor(index, stop.status);
          const isActive = index === activeStopIndex;

          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              onPress={() => onStopPress?.(stop)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.markerContainer, isActive && styles.markerActive]}>
                <View style={[styles.markerCircle, { backgroundColor: color }]}>
                  <Text style={styles.markerNumber}>{stop.sequence}</Text>
                </View>
                {isActive && <View style={[styles.markerPulse, { borderColor: color }]} />}
              </View>
            </Marker>
          );
        })}

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationContainer}>
              <View style={styles.currentLocationDot} />
              <View style={styles.currentLocationRing} />
            </View>
          </Marker>
        )}

        {/* Accuracy Circle */}
        {currentLocation && (
          <Circle
            center={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            radius={50}
            fillColor="rgba(59, 130, 246, 0.1)"
            strokeColor="rgba(59, 130, 246, 0.3)"
            strokeWidth={1}
          />
        )}
      </MapView>

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Done</Text>
        </View>
      </View>
    </View>
  );
};

// Simple map component for when no route is available
export const SimpleMap: React.FC<{
  location?: Location | null;
  destination?: { lat: number; lng: number };
}> = ({ location, destination }) => {
  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current && location && destination) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.lat, longitude: location.lng },
          { latitude: destination.lat, longitude: destination.lng },
        ],
        {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        },
      );
    }
  }, [location, destination]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={BAHRAIN_REGION}
      showsUserLocation={!!location}
      showsMyLocationButton
    >
      {destination && (
        <>
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          >
            <View style={styles.destinationMarker}>
              <Icon name="map-marker" size={36} color="#EF4444" />
            </View>
          </Marker>
          {location && (
            <Polyline
              coordinates={[
                { latitude: location.lat, longitude: location.lng },
                { latitude: destination.lat, longitude: destination.lng },
              ]}
              strokeColor="#3B82F6"
              strokeWidth={3}
            />
          )}
        </>
      )}
    </MapView>
  );
};

import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerActive: {
    zIndex: 100,
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  markerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    opacity: 0.4,
  },
  currentLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 2,
  },
  currentLocationRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    zIndex: 1,
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
});
