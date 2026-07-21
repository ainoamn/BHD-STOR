/**
 * BHD Logistics - Geo Utilities
 * Geolocation utilities: Haversine distance, bearing, polygon checks,
 * coordinate formatting/parsing, and geocoding mocks
 */

import { GeoPoint, Coordinate } from '../routing/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Earth radius in meters */
export const EARTH_RADIUS_METERS = 6_371_000;

/** Earth radius in kilometers */
export const EARTH_RADIUS_KM = 6_371;

/** Degrees to radians factor */
const DEG2RAD = Math.PI / 180;

/** Radians to degrees factor */
const RAD2DEG = 180 / Math.PI;

// ─────────────────────────────────────────────────────────────────────────────
// Distance Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the great-circle distance between two points on Earth using
 * the Haversine formula.
 *
 * @param lat1 - Latitude of point 1 in degrees
 * @param lng1 - Longitude of point 1 in degrees
 * @param lat2 - Latitude of point 2 in degrees
 * @param lng2 - Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = (lat2 - lat1) * DEG2RAD;
  const dLng = (lng2 - lng1) * DEG2RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG2RAD) *
      Math.cos(lat2 * DEG2RAD) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Alias for haversineDistance - returns distance in kilometers
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  return haversineDistance(lat1, lng1, lat2, lng2) / 1000;
}

/**
 * Calculate distance between two GeoPoint objects (in meters)
 */
export function distanceBetweenPoints(a: GeoPoint, b: GeoPoint): number {
  return haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bearing & Navigation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the initial bearing (compass direction) from point 1 to point 2.
 *
 * @param lat1 - Latitude of starting point in degrees
 * @param lng1 - Longitude of starting point in degrees
 * @param lat2 - Latitude of destination point in degrees
 * @param lng2 - Longitude of destination point in degrees
 * @returns Bearing in degrees (0-360), where 0 = North, 90 = East, etc.
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const lat1Rad = lat1 * DEG2RAD;
  const lat2Rad = lat2 * DEG2RAD;
  const dLng = (lng2 - lng1) * DEG2RAD;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = Math.atan2(y, x) * RAD2DEG;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Convert a bearing in degrees to a compass direction string.
 */
export function bearingToCompass(bearing: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Calculate a destination point given a starting point, distance, and bearing.
 *
 * @param lat - Starting latitude in degrees
 * @param lng - Starting longitude in degrees
 * @param distance - Distance to travel in meters
 * @param bearing - Bearing in degrees (0-360)
 * @returns Destination coordinate
 */
export function destinationPoint(
  lat: number,
  lng: number,
  distance: number,
  bearing: number,
): Coordinate {
  const latRad = lat * DEG2RAD;
  const lngRad = lng * DEG2RAD;
  const bearingRad = bearing * DEG2RAD;
  const angularDistance = distance / EARTH_RADIUS_METERS;

  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad),
  );

  const destLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) *
        Math.sin(angularDistance) *
        Math.cos(latRad),
      Math.cos(angularDistance) -
        Math.sin(latRad) * Math.sin(destLatRad),
    );

  return {
    lat: destLatRad * RAD2DEG,
    lng: destLngRad * RAD2DEG,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Polygon & Geofence Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a point lies inside a polygon using the ray-casting algorithm.
 *
 * @param point - The point to test
 * @param polygon - Array of polygon vertices (closed or open)
 * @returns True if the point is inside the polygon
 */
export function isPointInPolygon(
  point: Coordinate,
  polygon: Coordinate[],
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  let j = polygon.length - 1;

  for (let i = 0; i < polygon.length; i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
}

/**
 * Check if a point is inside a circular geofence.
 *
 * @param point - The point to test
 * @param center - Circle center
 * @param radiusMeters - Circle radius in meters
 * @returns True if point is inside the circle
 */
export function isPointInCircle(
  point: Coordinate,
  center: Coordinate,
  radiusMeters: number,
): boolean {
  const distance = haversineDistance(
    point.lat,
    point.lng,
    center.lat,
    center.lng,
  );
  return distance <= radiusMeters;
}

/**
 * Calculate the area of a polygon on Earth's surface (approximate) in square meters.
 * Uses the shoelace formula projected to local coordinates.
 */
export function polygonArea(polygon: Coordinate[]): number {
  if (polygon.length < 3) return 0;

  // Use the centroid as a local projection origin
  let centerLat = 0;
  let centerLng = 0;
  for (const p of polygon) {
    centerLat += p.lat;
    centerLng += p.lng;
  }
  centerLat /= polygon.length;
  centerLng /= polygon.length;

  // Convert to local Cartesian (meters from center)
  const cosLat = Math.cos(centerLat * DEG2RAD);
  const localPoints = polygon.map((p) => ({
    x: (p.lng - centerLng) * DEG2RAD * EARTH_RADIUS_METERS * cosLat,
    y: (p.lat - centerLat) * DEG2RAD * EARTH_RADIUS_METERS,
  }));

  // Shoelace formula
  let area = 0;
  let j = localPoints.length - 1;
  for (let i = 0; i < localPoints.length; i++) {
    area +=
      (localPoints[j].x + localPoints[i].x) *
      (localPoints[j].y - localPoints[i].y);
    j = i;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate the centroid (geometric center) of a polygon.
 */
export function polygonCentroid(polygon: Coordinate[]): Coordinate {
  let lat = 0;
  let lng = 0;
  for (const p of polygon) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / polygon.length, lng: lng / polygon.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Coordinate Formatting & Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format latitude and longitude as a human-readable string.
 *
 * @param lat - Latitude in degrees
 * @param lng - Longitude in degrees
 * @param precision - Decimal places (default: 6)
 * @returns Formatted string, e.g. "40.712776, -74.005974"
 */
export function formatCoordinates(
  lat: number,
  lng: number,
  precision = 6,
): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Format coordinates in DMS (Degrees, Minutes, Seconds) notation.
 */
export function formatCoordinatesDMS(lat: number, lng: number): string {
  const latDMS = decimalToDMS(lat, 'lat');
  const lngDMS = decimalToDMS(lng, 'lng');
  return `${latDMS}, ${lngDMS}`;
}

function decimalToDMS(
  decimal: number,
  type: 'lat' | 'lng',
): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  const direction =
    type === 'lat'
      ? decimal >= 0
        ? 'N'
        : 'S'
      : decimal >= 0
        ? 'E'
        : 'W';

  return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
}

/**
 * Parse coordinates from various input formats:
 * - "40.712776, -74.005974"
 * - "40.712776,-74.005974"
 * - { lat: 40.712776, lng: -74.005974 }
 * - [40.712776, -74.005974]
 */
export function parseCoordinates(
  input: string | { lat: number; lng: number } | [number, number],
): Coordinate {
  if (typeof input === 'string') {
    const cleaned = input.replace(/[^0-9.,\-]/g, '');
    const parts = cleaned.split(',');
    if (parts.length !== 2) {
      throw new Error(`Invalid coordinate string: "${input}"`);
    }
    return {
      lat: parseFloat(parts[0]),
      lng: parseFloat(parts[1]),
    };
  }

  if (Array.isArray(input)) {
    if (input.length < 2) {
      throw new Error('Coordinate array must have at least 2 elements');
    }
    return { lat: input[0], lng: input[1] };
  }

  return { lat: input.lat, lng: input.lng };
}

// ─────────────────────────────────────────────────────────────────────────────
// Speed & ETA Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate time of arrival given distance and average speed.
 *
 * @param distanceKm - Distance in kilometers
 * @param speedKmh - Average speed in km/h (default: 40)
 * @returns Estimated time in minutes
 */
export function estimateTime(distanceKm: number, speedKmh = 40): number {
  if (speedKmh <= 0) return Infinity;
  return (distanceKm / speedKmh) * 60;
}

/**
 * Calculate ETA as a Date object from current time.
 */
export function calculateETA(
  distanceKm: number,
  speedKmh = 40,
  fromTime: Date = new Date(),
): Date {
  const minutes = estimateTime(distanceKm, speedKmh);
  return new Date(fromTime.getTime() + minutes * 60_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Geocoding (Mock implementations - replace with real service)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock reverse geocoding: Convert coordinates to an address.
 * In production, replace with a call to Google Maps, Mapbox, or similar.
 */
export async function getAddressFromCoordinates(
  lat: number,
  lng: number,
): Promise<string> {
  // Placeholder: In production, call a geocoding API
  // Example: return fetch(`https://api.geocoding.com/reverse?lat=${lat}&lon=${lng}`)
  return `${lat.toFixed(4)}, ${lng.toFixed(4)} (mock address)`;
}

/**
 * Mock forward geocoding: Convert an address to coordinates.
 * In production, replace with a call to Google Maps, Mapbox, or similar.
 */
export async function getCoordinatesFromAddress(
  address: string,
): Promise<Coordinate | null> {
  // Placeholder: In production, call a geocoding API
  // Example: return fetch(`https://api.geocoding.com/geocode?q=${encodeURI(address)}`)
  // Return mock coordinates based on a hash of the address
  const hash = hashString(address);
  return {
    lat: ((hash % 18000) / 100) - 90,
    lng: ((hash % 36000) / 100) - 180,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bounding Box & Clustering Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate a bounding box that contains all given coordinates with optional padding.
 */
export function calculateBoundingBox(
  coordinates: Coordinate[],
  paddingKm = 0,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (coordinates.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const c of coordinates) {
    minLat = Math.min(minLat, c.lat);
    maxLat = Math.max(maxLat, c.lat);
    minLng = Math.min(minLng, c.lng);
    maxLng = Math.max(maxLng, c.lng);
  }

  if (paddingKm > 0) {
    const latPad = (paddingKm / EARTH_RADIUS_KM) * RAD2DEG;
    const lngPad =
      (paddingKm / (EARTH_RADIUS_KM * Math.cos(minLat * DEG2RAD))) * RAD2DEG;
    minLat -= latPad;
    maxLat += latPad;
    minLng -= lngPad;
    maxLng += lngPad;
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Check if a bounding box contains a point.
 */
export function boundingBoxContains(
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  point: Coordinate,
): boolean {
  return (
    point.lat >= bbox.minLat &&
    point.lat <= bbox.maxLat &&
    point.lng >= bbox.minLng &&
    point.lng <= bbox.maxLng
  );
}
