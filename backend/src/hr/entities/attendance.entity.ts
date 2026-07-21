import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave' | 'remote';

@Entity('attendance')
@Index(['employeeId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checkIn: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  checkOut: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  checkInLocation: { lat: number; lng: number } | null;

  @Column({ type: 'jsonb', nullable: true })
  checkOutLocation: { lat: number; lng: number } | null;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late', 'on_leave', 'remote'],
    default: 'absent',
  })
  status: AttendanceStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  workingHours: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeHours: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
