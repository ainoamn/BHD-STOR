/**
 * BHD Logistics - Polyline Utilities
 * Google Maps polyline encoding/decoding and polyline simplification
 * using the Ramer-Douglas-Peucker algorithm.
 */

import { Coordinate } from '../routing/types';

// ─────────────────────────────────────────────────────────────────────────────
// Google Polyline Encoding/Decoding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode an array of coordinates into a Google Maps polyline string.
 *
 * @param points - Array of {lat, lng} coordinates
 * @returns Encoded polyline string
 */
export function encodePolyline(points: Coordinate[]): string {
  if (!points || points.length === 0) return '';

  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    // Convert to integer values (multiply by 1e5) and compute deltas
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    const dLat = lat - prevLat;
    const dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    result += encodeSignedNumber(dLat) + encodeSignedNumber(dLng);
  }

  return result;
}

/**
 * Decode a Google Maps polyline string into an array of coordinates.
 *
 * @param encoded - Encoded polyline string
 * @returns Array of {lat, lng} coordinates
 */
export function decodePolyline(encoded: string): Coordinate[] {
  if (!encoded || encoded.length === 0) return [];

  const points: Coordinate[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    // Decode latitude delta
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    // Decode longitude delta
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Encode a single signed integer for the polyline format.
 */
function encodeSignedNumber(num: number): string {
  const shifted = num < 0 ? ~(num << 1) : num << 1;
  return encodeNumber(shifted);
}

/**
 * Encode an unsigned integer in base-32 chunks for the polyline format.
 */
function encodeNumber(num: number): string {
  let value = num;
  let result = '';

  while (value >= 0x20) {
    result += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }

  result += String.fromCharCode(value + 63);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Polyline Simplification (Ramer-Douglas-Peucker)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simplify a polyline using the Ramer-Douglas-Peucker algorithm.
 * Reduces the number of points while preserving the overall shape.
 *
 * @param points - Array of coordinates
 * @param tolerance - Distance tolerance in meters (default: 10)
 * @returns Simplified array of coordinates
 */
export function simplifyPolyline(
  points: Coordinate[],
  tolerance = 10,
): Coordinate[] {
  if (!points || points.length <= 2) return [...points];

  const toleranceDegrees = tolerance / 111_320; // ~1 degree latitude in meters

  // Mark which points to keep
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  ramerDouglasPeucker(points, 0, points.length - 1, toleranceDegrees, keep);

  return points.filter((_, i) => keep[i]);
}

/**
 * Ramer-Douglas-Peucker recursive implementation.
 *
 * @param points - Full array of points
 * @param start - Start index
 * @param end - End index
 * @param tolerance - Tolerance in degrees
 * @param keep - Boolean array tracking which points to keep
 */
function ramerDouglasPeucker(
  points: Coordinate[],
  start: number,
  end: number,
  tolerance: number,
  keep: boolean[],
): void {
  let maxDist = 0;
  let maxIndex = -1;

  for (let i = start + 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[start], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance && maxIndex !== -1) {
    keep[maxIndex] = true;
    ramerDouglasPeucker(points, start, maxIndex, tolerance, keep);
    ramerDouglasPeucker(points, maxIndex, end, tolerance, keep);
  }
}

/**
 * Calculate the perpendicular distance from a point to a line segment.
 */
function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate,
): number {
  const dx = lineEnd.lng - lineStart.lng;
  const dy = lineEnd.lat - lineStart.lat;

  if (dx === 0 && dy === 0) {
    // Line segment is a single point
    const dLat = point.lat - lineStart.lat;
    const dLng = point.lng - lineStart.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  const t =
    ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) /
    (dx * dx + dy * dy);

  const clampedT = Math.max(0, Math.min(1, t));

  const closestLng = lineStart.lng + clampedT * dx;
  const closestLat = lineStart.lat + clampedT * dy;

  const dLat = point.lat - closestLat;
  const dLng = point.lng - closestLng;

  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ─────────────────────────────────────────────────────────────────────────────
// Polyline Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the total length of a polyline (sum of segment distances).
 * Uses Haversine formula for accurate Earth-surface distances.
 */
export function polylineLengthMeters(points: Coordinate[]): number {
  if (!points || points.length < 2) return 0;

  let total = 0;
  const EARTH_RADIUS = 6_371_000; // meters
  const DEG2RAD = Math.PI / 180;

  for (let i = 1; i < points.length; i++) {
    const lat1 = points[i - 1].lat * DEG2RAD;
    const lat2 = points[i].lat * DEG2RAD;
    const dLat = (points[i].lat - points[i - 1].lat) * DEG2RAD;
    const dLng = (points[i].lng - points[i - 1].lng) * DEG2RAD;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += EARTH_RADIUS * c;
  }

  return total;
}

/**
 * Get a point at a specific distance along a polyline.
 */
export function pointAlongPolyline(
  points: Coordinate[],
  distanceMeters: number,
): Coordinate | null {
  if (!points || points.length === 0) return null;
  if (points.length === 1 || distanceMeters <= 0) return points[0];

  let accumulated = 0;
  const EARTH_RADIUS = 6_371_000;
  const DEG2RAD = Math.PI / 180;

  for (let i = 1; i < points.length; i++) {
    const lat1 = points[i - 1].lat * DEG2RAD;
    const lat2 = points[i].lat * DEG2RAD;
    const dLat = (points[i].lat - points[i - 1].lat) * DEG2RAD;
    const dLng = (points[i].lng - points[i - 1].lng) * DEG2RAD;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const segmentLength = EARTH_RADIUS * c;

    if (accumulated + segmentLength >= distanceMeters) {
      const ratio = (distanceMeters - accumulated) / segmentLength;
      return {
        lat: points[i - 1].lat + ratio * (points[i].lat - points[i - 1].lat),
        lng: points[i - 1].lng + ratio * (points[i].lng - points[i - 1].lng),
      };
    }

    accumulated += segmentLength;
  }

  return points[points.length - 1];
}

/**
 * Generate sample points along a straight line between two coordinates.
 * Useful for creating polylines between stops.
 */
export function interpolatePoints(
  from: Coordinate,
  to: Coordinate,
  numPoints: number,
): Coordinate[] {
  if (numPoints < 2) return [from, to];

  const points: Coordinate[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    points.push({
      lat: from.lat + t * (to.lat - from.lat),
      lng: from.lng + t * (to.lng - from.lng),
    });
  }

  return points;
}

/**
 * Calculate how far along a polyline a given point is (as a ratio 0-1).
 * Finds the closest point on the polyline and returns the distance ratio.
 */
export function ratioAlongPolyline(
  points: Coordinate[],
  target: Coordinate,
): number {
  if (!points || points.length < 2) return 0;

  let minDist = Infinity;
  let bestRatio = 0;
  let accumulated = 0;
  const EARTH_RADIUS = 6_371_000;
  const DEG2RAD = Math.PI / 180;

  const totalLength = polylineLengthMeters(points);
  if (totalLength === 0) return 0;

  for (let i = 1; i < points.length; i++) {
    const lat1 = points[i - 1].lat * DEG2RAD;
    const lat2 = points[i].lat * DEG2RAD;
    const dLat = (points[i].lat - points[i - 1].lat) * DEG2RAD;
    const dLng = (points[i].lng - points[i - 1].lng) * DEG2RAD;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const segmentLength = EARTH_RADIUS * c;

    // Find closest point on segment
    const t = projectPointToSegment(points[i - 1], points[i], target);
    const closest = {
      lat: points[i - 1].lat + t * (points[i].lat - points[i - 1].lat),
      lng: points[i - 1].lng + t * (points[i].lng - points[i - 1].lng),
    };

    const dLat2 = (target.lat - closest.lat) * DEG2RAD;
    const dLng2 = (target.lng - closest.lng) * DEG2RAD;
    const a2 =
      Math.sin(dLat2 / 2) * Math.sin(dLat2 / 2) +
      Math.cos(closest.lat * DEG2RAD) *
        Math.cos(target.lat * DEG2RAD) *
        Math.sin(dLng2 / 2) *
        Math.sin(dLng2 / 2);
    const dist = EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));

    if (dist < minDist) {
      minDist = dist;
      bestRatio = (accumulated + t * segmentLength) / totalLength;
    }

    accumulated += segmentLength;
  }

  return Math.max(0, Math.min(1, bestRatio));
}

function projectPointToSegment(
  a: Coordinate,
  b: Coordinate,
  p: Coordinate,
): number {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;

  if (dx === 0 && dy === 0) return 0;

  const t =
    ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / (dx * dx + dy * dy);

  return Math.max(0, Math.min(1, t));
}
