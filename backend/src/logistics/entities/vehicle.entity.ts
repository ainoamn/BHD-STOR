import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  VAN = 'van',
  TRUCK = 'truck',
  REFRIGERATED_TRUCK = 'refrigerated_truck',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  ON_TRIP = 'on_trip',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.CAR,
  })
  type: VehicleType;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  plateNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  capacityWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  capacityVolume: number;

  @Column({
    type: 'enum',
    enum: FuelType,
    default: FuelType.DIESEL,
  })
  fuelType: FuelType;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @Column({ type: 'uuid', nullable: true })
  currentDriverId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  currentLocation: {
    lat: number;
    lng: number;
    timestamp: Date;
  } | null;

  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate: Date | null;

  @Column({ type: 'date', nullable: true })
  nextMaintenanceDate: Date | null;

  @Column({ type: 'int', default: 0 })
  odometer: number;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string | null;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @Column({ type: 'date', nullable: true })
  insuranceExpiry: Date | null;

  @Column({ type: 'date', nullable: true })
  registrationExpiry: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
