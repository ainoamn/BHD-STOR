"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────

export interface DriverLocation {
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  accuracy?: number;
}

export interface VehicleLocation {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  speed: number;
  status: "moving" | "idle" | "stopped";
  lastUpdate: string;
}

export interface TrackingMessage {
  id: string;
  sender: "driver" | "dispatcher";
  text: string;
  timestamp: string;
  read: boolean;
}

// ─── Mock WebSocket Implementation ───────────────────────────────────

class MockWebSocket {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private connected = false;

  connect() {
    this.connected = true;
    console.log("[WebSocket] Connected to live tracking server");
  }

  disconnect() {
    this.connected = false;
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.listeners.clear();
    console.log("[WebSocket] Disconnected");
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  subscribe(channel: string, callback: (data: any) => void) {
    this.on(channel, callback);

    if (channel === "driver-location") {
      // Simulate location updates every 5 seconds
      const interval = setInterval(() => {
        const mockUpdate: DriverLocation = {
          driverId: "d1",
          driverName: "Khalid Bin Said",
          lat: 23.588 + (Math.random() - 0.5) * 0.01,
          lng: 58.3829 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(30 + Math.random() * 40),
          heading: Math.floor(Math.random() * 360),
          timestamp: new Date().toISOString(),
          accuracy: Math.floor(5 + Math.random() * 15),
        };
        this.emit(channel, mockUpdate);
      }, 5000);
      this.intervals.set(channel, interval);
    }

    if (channel === "all-vehicles") {
      const interval = setInterval(() => {
        const mockVehicles: VehicleLocation[] = [
          {
            vehicleId: "v1",
            vehicleName: "Toyota Hilux",
            plateNumber: "OM-1234",
            driverId: "d1",
            driverName: "Khalid Bin Said",
            lat: 23.6105 + (Math.random() - 0.5) * 0.005,
            lng: 58.445 + (Math.random() - 0.5) * 0.005,
            speed: Math.floor(35 + Math.random() * 25),
            status: "moving",
            lastUpdate: new Date().toISOString(),
          },
          {
            vehicleId: "v2",
            vehicleName: "Nissan Urvan",
            plateNumber: "OM-5678",
            driverId: "d2",
            driverName: "Said Al-Habsi",
            lat: 23.655 + (Math.random() - 0.5) * 0.005,
            lng: 58.29 + (Math.random() - 0.5) * 0.005,
            speed: Math.floor(25 + Math.random() * 20),
            status: "moving",
            lastUpdate: new Date().toISOString(),
          },
          {
            vehicleId: "v3",
            vehicleName: "Honda Activa",
            plateNumber: "OM-9012",
            driverId: "d3",
            driverName: "Hamdan Al-Azri",
            lat: 23.62 + (Math.random() - 0.5) * 0.005,
            lng: 58.44 + (Math.random() - 0.5) * 0.005,
            speed: Math.floor(40 + Math.random() * 20),
            status: "moving",
            lastUpdate: new Date().toISOString(),
          },
        ];
        this.emit(channel, mockVehicles);
      }, 8000);
      this.intervals.set(channel, interval);
    }

    if (channel === "chat") {
      this.on(channel, callback);
    }
  }

  unsubscribe(channel: string) {
    const interval = this.intervals.get(channel);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(channel);
    }
  }

  send(channel: string, data: any) {
    if (!this.connected) return;
    if (channel === "chat") {
      // Echo back as driver response after delay
      setTimeout(() => {
        this.emit(channel, {
          ...data,
          sender: "driver",
          id: `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
        });
      }, 1500);
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Singleton WebSocket instance
let wsInstance: MockWebSocket | null = null;

function getWebSocket(): MockWebSocket {
  if (!wsInstance) {
    wsInstance = new MockWebSocket();
    wsInstance.connect();
  }
  return wsInstance;
}

// ─── Hooks ───────────────────────────────────────────────────────────

/**
 * Hook for tracking a single driver's real-time location.
 * Uses a simulated WebSocket connection that updates every 5 seconds.
 */
export function useDriverLocation(driverId: string) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<MockWebSocket | null>(null);

  useEffect(() => {
    if (!driverId) return;

    const ws = getWebSocket();
    wsRef.current = ws;
    setIsConnected(true);

    const handleLocation = (data: DriverLocation) => {
      if (data.driverId === driverId) {
        setLocation(data);
      }
    };

    ws.subscribe("driver-location", handleLocation);

    return () => {
      ws.unsubscribe("driver-location");
      setIsConnected(false);
    };
  }, [driverId]);

  return { location, isConnected };
}

/**
 * Hook for tracking all active vehicle locations.
 * Uses a simulated WebSocket connection that updates every 8 seconds.
 */
export function useVehicleLocations() {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = getWebSocket();
    setIsConnected(true);

    const handleVehicles = (data: VehicleLocation[]) => {
      setVehicles(data);
    };

    ws.subscribe("all-vehicles", handleVehicles);

    return () => {
      ws.unsubscribe("all-vehicles");
      setIsConnected(false);
    };
  }, []);

  return { vehicles, isConnected };
}

/**
 * Hook for real-time chat with a driver.
 * Uses a simulated WebSocket for bidirectional messaging.
 */
export function useDriverChat(driverId: string) {
  const [messages, setMessages] = useState<TrackingMessage[]>([
    {
      id: "msg-1",
      sender: "dispatcher",
      text: "How is the route going?",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
    {
      id: "msg-2",
      sender: "driver",
      text: "Going well. Just delivered to Qurum. On my way to Madinat Al Sultan Qaboos.",
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      read: true,
    },
  ]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const ws = getWebSocket();
    setIsConnected(true);

    const handleMessage = (data: TrackingMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    ws.on("chat", handleMessage);

    return () => {
      ws.off("chat", handleMessage);
      setIsConnected(false);
    };
  }, [driverId]);

  const sendMessage = useCallback(
    (text: string) => {
      const ws = getWebSocket();
      const newMessage: TrackingMessage = {
        id: `msg-${Date.now()}`,
        sender: "dispatcher",
        text,
        timestamp: new Date().toISOString(),
        read: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      ws.send("chat", { ...newMessage, driverId });
    },
    [driverId]
  );

  return { messages, sendMessage, isConnected };
}

/**
 * Hook to get the latest location snapshot for a driver (non-realtime).
 * Uses React Query for caching.
 */
export function useDriverLocationSnapshot(driverId: string) {
  return useQuery({
    queryKey: ["driver-location-snapshot", driverId],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return {
        driverId,
        driverName: "Khalid Bin Said",
        lat: 23.6105,
        lng: 58.445,
        speed: 42,
        heading: 120,
        timestamp: new Date().toISOString(),
      } as DriverLocation;
    },
    enabled: !!driverId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
