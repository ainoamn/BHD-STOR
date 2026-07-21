import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  TIRE_CHANGE = 'tire_change',
  OIL_CHANGE = 'oil_change',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

@Entity('maintenance_records')
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.ROUTINE,
  })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  cost: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  performedBy: string | null;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date | null;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column({ type: 'text', array: true, default: [] })
  documents: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
