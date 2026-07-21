import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type LeaveType = 'annual' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'paternity' | 'hajj';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

@Entity('leaves')
@Index(['employeeId', 'status'])
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({
    type: 'enum',
    enum: ['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity', 'hajj'],
  })
  type: LeaveType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int' })
  days: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  })
  status: LeaveStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
