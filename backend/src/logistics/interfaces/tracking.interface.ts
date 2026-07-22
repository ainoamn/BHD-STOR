import { ShipmentStatus, ServiceType } from '../enums/logistics.enum';

export interface TrackingEventInfo {
  timestamp: Date;
  status: ShipmentStatus;
  labelAr?: string;
  labelEn?: string;
  location?: string;
  note?: string | null;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: ShipmentStatus;
  serviceType?: ServiceType;
  estimatedDelivery?: Date | null;
  actualDelivery?: Date | null;
  currentLocation?: { lat: number; lng: number } | null;
  timeline?: TrackingEventInfo[];
}
