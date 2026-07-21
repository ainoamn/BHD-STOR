/**
 * BHD Logistics - GPS Tracking Service
 * Core service for GPS tracking: location updates, proximity checks,
 * ETA calculations, geofencing, and trip management.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LocationEntity } from './location.entity';
import { RedisLocationStore } from './redis-location.store';
import { LocationData, Geofence } from '../routing/types';
import {
  haversineDistance,
  estimateTime,
  calculateETA,
  isPointInPolygon,
  isPointInCircle,
  formatCoordinates,
} from '../utils/geo.utils';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GpsTrackingService {
  private readonly logger = new Logger(GpsTrackingService.name);

  // In-memory geofence registry (use database in production)
  private geofences: Map<string, Geofence> = new Map();

  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationRepo: Repository<LocationEntity>,
    private readonly redisStore: RedisLocationStore,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Location Updates
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Update the location of a driver. Saves to both Redis (real-time)
   * and persistent database (history).
   */
  async updateLocation(
    driverId: string,
    vehicleId: string,
    lat: number,
    lng: number,
    speed?: number,
    heading?: number,
    accuracy?: number,
    altitude?: number,
    shipmentId?: string,
  ): Promise<LocationData> {
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
    }

    const location: LocationData = {
      driverId,
      vehicleId,
      latitude: lat,
      longitude: lng,
      speed,
      heading,
      accuracy,
      altitude,
      shipmentId,
      timestamp: new Date(),
    };

    // Save to Redis for real-time access
    await this.redisStore.saveLocation(driverId, location);
    await this.redisStore.saveLocationHistory(driverId, location);

    // Persist to database for historical analysis
    const entity = this.locationRepo.create({
      driverId,
      vehicleId,
      shipmentId: shipmentId || null,
      latitude: lat,
      longitude: lng,
      speed: speed ?? null,
      heading: heading ?? null,
      accuracy: accuracy ?? null,
      altitude: altitude ?? null,
      timestamp: new Date(),
    });

    await this.locationRepo.save(entity);

    this.logger.debug(
      `Location updated: driver=${driverId}, vehicle=${vehicleId}, ` +
        `lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}`,
    );

    return location;
  }

  /**
   * Get the current (latest) location of a driver from Redis.
   */
  async getCurrentLocation(driverId: string): Promise<LocationData | null> {
    const location = await this.redisStore.getLocation(driverId);

    if (!location) {
      // Fallback: check database for the most recent entry
      const latest = await this.locationRepo.findOne({
        where: { driverId },
        order: { timestamp: 'DESC' },
      });

      if (latest) {
        return {
          driverId: latest.driverId,
          vehicleId: latest.vehicleId,
          latitude: parseFloat(latest.latitude.toString()),
          longitude: parseFloat(latest.longitude.toString()),
          speed: latest.speed ? parseFloat(latest.speed.toString()) : undefined,
          heading: latest.heading
            ? parseFloat(latest.heading.toString())
            : undefined,
          accuracy: latest.accuracy
            ? parseFloat(latest.accuracy.toString())
            : undefined,
          altitude: latest.altitude
            ? parseFloat(latest.altitude.toString())
            : undefined,
          timestamp: latest.timestamp,
        };
      }

      throw new NotFoundException(
        `No location found for driver ${driverId}`,
      );
    }

    return location;
  }

  /**
   * Get location history for a driver within a time range from the database.
   */
  async getLocationHistory(
    driverId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<LocationData[]> {
    const entities = await this.locationRepo.find({
      where: {
        driverId,
        timestamp: Between(startTime, endTime),
      },
      order: {
        timestamp: 'ASC',
      },
    });

    return entities.map((e) => ({
      driverId: e.driverId,
      vehicleId: e.vehicleId,
      latitude: parseFloat(e.latitude.toString()),
      longitude: parseFloat(e.longitude.toString()),
      speed: e.speed ? parseFloat(e.speed.toString()) : undefined,
      heading: e.heading ? parseFloat(e.heading.toString()) : undefined,
      accuracy: e.accuracy ? parseFloat(e.accuracy.toString()) : undefined,
      altitude: e.altitude ? parseFloat(e.altitude.toString()) : undefined,
      timestamp: e.timestamp,
    }));
  }

  /**
   * Get all active drivers' current locations.
   */
  async getAllActiveLocations(): Promise<LocationData[]> {
    return this.redisStore.getAllActiveLocations();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Distance & Proximity
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Calculate the great-circle distance between two coordinates using
   * the Haversine formula.
   *
   * @returns Distance in meters
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    return haversineDistance(lat1, lng1, lat2, lng2);
  }

  /**
   * Check if a driver is near a destination within a threshold.
   *
   * @param driverId - The driver to check
   * @param destLat - Destination latitude
   * @param destLng - Destination longitude
   * @param thresholdMeters - Proximity threshold (default: 100m)
   * @returns True if driver is within threshold distance
   */
  async isDriverNearDestination(
    driverId: string,
    destLat: number,
    destLng: number,
    thresholdMeters = 100,
  ): Promise<boolean> {
    const location = await this.getCurrentLocation(driverId);
    if (!location) return false;

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      destLat,
      destLng,
    );

    this.logger.debug(
      `Driver ${driverId} is ${distance.toFixed(0)}m from destination ` +
        `(${destLat}, ${destLng}), threshold=${thresholdMeters}m`,
    );

    return distance <= thresholdMeters;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ETA Calculations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Calculate estimated time of arrival.
   *
   * @param currentLat - Current latitude
   * @param currentLng - Current longitude
   * @param destLat - Destination latitude
   * @param destLng - Destination longitude
   * @param speed - Current speed in km/h (uses default if not provided)
   * @returns Estimated time in minutes
   */
  calculateETA(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    speed?: number,
  ): number {
    const distanceKm =
      this.calculateDistance(currentLat, currentLng, destLat, destLng) / 1000;
    const avgSpeed = speed && speed > 0 ? speed : 40; // Default 40 km/h
    return estimateTime(distanceKm, avgSpeed);
  }

  /**
   * Get ETA as a human-readable string with arrival time.
   */
  async getETAWithArrivalTime(
    driverId: string,
    destLat: number,
    destLng: number,
  ): Promise<{ etaMinutes: number; estimatedArrival: Date }> {
    const location = await this.getCurrentLocation(driverId);
    if (!location) {
      throw new NotFoundException(`No location for driver ${driverId}`);
    }

    const etaMinutes = this.calculateETA(
      location.latitude,
      location.longitude,
      destLat,
      destLng,
      location.speed,
    );

    const estimatedArrival = calculateETA(
      this.calculateDistance(
        location.latitude,
        location.longitude,
        destLat,
        destLng,
      ) / 1000,
      location.speed,
    );

    return { etaMinutes, estimatedArrival };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Geofence
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check if a driver is inside any registered geofence zone.
   */
  async geofenceCheck(
    driverId: string,
    zone?: Geofence,
  ): Promise<Array<{ geofenceId: string; isInside: boolean; geofenceName: string }>> {
    const location = await this.getCurrentLocation(driverId);
    if (!location) {
      throw new NotFoundException(`No location for driver ${driverId}`);
    }

    const point = { lat: location.latitude, lng: location.longitude };
    const results: Array<{ geofenceId: string; isInside: boolean; geofenceName: string }> = [];

    if (zone) {
      // Check specific zone
      const isInside = this.isPointInGeofence(point, zone);
      results.push({
        geofenceId: zone.id,
        isInside,
        geofenceName: zone.name,
      });
    } else {
      // Check all registered geofences
      for (const [, geofence] of this.geofences) {
        const isInside = this.isPointInGeofence(point, geofence);
        results.push({
          geofenceId: geofence.id,
          isInside,
          geofenceName: geofence.name,
        });
      }
    }

    return results;
  }

  /**
   * Check if a point is inside a geofence.
   */
  private isPointInGeofence(
    point: { lat: number; lng: number },
    geofence: Geofence,
  ): boolean {
    switch (geofence.type) {
      case 'circle':
        if (!geofence.center || !geofence.radiusMeters) return false;
        return isPointInCircle(point, geofence.center, geofence.radiusMeters);

      case 'polygon':
        if (!geofence.polygon || geofence.polygon.length < 3) return false;
        return isPointInPolygon(point, geofence.polygon);

      case 'corridor':
        // Corridor: check if point is within corridorWidthMeters of any segment
        if (!geofence.corridorPoints || !geofence.corridorWidthMeters)
          return false;
        return this.isPointInCorridor(
          point,
          geofence.corridorPoints,
          geofence.corridorWidthMeters,
        );

      default:
        return false;
    }
  }

  /**
   * Check if a point is within a corridor (polyline buffer).
   */
  private isPointInCorridor(
    point: { lat: number; lng: number },
    corridorPoints: { lat: number; lng: number }[],
    widthMeters: number,
  ): boolean {
    if (corridorPoints.length < 2) return false;

    for (let i = 0; i < corridorPoints.length - 1; i++) {
      const dist = this.pointToSegmentDistance(
        point,
        corridorPoints[i],
        corridorPoints[i + 1],
      );
      if (dist <= widthMeters) return true;
    }

    return false;
  }

  private pointToSegmentDistance(
    point: { lat: number; lng: number },
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ): number {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;

    if (dx === 0 && dy === 0) {
      return this.calculateDistance(point.lat, point.lng, a.lat, a.lng);
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.lng - a.lng) * dx + (point.lat - a.lat) * dy) /
          (dx * dx + dy * dy),
      ),
    );

    const closestLng = a.lng + t * dx;
    const closestLat = a.lat + t * dy;

    return this.calculateDistance(point.lat, point.lng, closestLat, closestLng);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Trip Management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Start tracking a trip for a driver with a specific shipment.
   */
  async startTrip(driverId: string, shipmentId: string): Promise<void> {
    await this.redisStore.startTrip(driverId, shipmentId);
    this.logger.log(`Trip started: driver=${driverId}, shipment=${shipmentId}`);
  }

  /**
   * End the current trip for a driver.
   */
  async endTrip(driverId: string, shipmentId: string): Promise<void> {
    await this.redisStore.endTrip(driverId);
    this.logger.log(`Trip ended: driver=${driverId}, shipment=${shipmentId}`);
  }

  /**
   * Get all currently online drivers.
   */
  async getOnlineDrivers(): Promise<string[]> {
    return this.redisStore.getActiveDriverIds();
  }

  /**
   * Get driver status information.
   */
  async getDriverStatus(
    driverId: string,
  ): Promise<Record<string, string> | null> {
    return this.redisStore.getDriverStatus(driverId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Geofence Registration (for geofenceCheck)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Register a geofence for checks.
   */
  registerGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
    this.logger.log(`Geofence registered: ${geofence.name} (${geofence.id})`);
  }

  /**
   * Unregister a geofence.
   */
  unregisterGeofence(geofenceId: string): void {
    this.geofences.delete(geofenceId);
    this.logger.log(`Geofence unregistered: ${geofenceId}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Format driver location as a human-readable string.
   */
  async formatDriverLocation(driverId: string): Promise<string> {
    const loc = await this.getCurrentLocation(driverId);
    if (!loc) return `Driver ${driverId}: location unknown`;

    const coords = formatCoordinates(loc.latitude, loc.longitude);
    const speedStr = loc.speed ? ` @ ${loc.speed.toFixed(1)} km/h` : '';
    const headingStr = loc.heading
      ? ` heading ${loc.heading.toFixed(0)}°`
      : '';

    return `Driver ${driverId}: ${coords}${speedStr}${headingStr}`;
  }

  /**
   * Batch update locations for multiple drivers.
   */
  async batchUpdateLocations(
    locations: LocationData[],
  ): Promise<void> {
    for (const loc of locations) {
      await this.updateLocation(
        loc.driverId,
        loc.vehicleId,
        loc.latitude,
        loc.longitude,
        loc.speed,
        loc.heading,
        loc.accuracy,
        loc.altitude,
        loc.shipmentId,
      );
    }
  }
}
