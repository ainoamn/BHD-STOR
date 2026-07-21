import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CurrencyCode {
  OMR = 'OMR',
  AED = 'AED',
  SAR = 'SAR',
  QAR = 'QAR',
  KWD = 'KWD',
  BHD = 'BHD',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

@Entity('currencies')
@Index(['code'])
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CurrencyCode,
    unique: true,
  })
  code: CurrencyCode;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  flag: string;

  @Column({ type: 'decimal', precision: 15, scale: 6, default: 1.0 })
  rate: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 3 })
  decimals: number;

  @Column({ name: 'format_template', type: 'varchar', length: 20, default: '{symbol}{amount}' })
  formatTemplate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
