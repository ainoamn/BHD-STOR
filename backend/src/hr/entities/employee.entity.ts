import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type Department =
  | 'operations'
  | 'logistics'
  | 'it'
  | 'finance'
  | 'marketing'
  | 'hr'
  | 'customer_service'
  | 'management';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';

@Entity('employees')
@Index(['employeeNumber'], { unique: true })
@Index(['userId'], { unique: true })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  employeeNumber: string;

  @Column({
    type: 'enum',
    enum: [
      'operations',
      'logistics',
      'it',
      'finance',
      'marketing',
      'hr',
      'customer_service',
      'management',
    ],
  })
  department: Department;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @Column({
    type: 'enum',
    enum: ['full_time', 'part_time', 'contract', 'intern'],
  })
  employmentType: EmploymentType;

  @Column({ type: 'date' })
  joinDate: Date;

  @Column({ type: 'date', nullable: true })
  probationEndDate: Date | null;

  @Column({ type: 'date', nullable: true })
  terminationDate: Date | null;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  salary: number;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  bankAccount: {
    bank: string;
    accountNumber: string;
    iban: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  workSchedule: {
    days: string[];
    startTime: string;
    endTime: string;
  } | null;

  @Column({ type: 'int', default: 30 })
  annualLeaveBalance: number;

  @Column({ type: 'int', default: 15 })
  sickLeaveBalance: number;

  @Column({
    type: 'enum',
    enum: ['active', 'on_leave', 'suspended', 'terminated'],
    default: 'active',
  })
  status: EmployeeStatus;

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  managerId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
