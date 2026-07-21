/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - No-Fly Zone Entity                       │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Geofencing & airspace compliance for autonomous drones      │
 * └─────────────────────────────────────────────────────────────┘
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NoFlyZoneType {
  AIRPORT = 'airport',
  MILITARY = 'military',
  HOSPITAL = 'hospital',
  GOVERNMENT = 'government',
  SCHOOL = 'school',
  CUSTOM = 'custom',
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

@Entity('no_fly_zones')
@Index(['type'])
@Index(['effectiveFrom'])
export class NoFlyZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({
    type: 'enum',
    enum: NoFlyZoneType,
    default: NoFlyZoneType.CUSTOM,
  })
  type: NoFlyZoneType;

  /**
   * Polygon vertices in GeoJSON-style ordering
   * [ [lat, lng], [lat, lng], ... ]
   * Last point should match first to close the polygon.
   */
  @Column({ type: 'jsonb' })
  geometry: GeoPoint[];

  @Column({ type: 'int', default: 120 })
  altitudeLimit: number;

  @Column({ type: 'boolean', default: true })
  permanent: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveTo: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  /* ── Computed helpers ── */
  get isActive(): boolean {
    const now = new Date();
    if (now < this.effectiveFrom) return false;
    if (this.effectiveTo && now > this.effectiveTo) return false;
    return true;
  }

  /**
   * Returns bounding box [minLat, minLng, maxLat, maxLng] for quick
   * rejection tests before doing full point-in-polygon checks.
   */
  get boundingBox(): [number, number, number, number] {
    const lats = this.geometry.map((p) => p.lat);
    const lngs = this.geometry.map((p) => p.lng);
    return [
      Math.min(...lats),
      Math.min(...lngs),
      Math.max(...lats),
      Math.max(...lngs),
    ];
  }

  /**
   * Ray-casting algorithm: determine if a point lies inside the polygon.
   */
  containsPoint(lat: number, lng: number): boolean {
    const poly = this.geometry;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lng,
        yi = poly[i].lat;
      const xj = poly[j].lng,
        yj = poly[j].lat;
      const intersect =
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
