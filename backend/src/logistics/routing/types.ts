/**
 * BHD Logistics - Routing Types
 * Core type definitions for route optimization, GPS tracking, and geofencing
 */

// ─────────────────────────────────────────────────────────────────────────────
// Coordinates & Points
// ─────────────────────────────────────────────────────────────────────────────

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop & Route Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Stop {
  id: string;
  order: number;
  address?: string;
  latitude: number;
  longitude: number;
  type: 'pickup' | 'delivery' | 'depot' | 'waypoint';
  shipmentId?: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
  serviceTimeMinutes?: number;
  weightKg?: number;
  volumeM3?: number;
  priority?: number; // 1-10, higher = more priority
  notes?: string;
}

export interface Route {
  id: string;
  stops: Stop[];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  startDepot?: GeoPoint;
  endDepot?: GeoPoint;
  polyline?: string;
  turnInstructions?: TurnInstruction[];
  fuelCostEstimate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizedRoute {
  originalRoute: Route;
  optimizedStops: Stop[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  distanceSavedKm: number;
  distanceSavedPercent: number;
  originalTimeMinutes: number;
  optimizedTimeMinutes: number;
  timeSavedMinutes: number;
  optimizationAlgorithm: string;
  iterations: number;
  improvements: number;
  polyline: string;
  turnInstructions: TurnInstruction[];
  legs: RouteLeg[];
}

export interface RouteLeg {
  fromStop: Stop;
  toStop: Stop;
  distanceKm: number;
  estimatedMinutes: number;
  polyline?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

export interface TurnInstruction {
  order: number;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: ManeuverType;
  startLocation: Coordinate;
  endLocation: Coordinate;
  streetName?: string;
}

export type ManeuverType =
  | 'straight'
  | 'turn_left'
  | 'turn_right'
  | 'uturn'
  | 'merge'
  | 'fork_left'
  | 'fork_right'
  | 'roundabout_enter'
  | 'roundabout_exit'
  | 'destination_reached'
  | 'departure';

// ─────────────────────────────────────────────────────────────────────────────
// Geofence Types
// ─────────────────────────────────────────────────────────────────────────────

export type GeofenceType = 'circle' | 'polygon' | 'corridor';
export type GeofenceEvent = 'enter' | 'exit' | 'dwell';

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  polygon?: Coordinate[]; // For polygon geofences
  center?: Coordinate; // For circle geofences
  radiusMeters?: number; // For circle geofences
  corridorWidthMeters?: number; // For corridor geofences
  corridorPoints?: Coordinate[]; // For corridor geofences
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface GeofenceAlert {
  id: string;
  geofenceId: string;
  driverId: string;
  event: GeofenceEvent;
  latitude: number;
  longitude: number;
  timestamp: Date;
  isAcknowledged: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Location & Tracking
// ─────────────────────────────────────────────────────────────────────────────

export interface LocationData {
  driverId: string;
  vehicleId: string;
  shipmentId?: string;
  latitude: number;
  longitude: number;
  speed?: number; // km/h
  heading?: number; // degrees, 0-360
  accuracy?: number; // meters
  altitude?: number; // meters
  timestamp: Date;
}

export interface DriverStatus {
  driverId: string;
  vehicleId: string;
  isOnline: boolean;
  isOnTrip: boolean;
  currentShipmentId?: string;
  lastLocation?: LocationData;
  lastUpdated: Date;
  currentRoute?: OptimizedRoute;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipment & Driver Assignment
// ─────────────────────────────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  orderId?: string;
  pickupStop: Stop;
  deliveryStop: Stop;
  weightKg: number;
  volumeM3: number;
  priority: number;
  status: ShipmentStatus;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ShipmentStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleId?: string;
  vehicleCapacityKg?: number;
  vehicleVolumeM3?: number;
  maxStopsPerRoute?: number;
  currentZone?: string;
  isActive: boolean;
  currentLoadKg?: number;
  assignedShipments?: string[];
}

export interface DriverAssignment {
  driverId: string;
  shipments: Shipment[];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  stops: Stop[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Subscription
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleSubscription {
  clientId: string;
  vehicleIds: Set<string>;
  subscribeAll: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderLogisticsLink {
  orderId: string;
  shipmentId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  syncedAt: Date;
}
