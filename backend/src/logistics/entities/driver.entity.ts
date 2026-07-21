import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LicenseType {
  MOTORCYCLE = 'motorcycle',
  LIGHT = 'light',
  HEAVY = 'heavy',
  BOTH = 'both',
}

export enum DriverStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum BackgroundCheckStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  employeeId: string;

  @Column({ type: 'varchar', length: 50 })
  licenseNumber: string;

  @Column({
    type: 'enum',
    enum: LicenseType,
    default: LicenseType.LIGHT,
  })
  licenseType: LicenseType;

  @Column({ type: 'date' })
  licenseExpiry: Date;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.ACTIVE,
  })
  status: DriverStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  successRate: number;

  @Column({ type: 'uuid', nullable: true })
  currentVehicleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  currentZoneId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  workSchedule: {
    days: string[];
    startTime: string;
    endTime: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  documents: {
    idCard?: string;
    licensePhoto?: string;
    medicalCertificate?: string;
  } | null;

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({
    type: 'enum',
    enum: BackgroundCheckStatus,
    default: BackgroundCheckStatus.PENDING,
  })
  backgroundCheck: BackgroundCheckStatus;

  @Column({ type: 'jsonb', nullable: true })
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  } | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  earnings: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
