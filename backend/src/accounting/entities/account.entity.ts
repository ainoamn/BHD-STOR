import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountCategory =
  | 'current_asset'
  | 'fixed_asset'
  | 'current_liability'
  | 'long_term_liability'
  | 'equity'
  | 'retained_earnings'
  | 'operating_revenue'
  | 'other_revenue'
  | 'cost_of_goods_sold'
  | 'operating_expense'
  | 'administrative_expense'
  | 'financial_expense'
  | 'other_expense';

@Entity('accounts')
@Index(['code'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  nameAr: string;

  @Column({
    type: 'enum',
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
  })
  type: AccountType;

  @Column({ type: 'varchar', length: 100 })
  category: AccountCategory;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Account, (account) => account.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Account | null;

  @OneToMany(() => Account, (account) => account.parent)
  children: Account[];

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
