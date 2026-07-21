import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type ReportType = 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

@Entity('financial_reports')
@Index(['type', 'periodStart', 'periodEnd'])
export class FinancialReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['balance_sheet', 'income_statement', 'cash_flow', 'trial_balance'],
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
  })
  period: ReportPeriod;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  generatedAt: Date;

  @Column({ type: 'uuid' })
  generatedBy: string;
}
