export type ShipmentStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type ServiceType = 'standard' | 'express' | 'same_day';

export type IssueType =
  | 'delivery_failed'
  | 'accident'
  | 'vehicle_problem'
  | 'customer_not_available'
  | 'wrong_address'
  | 'package_damaged';

export type EarningType = 'delivery_fee' | 'bonus' | 'tip' | 'adjustment';

export type EarningPeriod = 'today' | 'week' | 'month';

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  serviceType: ServiceType;
  pickup: AddressInfo;
  delivery: AddressInfo;
  package: PackageInfo;
  codAmount?: number;
  codCollected?: boolean;
  notes?: string;
  otp?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AddressInfo {
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
}

export interface PackageInfo {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  value: number;
  pieces: number;
}

export interface Route {
  id: string;
  name: string;
  stops: RouteStop[];
  totalDistance: number;
  estimatedTime: number;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'active' | 'completed';
}

export interface RouteStop {
  id: string;
  shipmentId: string;
  sequence: number;
  lat: number;
  lng: number;
  address: string;
  status: 'pending' | 'completed' | 'failed';
  estimatedArrival?: string;
}

export interface Earning {
  id: string;
  date: string;
  shipmentId: string;
  trackingNumber: string;
  amount: number;
  type: EarningType;
  status: 'pending' | 'paid';
}

export interface DriverProfile {
  id: string;
  name: string;
  photo: string;
  rating: number;
  employeeId: string;
  phone: string;
  email: string;
  totalDeliveries: number;
  successRate: number;
  distanceTraveled: number;
  vehicle?: VehicleInfo;
  workSchedule?: WorkSchedule;
  documents: DriverDocument[];
}

export interface VehicleInfo {
  type: string;
  model: string;
  plateNumber: string;
  color: string;
}

export interface WorkSchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface DriverDocument {
  type: string;
  number: string;
  expiryDate: string;
  verified: boolean;
}

export interface IssueReport {
  shipmentId: string;
  issueType: IssueType;
  description: string;
  photos?: string[];
}

export interface DeliveryCompletionData {
  otp: string;
  signature: string;
  photo: string;
}

export interface Location {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}
