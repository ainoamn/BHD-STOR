import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RouteStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.PLANNED,
  })
  status: RouteStatus;

  @Column({ type: 'jsonb', default: [] })
  stops: {
    shipmentId: string;
    sequence: number;
    estimatedArrival: Date;
    actualArrival?: Date;
    status: string;
    lat: number;
    lng: number;
    address: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  optimizedPath: { lat: number; lng: number }[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDistance: number;

  @Column({ type: 'int', default: 0 })
  estimatedDuration: number;

  @Column({ type: 'int', nullable: true })
  actualDuration: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  fuelCost: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  startTime: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
