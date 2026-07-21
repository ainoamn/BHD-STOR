import { AppState, type AppStateStatus } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import type { Location } from '../types/driver.types';

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

let locationWatchId: number | null = null;
let locationInterval: ReturnType<typeof setInterval> | null = null;
let lastLocation: Location | null = null;
let appStateSubscription: { remove: () => void } | null = null;

const LOCATION_SEND_INTERVAL = 30000; // 30 seconds

const locationListeners = new Set<(location: Location) => void>();

function notifyListeners(location: Location) {
  locationListeners.forEach(listener => listener(location));
}

async function sendLocationToServer(location: Location): Promise<void> {
  try {
    const response = await fetch('https://api.bhdlogistics.com/v1/driver/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        speed: location.speed,
        timestamp: location.timestamp || Date.now(),
      }),
    });
    if (!response.ok) {
      console.warn('Failed to send location update');
    }
  } catch (error) {
    console.warn('Location update error:', error);
  }
}

async function getAuthToken(): Promise<string> {
  // In production, this would come from secure storage
  return 'mock-auth-token';
}

export const trackingService = {
  async requestPermission(): Promise<boolean> {
    return new Promise(resolve => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  },

  startLocationTracking(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (locationWatchId !== null) {
        this.stopLocationTracking();
      }

      // Get initial position
      Geolocation.getCurrentPosition(
        position => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
            timestamp: position.timestamp,
          };
          lastLocation = location;
          notifyListeners(location);
          resolve(location);

          // Start watching position
          locationWatchId = Geolocation.watchPosition(
            newPosition => {
              const newLocation: Location = {
                lat: newPosition.coords.latitude,
                lng: newPosition.coords.longitude,
                heading: newPosition.coords.heading || 0,
                speed: newPosition.coords.speed || 0,
                timestamp: newPosition.timestamp,
              };
              lastLocation = newLocation;
              notifyListeners(newLocation);
            },
            error => {
              console.warn('Location watch error:', error);
            },
            {
              enableHighAccuracy: true,
              distanceFilter: 10, // Update every 10 meters
              interval: 5000,
              fastestInterval: 2000,
            },
          );

          // Send location to server periodically
          locationInterval = setInterval(() => {
            if (lastLocation) {
              sendLocationToServer(lastLocation);
            }
          }, LOCATION_SEND_INTERVAL);

          // Handle app state changes
          appStateSubscription = {
            remove: () => {},
          };
          const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
              this.resumeTracking();
            } else if (nextAppState === 'background') {
              this.pauseTracking();
            }
          });
          appStateSubscription = subscription;
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  },

  stopLocationTracking(): void {
    if (locationWatchId !== null) {
      Geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }
    if (locationInterval !== null) {
      clearInterval(locationInterval);
      locationInterval = null;
    }
    if (appStateSubscription !== null) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    lastLocation = null;
  },

  pauseTracking(): void {
    if (locationWatchId !== null) {
      Geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }
  },

  resumeTracking(): void {
    if (locationInterval === null) return;

    locationWatchId = Geolocation.watchPosition(
      newPosition => {
        const newLocation: Location = {
          lat: newPosition.coords.latitude,
          lng: newPosition.coords.longitude,
          heading: newPosition.coords.heading || 0,
          speed: newPosition.coords.speed || 0,
          timestamp: newPosition.timestamp,
        };
        lastLocation = newLocation;
        notifyListeners(newLocation);
      },
      error => {
        console.warn('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
      },
    );
  },

  getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
            timestamp: position.timestamp,
          });
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      );
    });
  },

  sendLocationUpdate(lat: number, lng: number): Promise<void> {
    return sendLocationToServer({ lat, lng, timestamp: Date.now() });
  },

  getLastLocation(): Location | null {
    return lastLocation;
  },

  subscribeToLocation(listener: (location: Location) => void): () => void {
    locationListeners.add(listener);
    return () => {
      locationListeners.delete(listener);
    };
  },

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  },
};
