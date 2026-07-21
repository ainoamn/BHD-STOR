import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PayrollStatus = 'draft' | 'processed' | 'paid';

export interface AllowanceItem {
  type: string;
  amount: number;
}

export interface DeductionItem {
  type: string;
  amount: number;
}

@Entity('payrolls')
@Index(['employeeId', 'period'], { unique: true })
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  basicSalary: number;

  @Column({ type: 'jsonb', default: [] })
  allowances: AllowanceItem[];

  @Column({ type: 'jsonb', default: [] })
  deductions: DeductionItem[];

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  overtime: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  bonus: number;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  netSalary: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'processed', 'paid'],
    default: 'draft',
  })
  status: PayrollStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
