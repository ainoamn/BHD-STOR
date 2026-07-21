import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { JournalLine } from './journal-line.entity';

export type ReferenceType = 'order' | 'payment' | 'expense' | 'adjustment' | 'payroll';
export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

@Entity('journal_entries')
@Index(['entryNumber'], { unique: true })
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  entryNumber: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string | null;

  @Column({
    type: 'enum',
    enum: ['order', 'payment', 'expense', 'adjustment', 'payroll'],
  })
  referenceType: ReferenceType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  totalDebit: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  totalCredit: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'posted', 'reversed'],
    default: 'draft',
  })
  status: JournalEntryStatus;

  @Column({ type: 'timestamptz', nullable: true })
  postedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  postedBy: string | null;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => JournalLine, (line) => line.journalEntry, {
    cascade: true,
  })
  lines: JournalLine[];
}
