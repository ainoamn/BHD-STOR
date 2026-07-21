import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum RewardType {
  DISCOUNT = 'discount',
  FREE_SHIPPING = 'free_shipping',
  FREE_PRODUCT = 'free_product',
  CASHBACK = 'cashback',
}

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nameAr: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  pointsCost: number;

  @Column({
    type: 'enum',
    enum: RewardType,
  })
  type: RewardType;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  minOrderAmount: number;

  @Column({ type: 'int', nullable: true })
  stock: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
