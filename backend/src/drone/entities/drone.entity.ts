/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Entity                             │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Futuristic drone fleet management for autonomous logistics  │
 * └─────────────────────────────────────────────────────────────┘
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DroneMission } from './drone-mission.entity';

export enum DroneType {
  DELIVERY = 'delivery',
  SURVEILLANCE = 'surveillance',
  INSPECTION = 'inspection',
}

export enum DroneStatus {
  AVAILABLE = 'available',
  IN_FLIGHT = 'in_flight',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export interface GeoLocation {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface HomeLocation {
  lat: number;
  lng: number;
}

export interface DroneCertification {
  name: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
}

@Entity('drones')
export class Drone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  serialNumber: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({
    type: 'enum',
    enum: DroneType,
    default: DroneType.DELIVERY,
  })
  type: DroneType;

  @Column({
    type: 'enum',
    enum: DroneStatus,
    default: DroneStatus.AVAILABLE,
  })
  status: DroneStatus;

  @Column({ type: 'int', default: 5000 })
  batteryCapacity: number;

  @Column({ type: 'int', default: 100 })
  currentBattery: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 2.0 })
  maxPayload: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 15.0 })
  maxRange: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 60.0 })
  maxSpeed: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  currentLocation: GeoLocation;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  homeLocation: HomeLocation;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  flightHours: number;

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenanceDate: Date;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  certifications: DroneCertification[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /* ── Relations ── */
  @OneToMany(() => DroneMission, (mission) => mission.drone)
  missions: DroneMission[];

  /* ── Computed helpers (non-persisted) ── */
  get batteryPercentage(): number {
    return this.currentBattery ?? 0;
  }

  get isAvailable(): boolean {
    return (
      this.status === DroneStatus.AVAILABLE &&
      this.currentBattery > 20
    );
  }

  get canAcceptMission(): boolean {
    return (
      this.isAvailable &&
      this.status !== DroneStatus.MAINTENANCE &&
      this.status !== DroneStatus.OFFLINE
    );
  }
}
