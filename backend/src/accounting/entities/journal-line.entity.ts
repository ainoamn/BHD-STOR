import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';

@Entity('journal_lines')
export class JournalLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  journalEntryId: string;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: JournalEntry;

  @Column({ type: 'uuid' })
  accountId: string;

  @ManyToOne(() => Account, (account) => account.id)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  credit: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
