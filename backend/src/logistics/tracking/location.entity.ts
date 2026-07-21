/**
 * BHD Logistics - Location Entity
 * TypeORM entity for storing historical GPS location data.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('location_history')
@Index(['driverId', 'timestamp'])
export class LocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({ type: 'uuid', nullable: true })
  shipmentId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  speed: number | null; // km/h

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  heading: number | null; // degrees, 0-360

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  accuracy: number | null; // meters (GPS accuracy)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  altitude: number | null; // meters above sea level

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  // ──────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get location as a simple coordinate object.
   */
  getCoordinate(): { lat: number; lng: number } {
    return {
      lat: parseFloat(this.latitude.toString()),
      lng: parseFloat(this.longitude.toString()),
    };
  }

  /**
   * Check if this location has valid coordinates.
   */
  hasValidCoordinates(): boolean {
    const lat = parseFloat(this.latitude.toString());
    const lng = parseFloat(this.longitude.toString());
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  /**
   * Format the timestamp to ISO string.
   */
  getFormattedTimestamp(): string {
    return this.timestamp.toISOString();
  }
}
