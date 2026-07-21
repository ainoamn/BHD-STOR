import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingService } from '../services/tracking.service';
import { useDriverStore } from '../store/driverStore';
import type { Location } from '../types/driver.types';

export function useLocationTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const locationSubscription = useRef<(() => void) | null>(null);
  const storeSetTracking = useDriverStore(state => state.setTrackingLocation);
  const storeUpdateLocation = useDriverStore(state => state.updateLocation);

  const startTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hasPermission = await trackingService.requestPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await trackingService.startLocationTracking();
      setIsTracking(true);
      storeSetTracking(true);
      storeUpdateLocation(location);

      // Subscribe to location updates
      const unsubscribe = trackingService.subscribeToLocation((loc: Location) => {
        storeUpdateLocation(loc);
      });
      locationSubscription.current = unsubscribe;

      return location;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start tracking'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [storeSetTracking, storeUpdateLocation]);

  const stopTracking = useCallback(() => {
    trackingService.stopLocationTracking();
    if (locationSubscription.current) {
      locationSubscription.current();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    storeSetTracking(false);
  }, [storeSetTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current();
      }
    };
  }, []);

  return {
    isTracking,
    isLoading,
    error,
    startTracking,
    stopTracking,
  };
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await trackingService.getCurrentLocation();
      setLocation(loc);
      return loc;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get location'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to continuous updates
  useEffect(() => {
    const unsubscribe = trackingService.subscribeToLocation((loc: Location) => {
      setLocation(loc);
    });
    return unsubscribe;
  }, []);

  return {
    location,
    isLoading,
    error,
    getLocation,
  };
}

export function useDistanceTo(destinationLat: number, destinationLng: number) {
  const location = useDriverStore(state => state.location);

  const distance = useCallback(() => {
    if (!location) return null;
    return trackingService.calculateDistance(
      location.lat,
      location.lng,
      destinationLat,
      destinationLng,
    );
  }, [location, destinationLat, destinationLng]);

  const estimatedTime = useCallback(() => {
    const dist = distance();
    if (dist === null) return null;
    // Assume average speed of 30 km/h in city
    const timeHours = dist / 30;
    return Math.round(timeHours * 60); // minutes
  }, [distance]);

  const formattedDistance = useCallback(() => {
    const dist = distance();
    if (dist === null) return '---';
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1)} km`;
  }, [distance]);

  return {
    distance,
    estimatedTime,
    formattedDistance,
    location,
  };
}

export function useWatchLocation(callback: (location: Location) => void) {
  useEffect(() => {
    const unsubscribe = trackingService.subscribeToLocation(callback);
    return unsubscribe;
  }, [callback]);
}
