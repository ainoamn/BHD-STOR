/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  BHD Marketplace - Drone Mission Entity                     │
 * │  (c) 2025 BHD Systems. All rights reserved.                 │
 * │  Autonomous mission orchestration for drone deliveries       │
 * └─────────────────────────────────────────────────────────────┘
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Drone } from './drone.entity';

export enum MissionType {
  DELIVERY = 'delivery',
  SURVEY = 'survey',
  INSPECTION = 'inspection',
}

export enum MissionStatus {
  PLANNED = 'planned',
  PRE_FLIGHT = 'pre_flight',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
  FAILED = 'failed',
}

export interface Waypoint {
  lat: number;
  lng: number;
  altitude: number;
  sequence: number;
  action?: 'hover' | 'land' | 'photo' | 'drop' | 'return';
  loiterTime?: number; // seconds
}

export interface WeatherConditions {
  temperature?: number;
  windSpeed?: number;
  windDirection?: number;
  visibility?: number;
  humidity?: number;
  precipitation?: boolean;
  uvIndex?: number;
  timestamp: string;
}

export interface MissionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

@Entity('drone_missions')
export class DroneMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  droneId: string;

  @Column({ type: 'uuid', nullable: true })
  shipmentId: string | null;

  @Column({
    type: 'enum',
    enum: MissionType,
    default: MissionType.DELIVERY,
  })
  type: MissionType;

  @Column({
    type: 'enum',
    enum: MissionStatus,
    default: MissionStatus.PLANNED,
  })
  status: MissionStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  waypoints: Waypoint[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  estimatedDistance: number;

  @Column({ type: 'int', default: 0 })
  estimatedDuration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualDistance: number | null;

  @Column({ type: 'int', nullable: true })
  actualDuration: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.0 })
  payloadWeight: number;

  @Column({ type: 'jsonb', nullable: true })
  weatherConditions: WeatherConditions | null;

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  logs: MissionLog[] | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /* ── Relations ── */
  @ManyToOne(() => Drone, (drone) => drone.missions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'droneId' })
  drone: Drone;

  /* ── Computed helpers ── */
  get isActive(): boolean {
    return (
      this.status === MissionStatus.PRE_FLIGHT ||
      this.status === MissionStatus.IN_PROGRESS
    );
  }

  get isTerminal(): boolean {
    return (
      this.status === MissionStatus.COMPLETED ||
      this.status === MissionStatus.ABORTED ||
      this.status === MissionStatus.FAILED
    );
  }

  get duration(): number | null {
    if (!this.startTime || !this.endTime) return null;
    return Math.round(
      (this.endTime.getTime() - this.startTime.getTime()) / 60000,
    );
  }
}
