/**
 * BHD Logistics - Geofence Service
 * Create and manage geofences, check driver entry/exit, and trigger alerts.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Geofence, GeofenceAlert, GeofenceType, GeofenceEvent, Coordinate } from '../routing/types';
import { isPointInPolygon, isPointInCircle, haversineDistance } from '../utils/geo.utils';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GeofenceService {
  private readonly logger = new Logger(GeofenceService.name);

  // In-memory storage - replace with database in production
  private geofences: Map<string, Geofence> = new Map();
  private alerts: Map<string, GeofenceAlert[]> = new Map(); // geofenceId -> alerts
  private driverGeofenceState: Map<string, Set<string>> = new Map(); // driverId -> Set<geofenceId> (currently inside)

  // ──────────────────────────────────────────────────────────────────────────
  // Geofence CRUD
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Create a new geofence.
   *
   * @param name - Geofence name
   * @param polygon - Polygon vertices for polygon type, or center/radius for circle type
   * @param type - Type of geofence ('circle', 'polygon', 'corridor')
   * @param options - Additional options
   * @returns Created geofence
   */
  createGeofence(
    name: string,
    polygon: Coordinate[],
    type: GeofenceType = 'polygon',
    options?: {
      description?: string;
      center?: Coordinate;
      radiusMeters?: number;
      corridorWidthMeters?: number;
      corridorPoints?: Coordinate[];
      isActive?: boolean;
      metadata?: Record<string, any>;
    },
  ): Geofence {
    const geofence: Geofence = {
      id: `gf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      description: options?.description,
      type,
      polygon: type === 'polygon' ? polygon : undefined,
      center: options?.center,
      radiusMeters: options?.radiusMeters,
      corridorWidthMeters: options?.corridorWidthMeters,
      corridorPoints: options?.corridorPoints,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: options?.isActive ?? true,
      metadata: options?.metadata,
    };

    this.geofences.set(geofence.id, geofence);
    this.logger.log(`Geofence created: "${name}" (${geofence.id}), type: ${type}`);

    return geofence;
  }

  /**
   * Create a circular geofence.
   */
  createCircularGeofence(
    name: string,
    center: Coordinate,
    radiusMeters: number,
    options?: { description?: string; metadata?: Record<string, any> },
  ): Geofence {
    return this.createGeofence(name, [], 'circle', {
      ...options,
      center,
      radiusMeters,
    });
  }

  /**
   * Create a polygon geofence.
   */
  createPolygonGeofence(
    name: string,
    polygon: Coordinate[],
    options?: { description?: string; metadata?: Record<string, any> },
  ): Geofence {
    if (polygon.length < 3) {
      throw new Error('Polygon geofence requires at least 3 points');
    }
    return this.createGeofence(name, polygon, 'polygon', options);
  }

  /**
   * Create a corridor geofence (polyline with width buffer).
   */
  createCorridorGeofence(
    name: string,
    corridorPoints: Coordinate[],
    corridorWidthMeters: number,
    options?: { description?: string; metadata?: Record<string, any> },
  ): Geofence {
    if (corridorPoints.length < 2) {
      throw new Error('Corridor geofence requires at least 2 points');
    }
    return this.createGeofence(name, [], 'corridor', {
      ...options,
      corridorPoints,
      corridorWidthMeters,
    });
  }

  /**
   * Get a geofence by ID.
   */
  getGeofence(id: string): Geofence | undefined {
    return this.geofences.get(id);
  }

  /**
   * Get all geofences.
   */
  getAllGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Get all active geofences.
   */
  getActiveGeofences(): Geofence[] {
    return this.getAllGeofences().filter((g) => g.isActive);
  }

  /**
   * Update a geofence.
   */
  updateGeofence(
    id: string,
    updates: Partial<Omit<Geofence, 'id' | 'createdAt'>>,
  ): Geofence | undefined {
    const geofence = this.geofences.get(id);
    if (!geofence) return undefined;

    const updated = { ...geofence, ...updates, updatedAt: new Date() };
    this.geofences.set(id, updated);
    return updated;
  }

  /**
   * Delete a geofence.
   */
  deleteGeofence(id: string): boolean {
    const deleted = this.geofences.delete(id);
    if (deleted) {
      this.alerts.delete(id);
    }
    return deleted;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Geofence Checks
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check if a driver has entered any geofence.
   * Compares current position with previous state to detect entry events.
   *
   * @param driverId - Driver ID
   * @param lat - Current latitude
   * @param lng - Current longitude
   * @returns Array of geofences that were entered
   */
  checkGeofenceEnter(
    driverId: string,
    lat: number,
    lng: number,
  ): Array<{ geofence: Geofence; alert: GeofenceAlert }> {
    const entered: Array<{ geofence: Geofence; alert: GeofenceAlert }> = [];
    const point = { lat, lng };

    // Get current geofences driver is inside
    const currentInside = this.driverGeofenceState.get(driverId) || new Set();

    for (const geofence of this.getActiveGeofences()) {
      const wasInside = currentInside.has(geofence.id);
      const isInside = this.isPointInGeofence(point, geofence);

      if (isInside && !wasInside) {
        // Driver ENTERED this geofence
        currentInside.add(geofence.id);

        const alert = this.triggerGeofenceAlert(geofence.id, driverId, 'enter', lat, lng);
        entered.push({ geofence, alert });

        this.logger.log(
          `Driver ${driverId} ENTERED geofence "${geofence.name}" (${geofence.id})`,
        );
      }
    }

    this.driverGeofenceState.set(driverId, currentInside);
    return entered;
  }

  /**
   * Check if a driver has exited any geofence.
   *
   * @param driverId - Driver ID
   * @param lat - Current latitude
   * @param lng - Current longitude
   * @returns Array of geofences that were exited
   */
  checkGeofenceExit(
    driverId: string,
    lat: number,
    lng: number,
  ): Array<{ geofence: Geofence; alert: GeofenceAlert }> {
    const exited: Array<{ geofence: Geofence; alert: GeofenceAlert }> = [];
    const point = { lat, lng };

    // Get current geofences driver is inside
    const currentInside = this.driverGeofenceState.get(driverId) || new Set();
    const stillInside = new Set<string>();

    for (const geofenceId of currentInside) {
      const geofence = this.geofences.get(geofenceId);
      if (!geofence || !geofence.isActive) continue;

      const isInside = this.isPointInGeofence(point, geofence);

      if (isInside) {
        stillInside.add(geofenceId);
      } else {
        // Driver EXITED this geofence
        const alert = this.triggerGeofenceAlert(geofence.id, driverId, 'exit', lat, lng);
        exited.push({ geofence, alert });

        this.logger.log(
          `Driver ${driverId} EXITED geofence "${geofence.name}" (${geofence.id})`,
        );
      }
    }

    this.driverGeofenceState.set(driverId, stillInside);
    return exited;
  }

  /**
   * Full geofence check: detect both entries and exits.
   */
  checkGeofences(
    driverId: string,
    lat: number,
    lng: number,
  ): {
    entered: Array<{ geofence: Geofence; alert: GeofenceAlert }>;
    exited: Array<{ geofence: Geofence; alert: GeofenceAlert }>;
    currentlyInside: Geofence[];
  } {
    const entered = this.checkGeofenceEnter(driverId, lat, lng);
    const exited = this.checkGeofenceExit(driverId, lat, lng);

    const insideIds = this.driverGeofenceState.get(driverId) || new Set();
    const currentlyInside = Array.from(insideIds)
      .map((id) => this.geofences.get(id))
      .filter((g): g is Geofence => g !== undefined);

    return { entered, exited, currentlyInside };
  }

  /**
   * Check if a point is inside a specific geofence.
   */
  private isPointInGeofence(
    point: Coordinate,
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
    point: Coordinate,
    corridorPoints: Coordinate[],
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
    point: Coordinate,
    a: Coordinate,
    b: Coordinate,
  ): number {
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;

    if (dx === 0 && dy === 0) {
      return haversineDistance(point.lat, point.lng, a.lat, a.lng);
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.lng - a.lng) * dx + (point.lat - a.lat) * dy) / (dx * dx + dy * dy),
      ),
    );

    const closestLng = a.lng + t * dx;
    const closestLat = a.lat + t * dy;

    return haversineDistance(point.lat, point.lng, closestLat, closestLng);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Driver Geofences
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get all geofences that a driver is currently inside.
   */
  getDriverGeofences(driverId: string): Geofence[] {
    const insideIds = this.driverGeofenceState.get(driverId) || new Set();
    return Array.from(insideIds)
      .map((id) => this.geofences.get(id))
      .filter((g): g is Geofence => g !== undefined && g.isActive);
  }

  /**
   * Get all geofence alerts for a specific geofence.
   */
  getGeofenceAlerts(geofenceId: string): GeofenceAlert[] {
    return this.alerts.get(geofenceId) || [];
  }

  /**
   * Get all unacknowledged alerts.
   */
  getUnacknowledgedAlerts(): GeofenceAlert[] {
    const allAlerts: GeofenceAlert[] = [];
    for (const [, alertList] of this.alerts) {
      for (const alert of alertList) {
        if (!alert.isAcknowledged) {
          allAlerts.push(alert);
        }
      }
    }
    return allAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(alertId: string): boolean {
    for (const [, alertList] of this.alerts) {
      const alert = alertList.find((a) => a.id === alertId);
      if (alert) {
        alert.isAcknowledged = true;
        return true;
      }
    }
    return false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Alert Management
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Trigger a geofence alert for a specific event.
   */
  triggerGeofenceAlert(
    geofenceId: string,
    driverId: string,
    event: GeofenceEvent,
    lat: number,
    lng: number,
  ): GeofenceAlert {
    const alert: GeofenceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      geofenceId,
      driverId,
      event,
      latitude: lat,
      longitude: lng,
      timestamp: new Date(),
      isAcknowledged: false,
    };

    // Store alert
    const existingAlerts = this.alerts.get(geofenceId) || [];
    existingAlerts.push(alert);
    this.alerts.set(geofenceId, existingAlerts);

    this.logger.log(
      `Geofence alert: ${event} - driver=${driverId}, geofence=${geofenceId}`,
    );

    return alert;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Bulk Operations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Check geofences for multiple drivers at once.
   */
  checkGeofencesBulk(
    driverLocations: Array<{ driverId: string; lat: number; lng: number }>,
  ): Array<{
    driverId: string;
    entered: Array<{ geofence: Geofence; alert: GeofenceAlert }>;
    exited: Array<{ geofence: Geofence; alert: GeofenceAlert }>;
  }> {
    return driverLocations.map(({ driverId, lat, lng }) => {
      const { entered, exited } = this.checkGeofences(driverId, lat, lng);
      return { driverId, entered, exited };
    });
  }

  /**
   * Clear all geofence state for a driver (e.g., when they go offline).
   */
  clearDriverState(driverId: string): void {
    this.driverGeofenceState.delete(driverId);
    this.logger.debug(`Cleared geofence state for driver ${driverId}`);
  }

  /**
   * Get service statistics.
   */
  getStats(): {
    totalGeofences: number;
    activeGeofences: number;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    trackedDrivers: number;
  } {
    const allGeofences = this.getAllGeofences();
    let totalAlerts = 0;
    for (const [, alerts] of this.alerts) {
      totalAlerts += alerts.length;
    }

    return {
      totalGeofences: allGeofences.length,
      activeGeofences: allGeofences.filter((g) => g.isActive).length,
      totalAlerts,
      unacknowledgedAlerts: this.getUnacknowledgedAlerts().length,
      trackedDrivers: this.driverGeofenceState.size,
    };
  }
}
