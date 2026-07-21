/**
 * BHD Logistics - Redis Location Store
 * Redis-based location storage with geospatial support for real-time tracking.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { LocationData } from '../routing/types';

// ─────────────────────────────────────────────────────────────────────────────
// Key Constants
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PREFIX = 'bhd:tracking';
const LOCATION_HASH = (driverId: string) => `${KEY_PREFIX}:location:${driverId}`;
const HISTORY_ZSET = (driverId: string) => `${KEY_PREFIX}:history:${driverId}`;
const ACTIVE_DRIVERS_SET = `${KEY_PREFIX}:active_drivers`;
const DRIVER_STATUS = (driverId: string) => `${KEY_PREFIX}:status:${driverId}`;
const VEHICLE_TO_DRIVER = (vehicleId: string) => `${KEY_PREFIX}:vehicle:${vehicleId}`;
const GEOSPATIAL_KEY = `${KEY_PREFIX}:geospatial`;

const DEFAULT_TTL_SECONDS = 86400; // 24 hours
const HISTORY_TTL_SECONDS = 7 * 86400; // 7 days

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RedisLocationStore {
  private readonly logger = new Logger(RedisLocationStore.name);

  constructor(private readonly redis: Redis) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Current Location (Hash)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Save the current location of a driver as a Redis Hash with TTL.
   */
  async saveLocation(
    driverId: string,
    location: LocationData,
  ): Promise<void> {
    const key = LOCATION_HASH(driverId);
    const pipeline = this.redis.pipeline();

    pipeline.hmset(key, {
      driverId: location.driverId,
      vehicleId: location.vehicleId,
      shipmentId: location.shipmentId || '',
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      speed: (location.speed ?? 0).toString(),
      heading: (location.heading ?? 0).toString(),
      accuracy: (location.accuracy ?? 0).toString(),
      altitude: (location.altitude ?? 0).toString(),
      timestamp: location.timestamp.toISOString(),
    });

    // Set TTL for automatic cleanup
    pipeline.expire(key, DEFAULT_TTL_SECONDS);

    // Add to active drivers set
    pipeline.sadd(ACTIVE_DRIVERS_SET, driverId);

    // Map vehicle to driver
    pipeline.set(VEHICLE_TO_DRIVER(location.vehicleId), driverId, 'EX', DEFAULT_TTL_SECONDS);

    // Update driver status
    pipeline.hmset(DRIVER_STATUS(driverId), {
      isOnline: 'true',
      lastUpdated: location.timestamp.toISOString(),
      currentShipmentId: location.shipmentId || '',
      vehicleId: location.vehicleId,
    });
    pipeline.expire(DRIVER_STATUS(driverId), DEFAULT_TTL_SECONDS);

    // Add to geospatial index if Redis supports it
    try {
      pipeline.geoadd(
        GEOSPATIAL_KEY,
        location.longitude,
        location.latitude,
        driverId,
      );
    } catch {
      // GEOADD may not be available; skip
    }

    await pipeline.exec();
    this.logger.debug(`Location saved for driver ${driverId}`);
  }

  /**
   * Get the latest location for a driver from Redis.
   */
  async getLocation(driverId: string): Promise<LocationData | null> {
    const key = LOCATION_HASH(driverId);
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return this.parseLocationData(data);
  }

  /**
   * Get latest locations for multiple drivers in a batch.
   */
  async getLocations(driverIds: string[]): Promise<Map<string, LocationData | null>> {
    if (driverIds.length === 0) return new Map();

    const pipeline = this.redis.pipeline();

    for (const driverId of driverIds) {
      pipeline.hgetall(LOCATION_HASH(driverId));
    }

    const results = await pipeline.exec();
    const locations = new Map<string, LocationData | null>();

    if (!results) return locations;

    for (let i = 0; i < driverIds.length; i++) {
      const [, data] = results[i];
      if (data && Object.keys(data).length > 0) {
        locations.set(driverIds[i], this.parseLocationData(data));
      } else {
        locations.set(driverIds[i], null);
      }
    }

    return locations;
  }

  /**
   * Get all active driver IDs.
   */
  async getActiveDriverIds(): Promise<string[]> {
    return this.redis.smembers(ACTIVE_DRIVERS_SET);
  }

  /**
   * Get locations for all active drivers.
   */
  async getAllActiveLocations(): Promise<LocationData[]> {
    const driverIds = await this.getActiveDriverIds();
    if (driverIds.length === 0) return [];

    const locationsMap = await this.getLocations(driverIds);
    const locations: LocationData[] = [];

    for (const [, loc] of locationsMap) {
      if (loc) locations.push(loc);
    }

    return locations;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Location History (Sorted Set by Timestamp)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Save a location entry to the driver's history sorted set.
   */
  async saveLocationHistory(
    driverId: string,
    location: LocationData,
  ): Promise<void> {
    const key = HISTORY_ZSET(driverId);
    const timestampMs = location.timestamp.getTime();

    const entry = JSON.stringify({
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed ?? null,
      heading: location.heading ?? null,
      accuracy: location.accuracy ?? null,
      altitude: location.altitude ?? null,
      vehicleId: location.vehicleId,
      shipmentId: location.shipmentId ?? null,
    });

    const pipeline = this.redis.pipeline();
    pipeline.zadd(key, timestampMs, entry);
    pipeline.expire(key, HISTORY_TTL_SECONDS);
    await pipeline.exec();
  }

  /**
   * Get location history for a driver within a time range.
   */
  async getLocationHistory(
    driverId: string,
    start: Date,
    end: Date,
  ): Promise<LocationData[]> {
    const key = HISTORY_ZSET(driverId);
    const startMs = start.getTime();
    const endMs = end.getTime();

    const entries = await this.redis.zrangebyscore(key, startMs, endMs);

    return entries
      .map((entry) => {
        try {
          const data = JSON.parse(entry);
          return {
            driverId,
            vehicleId: data.vehicleId,
            shipmentId: data.shipmentId ?? undefined,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed ?? undefined,
            heading: data.heading ?? undefined,
            accuracy: data.accuracy ?? undefined,
            altitude: data.altitude ?? undefined,
            timestamp: new Date(JSON.parse(entry)._timestamp || Date.now()),
          } as LocationData;
        } catch {
          return null;
        }
      })
      .filter((loc): loc is LocationData => loc !== null);
  }

  /**
   * Get the count of history entries for a driver.
   */
  async getHistoryCount(driverId: string): Promise<number> {
    return this.redis.zcard(HISTORY_ZSET(driverId));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Geospatial Queries
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Find drivers within a radius of a given point.
   * Requires Redis with GEORADIUS support.
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<Array<{ driverId: string; distance: number }>> {
    try {
      const results = await this.redis.georadius(
        GEOSPATIAL_KEY,
        lng,
        lat,
        radiusMeters,
        'm',
        'WITHDIST',
      );

      return results.map(([driverId, distance]) => ({
        driverId: driverId as string,
        distance: parseFloat(distance as string),
      }));
    } catch {
      this.logger.warn('GEORADIUS not available, falling back to scan');
      return this.findNearbyDriversFallback(lat, lng, radiusMeters);
    }
  }

  /**
   * Fallback implementation using manual distance calculation.
   */
  private async findNearbyDriversFallback(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<Array<{ driverId: string; distance: number }>> {
    const { haversineDistance } = await import('../utils/geo.utils');
    const allLocations = await this.getAllActiveLocations();
    const nearby: Array<{ driverId: string; distance: number }> = [];

    for (const loc of allLocations) {
      const dist = haversineDistance(lat, lng, loc.latitude, loc.longitude);
      if (dist <= radiusMeters) {
        nearby.push({ driverId: loc.driverId, distance: dist });
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Driver Status
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Mark a driver as offline.
   */
  async markDriverOffline(driverId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    pipeline.srem(ACTIVE_DRIVERS_SET, driverId);
    pipeline.hset(DRIVER_STATUS(driverId), 'isOnline', 'false');
    pipeline.hset(DRIVER_STATUS(driverId), 'lastUpdated', new Date().toISOString());

    // Remove from geospatial index
    try {
      pipeline.zrem(GEOSPATIAL_KEY, driverId);
    } catch {
      // Ignore if geospatial not available
    }

    await pipeline.exec();
    this.logger.debug(`Driver ${driverId} marked offline`);
  }

  /**
   * Get driver status.
   */
  async getDriverStatus(driverId: string): Promise<Record<string, string> | null> {
    const status = await this.redis.hgetall(DRIVER_STATUS(driverId));
    return Object.keys(status).length > 0 ? status : null;
  }

  /**
   * Mark a driver as on a trip.
   */
  async startTrip(driverId: string, shipmentId: string): Promise<void> {
    await this.redis.hmset(DRIVER_STATUS(driverId), {
      isOnTrip: 'true',
      currentShipmentId: shipmentId,
      tripStartTime: new Date().toISOString(),
    });
  }

  /**
   * Mark a driver's trip as ended.
   */
  async endTrip(driverId: string): Promise<void> {
    await this.redis.hmset(DRIVER_STATUS(driverId), {
      isOnTrip: 'false',
      currentShipmentId: '',
      lastTripEndTime: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Delete old location data based on TTL.
   * Redis handles TTL expiration automatically, but this can force cleanup.
   */
  async deleteOldLocations(ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<number> {
    const pattern = `${KEY_PREFIX}:location:*`;
    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl < 0 || ttl > ttlSeconds) {
          await this.redis.del(key);
          deleted++;
        }
      }
    } while (cursor !== '0');

    this.logger.log(`Cleaned up ${deleted} old location entries`);
    return deleted;
  }

  /**
   * Get the driver ID associated with a vehicle.
   */
  async getDriverByVehicle(vehicleId: string): Promise<string | null> {
    return this.redis.get(VEHICLE_TO_DRIVER(vehicleId));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private parseLocationData(data: Record<string, string>): LocationData {
    return {
      driverId: data.driverId || '',
      vehicleId: data.vehicleId || '',
      shipmentId: data.shipmentId || undefined,
      latitude: parseFloat(data.latitude) || 0,
      longitude: parseFloat(data.longitude) || 0,
      speed: data.speed ? parseFloat(data.speed) : undefined,
      heading: data.heading ? parseFloat(data.heading) : undefined,
      accuracy: data.accuracy ? parseFloat(data.accuracy) : undefined,
      altitude: data.altitude ? parseFloat(data.altitude) : undefined,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    };
  }
}
