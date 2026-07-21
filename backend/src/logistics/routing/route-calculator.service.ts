/**
 * BHD Logistics - Route Calculator Service
 * Driving distance/time calculations, turn-by-turn directions,
 * road snapping, and fuel cost estimation.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  haversineDistance,
  haversineDistanceKm,
  calculateBearing,
  bearingToCompass,
  estimateTime,
} from '../utils/geo.utils';
import { encodePolyline } from '../utils/polyline.utils';
import { Coordinate, TurnInstruction, ManeuverType } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Fuel Consumption (L/100km)
// ─────────────────────────────────────────────────────────────────────────────

const FUEL_CONSUMPTION: Record<string, number> = {
  motorcycle: 3.5,
  car: 7.0,
  van: 10.0,
  small_truck: 14.0,
  medium_truck: 20.0,
  large_truck: 35.0,
  default: 12.0,
};

// Average fuel price per liter (configurable)
const FUEL_PRICE_PER_LITER = 1.5;

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RouteCalculatorService {
  private readonly logger = new Logger(RouteCalculatorService.name);

  // ──────────────────────────────────────────────────────────────────────────
  // Driving Distance & Time
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Calculate the driving distance between two points.
   * Uses Haversine formula as a baseline. In production, integrate with
   * Google Maps, Mapbox, or OSRM for actual road network distances.
   *
   * @param originLat - Origin latitude
   * @param originLng - Origin longitude
   * @param destLat - Destination latitude
   * @param destLng - Destination longitude
   * @returns Distance in kilometers
   */
  calculateDrivingDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): number {
    // Haversine gives straight-line (as-the-crow-flies) distance
    const straightLineKm = haversineDistanceKm(
      originLat,
      originLng,
      destLat,
      destLng,
    );

    // Apply a road network factor (roads are ~1.2x longer than straight-line)
    const roadNetworkFactor = 1.2;
    const drivingDistance = straightLineKm * roadNetworkFactor;

    this.logger.debug(
      `Distance: (${originLat.toFixed(4)}, ${originLng.toFixed(4)}) -> ` +
        `(${destLat.toFixed(4)}, ${destLng.toFixed(4)}) = ${drivingDistance.toFixed(2)}km`,
    );

    return drivingDistance;
  }

  /**
   * Calculate driving time between two points.
   *
   * @param originLat - Origin latitude
   * @param originLng - Origin longitude
   * @param destLat - Destination latitude
   * @param destLng - Destination longitude
   * @param avgSpeedKmh - Average speed in km/h (default: 40 urban)
   * @returns Time in minutes
   */
  calculateDrivingTime(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    avgSpeedKmh = 40,
  ): number {
    const distanceKm = this.calculateDrivingDistance(
      originLat,
      originLng,
      destLat,
      destLng,
    );
    return estimateTime(distanceKm, avgSpeedKmh);
  }

  /**
   * Calculate distance and time with a breakdown.
   */
  calculateRouteSegment(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    avgSpeedKmh = 40,
  ): {
    straightLineKm: number;
    drivingDistanceKm: number;
    drivingTimeMinutes: number;
    bearing: number;
    compassDirection: string;
  } {
    const straightLineKm = haversineDistanceKm(
      originLat,
      originLng,
      destLat,
      destLng,
    );
    const drivingDistanceKm = straightLineKm * 1.2;
    const drivingTimeMinutes = estimateTime(drivingDistanceKm, avgSpeedKmh);
    const bearing = calculateBearing(originLat, originLng, destLat, destLng);

    return {
      straightLineKm,
      drivingDistanceKm,
      drivingTimeMinutes,
      bearing,
      compassDirection: bearingToCompass(bearing),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Turn-by-Turn Directions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generate turn-by-turn directions between an origin and destination.
   * In production, integrate with a routing API (Google Maps, Mapbox, OSRM).
   */
  getDirections(
    origin: Coordinate,
    destination: Coordinate,
  ): TurnInstruction[] {
    const instructions: TurnInstruction[] = [];

    // Departure
    instructions.push({
      order: 0,
      instruction: `Head ${bearingToCompass(calculateBearing(origin.lat, origin.lng, destination.lat, destination.lng))} from starting point`,
      distanceMeters: 0,
      durationSeconds: 0,
      maneuver: 'departure',
      startLocation: origin,
      endLocation: origin,
    });

    const totalDistance = haversineDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
    );
    const totalDuration = (totalDistance / 1000 / 40) * 60 * 60; // 40 km/h

    // Mid-point instruction (for longer routes)
    if (totalDistance > 2000) {
      const midLat = (origin.lat + destination.lat) / 2;
      const midLng = (origin.lng + destination.lng) / 2;
      const halfDistance = totalDistance / 2;
      const halfDuration = totalDuration / 2;

      instructions.push({
        order: 1,
        instruction: `Continue straight for ${(halfDistance / 1000).toFixed(1)} km`,
        distanceMeters: Math.round(halfDistance),
        durationSeconds: Math.round(halfDuration),
        maneuver: 'straight',
        startLocation: origin,
        endLocation: { lat: midLat, lng: midLng },
      });

      instructions.push({
        order: 2,
        instruction: 'Continue on the main road toward destination',
        distanceMeters: Math.round(halfDistance),
        durationSeconds: Math.round(halfDuration),
        maneuver: 'straight',
        startLocation: { lat: midLat, lng: midLng },
        endLocation: destination,
      });
    } else {
      instructions.push({
        order: 1,
        instruction: `Drive ${(totalDistance / 1000).toFixed(1)} km toward destination`,
        distanceMeters: Math.round(totalDistance),
        durationSeconds: Math.round(totalDuration),
        maneuver: 'straight',
        startLocation: origin,
        endLocation: destination,
      });
    }

    // Arrival
    instructions.push({
      order: instructions.length,
      instruction: 'You have arrived at your destination',
      distanceMeters: 0,
      durationSeconds: 0,
      maneuver: 'destination_reached',
      startLocation: destination,
      endLocation: destination,
    });

    return instructions;
  }

  /**
   * Generate directions with a waypoint.
   */
  getDirectionsWithWaypoint(
    origin: Coordinate,
    waypoint: Coordinate,
    destination: Coordinate,
  ): TurnInstruction[] {
    const leg1 = this.getDirections(origin, waypoint);
    const leg2 = this.getDirections(waypoint, destination);

    // Combine and renumber
    const combined: TurnInstruction[] = [];

    // Add departure from origin
    combined.push(leg1[0]);

    // Add leg 1 middle instructions
    for (let i = 1; i < leg1.length - 1; i++) {
      combined.push({
        ...leg1[i],
        order: combined.length,
      });
    }

    // Add waypoint instruction
    combined.push({
      order: combined.length,
      instruction: 'Arrive at waypoint',
      distanceMeters: 0,
      durationSeconds: 0,
      maneuver: 'destination_reached',
      startLocation: waypoint,
      endLocation: waypoint,
    });

    // Add leg 2 middle instructions
    for (let i = 1; i < leg2.length - 1; i++) {
      combined.push({
        ...leg2[i],
        order: combined.length,
      });
    }

    // Add final arrival
    combined.push({
      order: combined.length,
      instruction: 'You have arrived at your final destination',
      distanceMeters: 0,
      durationSeconds: 0,
      maneuver: 'destination_reached',
      startLocation: destination,
      endLocation: destination,
    });

    return combined;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Road Snapping
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Snap a GPS coordinate to the nearest point on a road network.
   * In production, use a map matching API (Mapbox Map Matching, OSRM).
   *
   * This implementation snaps to a simple grid-based approximation.
   */
  snapToRoad(lat: number, lng: number): { lat: number; lng: number; confidence: number } {
    // Road network approximation: snap to nearest 0.0001 degree grid
    // (approximately 11 meters at the equator)
    const gridSize = 0.0001;

    const snappedLat = Math.round(lat / gridSize) * gridSize;
    const snappedLng = Math.round(lng / gridSize) * gridSize;

    const offset = haversineDistance(lat, lng, snappedLat, snappedLng);
    const confidence = Math.max(0, 1 - offset / 50); // Confidence drops beyond 50m

    return {
      lat: snappedLat,
      lng: snappedLng,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Snap a series of GPS points to the road network (map matching).
   */
  snapPointsToRoad(
    points: Coordinate[],
  ): Array<{ lat: number; lng: number; confidence: number }> {
    return points.map((p) => this.snapToRoad(p.lat, p.lng));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Fuel Cost Estimation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Estimate fuel cost for a given distance and vehicle type.
   *
   * @param distanceKm - Distance in kilometers
   * @param vehicleType - Type of vehicle (motorcycle, car, van, truck, etc.)
   * @returns Estimated fuel cost in currency units
   */
  calculateFuelCost(distanceKm: number, vehicleType = 'default'): number {
    const consumption = FUEL_CONSUMPTION[vehicleType] || FUEL_CONSUMPTION.default;
    const litersNeeded = (distanceKm * consumption) / 100;
    const cost = litersNeeded * FUEL_PRICE_PER_LITER;

    this.logger.debug(
      `Fuel cost: ${distanceKm.toFixed(1)}km with ${vehicleType} = ${cost.toFixed(2)} ` +
        `(${litersNeeded.toFixed(2)}L @ ${FUEL_PRICE_PER_LITER}/L)`,
    );

    return Math.round(cost * 100) / 100;
  }

  /**
   * Calculate fuel cost for a multi-stop route.
   */
  calculateRouteFuelCost(
    stops: Array<{ latitude: number; longitude: number }>,
    vehicleType = 'default',
  ): number {
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += this.calculateDrivingDistance(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude,
      );
    }
    return this.calculateFuelCost(totalDistance, vehicleType);
  }

  /**
   * Get fuel consumption for a vehicle type.
   */
  getFuelConsumption(vehicleType: string): number {
    return FUEL_CONSUMPTION[vehicleType] || FUEL_CONSUMPTION.default;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Batch Calculations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Calculate a distance matrix between multiple origins and destinations.
   */
  calculateDistanceMatrix(
    origins: Coordinate[],
    destinations: Coordinate[],
  ): number[][] {
    const matrix: number[][] = [];

    for (const origin of origins) {
      const row: number[] = [];
      for (const dest of destinations) {
        row.push(
          this.calculateDrivingDistance(origin.lat, origin.lng, dest.lat, dest.lng),
        );
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Find the nearest point from a set of candidates to a reference point.
   */
  findNearestPoint(
    reference: Coordinate,
    candidates: Coordinate[],
  ): { point: Coordinate; index: number; distanceKm: number } {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const dist = haversineDistanceKm(
        reference.lat,
        reference.lng,
        candidates[i].lat,
        candidates[i].lng,
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    return {
      point: candidates[nearestIndex],
      index: nearestIndex,
      distanceKm: nearestDist,
    };
  }

  /**
   * Generate a polyline for a route segment.
   */
  generateSegmentPolyline(
    from: Coordinate,
    to: Coordinate,
    numPoints = 20,
  ): string {
    const points: Coordinate[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      points.push({
        lat: from.lat + t * (to.lat - from.lat),
        lng: from.lng + t * (to.lng - from.lng),
      });
    }
    return encodePolyline(points);
  }
}
