export interface RouteStop {
  shipmentId: string;
  sequence: number;
  lat: number;
  lng: number;
  address?: string;
  estimatedArrival?: Date;
  actualArrival?: Date;
  status?: string;
}

export interface RoutePlan {
  driverId: string;
  vehicleId?: string;
  zoneId?: string;
  stops: RouteStop[];
  totalDistanceKm?: number;
  estimatedDurationMin?: number;
}
