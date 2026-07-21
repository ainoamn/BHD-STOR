/**
 * useOrderTracking Hook
 * =====================
 * React hooks for order tracking functionality:
 * - useTrackOrder(orderId): Get tracking for an authenticated user's order
 * - useTrackByTrackingNumber(trackingNumber): Public tracking (no auth)
 * - useShipmentTimeline(shipmentId): Get detailed timeline
 * - useRealTimeTracking(trackingNumber): WebSocket-based live tracking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { trackingService } from '../services/tracking.service';

// ─── Types ──────────────────────────────────────────────────

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusLabelAr: string;
  statusLabelEn: string;
  serviceType: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  sender: {
    name: string;
    address: string;
  };
  recipient: {
    name: string;
    address: string;
  };
  timeline: TrackingTimelineEvent[];
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
  driver: {
    name: string;
    phone: string;
    rating: number;
  } | null;
}

export interface TrackingTimelineEvent {
  timestamp: string;
  status: string;
  labelAr: string;
  labelEn: string;
  location: string;
  note: string | null;
}

export interface ShipmentLocation {
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

// ─── Hook: useTrackOrder ────────────────────────────────────

/**
 * Track an order by its order ID (requires authentication)
 * Fetches tracking info for orders belonging to the current user
 */
export function useTrackOrder(orderId: string | null) {
  return useQuery<TrackingInfo, Error>({
    queryKey: ['tracking', 'order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      return trackingService.trackOrder(orderId);
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto refresh every 5 minutes
    retry: 2,
  });
}

// ─── Hook: useTrackByTrackingNumber ─────────────────────────

/**
 * Public tracking by tracking number (no authentication required)
 * Anyone with the tracking number can check shipment status
 */
export function useTrackByTrackingNumber(trackingNumber: string | null) {
  return useQuery<TrackingInfo, Error>({
    queryKey: ['tracking', 'number', trackingNumber],
    queryFn: async () => {
      if (!trackingNumber) throw new Error('Tracking number is required');
      return trackingService.trackByNumber(trackingNumber);
    },
    enabled: !!trackingNumber && trackingNumber.length > 5,
    staleTime: 1000 * 60 * 2,
    refetchInterval: (data) => {
      // Refetch more frequently if not delivered
      if (data?.status === 'delivered' || data?.status === 'cancelled' || data?.status === 'returned') {
        return false; // Stop refetching for terminal states
      }
      return 1000 * 60 * 3; // Every 3 minutes
    },
    retry: 2,
  });
}

// ─── Hook: useShipmentTimeline ──────────────────────────────

/**
 * Get detailed timeline for a shipment
 */
export function useShipmentTimeline(shipmentId: string | null) {
  return useQuery<TrackingTimelineEvent[], Error>({
    queryKey: ['tracking', 'timeline', shipmentId],
    queryFn: async () => {
      if (!shipmentId) throw new Error('Shipment ID is required');
      const response = await fetch(`/api/logistics/shipments/${shipmentId}/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    },
    enabled: !!shipmentId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Hook: useRealTimeTracking ──────────────────────────────

/**
 * Real-time tracking using WebSocket connection
 * Provides live location updates for a shipment
 */
export function useRealTimeTracking(trackingNumber: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveLocation, setLiveLocation] = useState<ShipmentLocation | null>(null);
  const [driverLocation, setDriverLocation] = useState<ShipmentLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!trackingNumber) {
      // Disconnect if no tracking number
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Connect to WebSocket
    const wsUrl = process.env.REACT_APP_WS_URL ?? 'ws://localhost:3001';
    const socket = io(`${wsUrl}/logistics`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      // Subscribe to shipment tracking
      socket.emit('track:shipment', { trackingNumber });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setConnectionError(err.message);
      setIsConnected(false);
    });

    // Listen for tracking initialization
    socket.on('track:init', (data) => {
      // Initial tracking data received
      console.log('[WS] Tracking init:', data);
    });

    // Listen for shipment updates
    socket.on('shipment:update', (event) => {
      // Invalidate tracking query to refresh data
      queryClient.invalidateQueries({
        queryKey: ['tracking', 'number', trackingNumber],
      });
    });

    // Listen for location updates
    socket.on('shipment:location', (data: ShipmentLocation) => {
      setLiveLocation(data);
      setLastUpdate(new Date());
    });

    // Listen for driver location
    socket.on('driver:location', (data: ShipmentLocation) => {
      setDriverLocation(data);
      setLastUpdate(new Date());
    });

    // Delivery completed
    socket.on('delivery:completed', () => {
      queryClient.invalidateQueries({
        queryKey: ['tracking', 'number', trackingNumber],
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [trackingNumber, queryClient]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  return {
    isConnected,
    liveLocation,
    driverLocation,
    lastUpdate,
    connectionError,
    reconnect,
    socket: socketRef.current,
  };
}

// ─── Hook: useDeliveryEstimate ──────────────────────────────

/**
 * Get delivery estimate for a given address and weight
 */
export function useDeliveryEstimate(
  senderZoneId: string | null,
  recipientZoneId: string | null,
  weightKg: number,
  options?: {
    serviceType?: string;
    dimensionsCm?: { length: number; width: number; height: number };
    declaredValue?: number;
    isFragile?: boolean;
    isInsured?: boolean;
  },
) {
  return useQuery({
    queryKey: ['tracking', 'estimate', senderZoneId, recipientZoneId, weightKg, options],
    queryFn: async () => {
      if (!senderZoneId || !recipientZoneId || weightKg <= 0) {
        throw new Error('Invalid parameters');
      }
      return trackingService.getDeliveryEstimate({
        senderZoneId,
        recipientZoneId,
        weightKg,
        ...options,
      });
    },
    enabled: !!senderZoneId && !!recipientZoneId && weightKg > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ─── Hook: useMultipleTracking ──────────────────────────────

/**
 * Track multiple shipments at once (for dashboard/list views)
 */
export function useMultipleTracking(orderIds: string[]) {
  return useQuery({
    queryKey: ['tracking', 'multiple', orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const results = await Promise.allSettled(
        orderIds.map((id) => trackingService.trackOrder(id)),
      );
      return results
        .filter((r): r is PromiseFulfilledResult<TrackingInfo> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    enabled: orderIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
