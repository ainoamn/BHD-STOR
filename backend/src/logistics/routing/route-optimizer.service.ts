/**
 * BHD Logistics - Route Optimizer Service
 * Route optimization algorithms: Nearest Neighbor, 2-opt improvement,
 * shipment-to-driver assignment, and turn-by-turn navigation generation.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Stop,
  Route,
  OptimizedRoute,
  RouteLeg,
  TurnInstruction,
  Shipment,
  Driver,
  DriverAssignment,
  ManeuverType,
  Coordinate,
} from './types';
import {
  haversineDistance,
  haversineDistanceKm,
  calculateBearing,
  bearingToCompass,
} from '../utils/geo.utils';
import { encodePolyline } from '../utils/polyline.utils';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RouteOptimizerService {
  private readonly logger = new Logger(RouteOptimizerService.name);

  // ──────────────────────────────────────────────────────────────────────────
  // Core Optimization: Nearest Neighbor + 2-Opt
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Optimize a list of stops using Nearest Neighbor followed by 2-opt improvement.
   *
   * Algorithm:
   * 1. Start from the first stop (depot)
   * 2. Use Nearest Neighbor to build an initial route
   * 3. Apply 2-opt local search to improve the route
   *
   * @param stops - Array of stops to optimize (first stop is the depot)
   * @returns Optimized route with all metrics
   */
  optimizeStops(stops: Stop[]): OptimizedRoute {
    if (!stops || stops.length === 0) {
      throw new Error('No stops provided for optimization');
    }

    if (stops.length === 1) {
      return this.buildOptimizedRoute(stops, stops, 0, 0, 'none');
    }

    // Preserve depot as first stop
    const depot = stops[0];
    const deliveryStops = stops.slice(1);

    // Step 1: Nearest Neighbor to build initial route
    this.logger.log(
      `Running Nearest Neighbor on ${deliveryStops.length} stops`,
    );
    const nnRoute = this.nearestNeighbor(depot, deliveryStops);

    // Calculate original (unoptimized) metrics
    const originalStops = [depot, ...deliveryStops];
    const originalDistance = this.calculateTotalDistance(originalStops);
    const originalTime = this.estimateRouteTime(originalStops);

    // Step 2: 2-opt improvement
    this.logger.log('Running 2-opt improvement');
    const improvedStops = this.twoOpt(nnRoute);
    const { improvements, iterations } = this.getLast2OptStats();

    // Calculate optimized metrics
    const optimizedDistance = this.calculateTotalDistance(improvedStops);
    const optimizedTime = this.estimateRouteTime(improvedStops);

    this.logger.log(
      `Optimization complete: ${originalDistance.toFixed(2)}km -> ${optimizedDistance.toFixed(2)}km ` +
        `(${((1 - optimizedDistance / originalDistance) * 100).toFixed(1)}% savings)`,
    );

    return this.buildOptimizedRoute(
      originalStops,
      improvedStops,
      originalDistance,
      originalTime,
      'nearest_neighbor + 2-opt',
      iterations,
      improvements,
    );
  }

  /**
   * Nearest Neighbor algorithm: Build an initial route by always visiting
   * the closest unvisited stop next.
   */
  private nearestNeighbor(depot: Stop, stops: Stop[]): Stop[] {
    const unvisited = [...stops];
    const route: Stop[] = [depot];
    let current = depot;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = haversineDistance(
          current.latitude,
          current.longitude,
          unvisited[i].latitude,
          unvisited[i].longitude,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      }

      const next = unvisited.splice(nearestIndex, 1)[0];
      route.push(next);
      current = next;
    }

    return route;
  }

  // Track 2-opt stats for reporting
  private last2OptIterations = 0;
  private last2OptImprovements = 0;

  private getLast2OptStats(): { iterations: number; improvements: number } {
    return {
      iterations: this.last2OptIterations,
      improvements: this.last2OptImprovements,
    };
  }

  /**
   * 2-opt local search algorithm: Iteratively try swapping two edges
   * in the route and keep the change if it improves the total distance.
   */
  private twoOpt(stops: Stop[]): Stop[] {
    const route = [...stops];
    let improved = true;
    let iterations = 0;
    let improvements = 0;

    // 2-opt should not swap the depot (index 0)
    while (improved && iterations < 1000) {
      improved = false;
      iterations++;

      for (let i = 1; i < route.length - 1; i++) {
        for (let j = i + 1; j < route.length; j++) {
          const delta = this.twoOptDelta(route, i, j);

          if (delta < -0.01) {
            // Improvement found - reverse the segment
            this.reverseSegment(route, i, j);
            improved = true;
            improvements++;
          }
        }
      }
    }

    this.last2OptIterations = iterations;
    this.last2OptImprovements = improvements;

    return route;
  }

  /**
   * Calculate the distance change (delta) if we swap edges at i and j.
   * A negative delta means improvement.
   */
  private twoOptDelta(route: Stop[], i: number, j: number): number {
    const before =
      haversineDistance(
        route[i - 1].latitude,
        route[i - 1].longitude,
        route[i].latitude,
        route[i].longitude,
      ) +
      haversineDistance(
        route[j].latitude,
        route[j].longitude,
        route[(j + 1) % route.length].latitude,
        route[(j + 1) % route.length].longitude,
      );

    const after =
      haversineDistance(
        route[i - 1].latitude,
        route[i - 1].longitude,
        route[j].latitude,
        route[j].longitude,
      ) +
      haversineDistance(
        route[i].latitude,
        route[i].longitude,
        route[(j + 1) % route.length].latitude,
        route[(j + 1) % route.length].longitude,
      );

    return after - before;
  }

  /**
   * Reverse the segment of the route from index i to j (inclusive).
   */
  private reverseSegment(route: Stop[], i: number, j: number): void {
    while (i < j) {
      const temp = route[i];
      route[i] = route[j];
      route[j] = temp;
      i++;
      j--;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Distance & Time Calculations
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Calculate the total distance of a route (sum of all leg distances).
   *
   * @returns Total distance in kilometers
   */
  calculateTotalDistance(stops: Stop[]): number {
    if (!stops || stops.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      total += haversineDistanceKm(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude,
      );
    }

    return total;
  }

  /**
   * Calculate individual route legs.
   */
  calculateRouteLegs(stops: Stop[]): RouteLeg[] {
    if (!stops || stops.length < 2) return [];

    const legs: RouteLeg[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const fromStop = stops[i];
      const toStop = stops[i + 1];
      const distanceKm = haversineDistanceKm(
        fromStop.latitude,
        fromStop.longitude,
        toStop.latitude,
        toStop.longitude,
      );

      legs.push({
        fromStop,
        toStop,
        distanceKm,
        estimatedMinutes: (distanceKm / 40) * 60, // Default 40 km/h
      });
    }

    return legs;
  }

  /**
   * Generate an encoded polyline for the route.
   */
  calculateRoutePolyline(stops: Stop[]): string {
    if (!stops || stops.length < 2) return '';

    // Generate intermediate points for smoother lines
    const points: Coordinate[] = [];
    const pointsPerLeg = 20;

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];

      for (let j = 0; j < pointsPerLeg; j++) {
        const t = j / pointsPerLeg;
        points.push({
          lat: from.latitude + t * (to.latitude - from.latitude),
          lng: from.longitude + t * (to.longitude - from.longitude),
        });
      }
    }

    // Add the final stop
    const last = stops[stops.length - 1];
    points.push({ lat: last.latitude, lng: last.longitude });

    return encodePolyline(points);
  }

  /**
   * Estimate the total route time including service time at each stop.
   *
   * @param stops - Array of stops
   * @param avgSpeed - Average driving speed in km/h (default: 40)
   * @returns Estimated time in minutes
   */
  estimateRouteTime(stops: Stop[], avgSpeed = 40): number {
    if (!stops || stops.length < 2) return 0;

    let drivingMinutes = 0;
    let serviceMinutes = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const distKm = haversineDistanceKm(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude,
      );
      drivingMinutes += (distKm / avgSpeed) * 60;
    }

    // Add service time at each non-depot stop
    for (let i = 1; i < stops.length; i++) {
      serviceMinutes += stops[i].serviceTimeMinutes ?? 5; // Default 5 min
    }

    return drivingMinutes + serviceMinutes;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Turn-by-Turn Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generate turn-by-turn navigation instructions for a route.
   */
  generateTurnByTurn(stops: Stop[]): TurnInstruction[] {
    if (!stops || stops.length < 2) return [];

    const instructions: TurnInstruction[] = [];

    // Starting instruction
    instructions.push({
      order: 0,
      instruction: `Start from ${stops[0].address || 'depot'}`,
      distanceMeters: 0,
      durationSeconds: 0,
      maneuver: 'departure',
      startLocation: { lat: stops[0].latitude, lng: stops[0].longitude },
      endLocation: { lat: stops[0].latitude, lng: stops[0].longitude },
      streetName: stops[0].address,
    });

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];

      const distance = haversineDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude,
      );
      const bearing = calculateBearing(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude,
      );
      const durationSeconds = (distance / 1000 / 40) * 60 * 60; // 40 km/h avg

      let maneuver: ManeuverType = 'straight';
      let instruction = '';

      if (i === 0) {
        instruction = `Head ${bearingToCompass(bearing)} toward ${to.address || `stop ${i + 2}`}`;
        maneuver = 'straight';
      } else if (i === stops.length - 2) {
        instruction = `Arrive at ${to.address || 'final destination'} (${to.customerName || 'customer'})`;
        maneuver = 'destination_reached';
      } else {
        // Determine turn direction based on bearing change
        const prevBearing = calculateBearing(
          stops[i - 1].latitude,
          stops[i - 1].longitude,
          from.latitude,
          from.longitude,
        );
        const bearingDiff = ((bearing - prevBearing + 540) % 360) - 180;

        if (Math.abs(bearingDiff) < 15) {
          maneuver = 'straight';
          instruction = `Continue straight to ${to.address || `stop ${i + 2}`}`;
        } else if (bearingDiff > 0) {
          maneuver = 'turn_right';
          instruction = `Turn right toward ${to.address || `stop ${i + 2}`}`;
        } else {
          maneuver = 'turn_left';
          instruction = `Turn left toward ${to.address || `stop ${i + 2}`}`;
        }
      }

      // Add service time note for delivery stops
      if (to.serviceTimeMinutes && to.serviceTimeMinutes > 0) {
        instruction += ` (Service time: ${to.serviceTimeMinutes} min)`;
      }

      instructions.push({
        order: i + 1,
        instruction,
        distanceMeters: Math.round(distance),
        durationSeconds: Math.round(durationSeconds),
        maneuver,
        startLocation: { lat: from.latitude, lng: from.longitude },
        endLocation: { lat: to.latitude, lng: to.longitude },
        streetName: to.address,
      });
    }

    return instructions;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Shipment-to-Driver Assignment
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Assign shipments to drivers optimizing for balanced loads and minimal distance.
   *
   * Algorithm:
   * 1. Sort shipments by priority (high first) and zone
   * 2. For each shipment, find the best driver:
   *    - Same zone preferred
   *    - Has capacity remaining
   *    - Minimizes added distance
   * 3. Balance loads across drivers
   *
   * @param shipments - Array of shipments to assign
   * @param drivers - Array of available drivers
   * @returns Array of driver assignments
   */
  assignShipmentsToDrivers(
    shipments: Shipment[],
    drivers: Driver[],
  ): DriverAssignment[] {
    if (!shipments.length || !drivers.length) return [];

    this.logger.log(
      `Assigning ${shipments.length} shipments to ${drivers.length} drivers`,
    );

    // Initialize assignments
    const assignments: DriverAssignment[] = drivers
      .filter((d) => d.isActive)
      .map((driver) => ({
        driverId: driver.id,
        shipments: [] as Shipment[],
        totalDistanceKm: 0,
        estimatedTimeMinutes: 0,
        totalWeightKg: 0,
        totalVolumeM3: 0,
        stops: [] as Stop[],
      }));

    if (assignments.length === 0) {
      this.logger.warn('No active drivers available for assignment');
      return [];
    }

    // Sort shipments: high priority first, then by weight (heavy first for capacity)
    const sortedShipments = [...shipments].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.weightKg - a.weightKg;
    });

    for (const shipment of sortedShipments) {
      let bestAssignmentIndex = -1;
      let bestScore = Infinity;

      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        const driver = drivers.find((d) => d.id === assignment.driverId);

        if (!driver) continue;

        // Check capacity constraints
        const maxStops = driver.maxStopsPerRoute ?? Infinity;
        const maxWeight = driver.vehicleCapacityKg ?? Infinity;
        const maxVolume = driver.vehicleVolumeM3 ?? Infinity;

        if (assignment.shipments.length >= maxStops) continue;
        if (assignment.totalWeightKg + shipment.weightKg > maxWeight) continue;
        if (assignment.totalVolumeM3 + shipment.volumeM3 > maxVolume) continue;

        // Calculate score: lower is better
        // Factors: zone match, current load balance, distance
        let score = 0;

        // Zone match bonus
        const pickupZone = shipment.pickupStop.address;
        const deliveryZone = shipment.deliveryStop.address;
        if (
          driver.currentZone &&
          (pickupZone?.includes(driver.currentZone) ||
            deliveryZone?.includes(driver.currentZone))
        ) {
          score -= 1000; // Strong preference for zone match
        }

        // Prefer less loaded drivers for balance
        score += assignment.shipments.length * 50;
        score += assignment.totalWeightKg * 0.1;

        // Estimate added distance (from last stop or from driver current position)
        let addedDistance = 0;
        if (assignment.stops.length > 0) {
          const lastStop = assignment.stops[assignment.stops.length - 1];
          addedDistance = haversineDistanceKm(
            lastStop.latitude,
            lastStop.longitude,
            shipment.pickupStop.latitude,
            shipment.pickupStop.longitude,
          );
        }
        score += addedDistance * 10;

        if (score < bestScore) {
          bestScore = score;
          bestAssignmentIndex = i;
        }
      }

      if (bestAssignmentIndex >= 0) {
        const assignment = assignments[bestAssignmentIndex];
        assignment.shipments.push(shipment);
        assignment.totalWeightKg += shipment.weightKg;
        assignment.totalVolumeM3 += shipment.volumeM3;

        // Build stops: add pickup then delivery
        assignment.stops.push(shipment.pickupStop, shipment.deliveryStop);

        // Recalculate distance and time
        assignment.totalDistanceKm = this.calculateTotalDistance(
          assignment.stops,
        );
        assignment.estimatedTimeMinutes = this.estimateRouteTime(
          assignment.stops,
        );
      } else {
        this.logger.warn(
          `Could not assign shipment ${shipment.id}: no suitable driver`,
        );
      }
    }

    // Optimize routes for each assignment
    for (const assignment of assignments) {
      if (assignment.stops.length > 1) {
        const optimized = this.optimizeStops(assignment.stops);
        assignment.stops = optimized.optimizedStops;
        assignment.totalDistanceKm = optimized.optimizedDistanceKm;
        assignment.estimatedTimeMinutes = optimized.optimizedTimeMinutes;
      }
    }

    // Log summary
    const assignedCount = assignments.reduce(
      (sum, a) => sum + a.shipments.length,
      0,
    );
    this.logger.log(
      `Assignment complete: ${assignedCount}/${shipments.length} shipments assigned`,
    );

    return assignments.filter((a) => a.shipments.length > 0);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private buildOptimizedRoute(
    originalStops: Stop[],
    optimizedStops: Stop[],
    originalDistance: number,
    originalTime: number,
    algorithm: string,
    iterations = 0,
    improvements = 0,
  ): OptimizedRoute {
    const optimizedDistance = this.calculateTotalDistance(optimizedStops);
    const optimizedTime = this.estimateRouteTime(optimizedStops);
    const distanceSaved = Math.max(0, originalDistance - optimizedDistance);

    const legs = this.calculateRouteLegs(optimizedStops);
    const polyline = this.calculateRoutePolyline(optimizedStops);
    const turnInstructions = this.generateTurnByTurn(optimizedStops);

    return {
      originalRoute: {
        id: `route_${Date.now()}`,
        stops: originalStops,
        totalDistanceKm: originalDistance,
        estimatedTimeMinutes: originalTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      optimizedStops: optimizedStops.map((stop, index) => ({
        ...stop,
        order: index + 1,
      })),
      originalDistanceKm: originalDistance,
      optimizedDistanceKm: optimizedDistance,
      distanceSavedKm: distanceSaved,
      distanceSavedPercent:
        originalDistance > 0
          ? (distanceSaved / originalDistance) * 100
          : 0,
      originalTimeMinutes: originalTime,
      optimizedTimeMinutes: optimizedTime,
      timeSavedMinutes: Math.max(0, originalTime - optimizedTime),
      optimizationAlgorithm: algorithm,
      iterations,
      improvements,
      polyline,
      turnInstructions,
      legs,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Batch Optimization
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Optimize multiple routes in parallel.
   */
  optimizeMultipleRoutes(routes: Stop[][]): OptimizedRoute[] {
    return routes.map((stops) => this.optimizeStops(stops));
  }

  /**
   * Compare two routes and return the better one.
   */
  compareRoutes(a: OptimizedRoute, b: OptimizedRoute): OptimizedRoute {
    // Prefer shorter distance, then shorter time
    if (a.optimizedDistanceKm !== b.optimizedDistanceKm) {
      return a.optimizedDistanceKm <= b.optimizedDistanceKm ? a : b;
    }
    return a.optimizedTimeMinutes <= b.optimizedTimeMinutes ? a : b;
  }
}
